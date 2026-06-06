const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const snowClient = require('../services/snowClient');
const config = require('../config');
const logger = require('../services/logger');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/* ── In-memory webhook registry (production: move to ServiceNow table) ──── */
const webhooks = new Map();

/* ── Delivery helpers ───────────────────────────────────────────────────── */

// HMAC-SHA256 signature of the payload, so receivers can verify authenticity.
function signPayload(secret, bodyString) {
    return crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
}

/**
 * Deliver a single event to one webhook endpoint. Never throws — returns a
 * result object so callers (and fan-out) can log without crashing the request.
 */
async function deliver(hook, event, data) {
    const payload = { event, timestamp: new Date().toISOString(), data };
    const body = JSON.stringify(payload);
    const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-Id': hook.id
    };
    if (hook.secret) headers['X-Webhook-Signature'] = `sha256=${signPayload(hook.secret, body)}`;

    try {
        const res = await axios.post(hook.url, body, { headers, timeout: 5000 });
        logger.info('Webhook delivered', { hookId: hook.id, event, url: hook.url, status: res.status });
        return { id: hook.id, url: hook.url, ok: true, status: res.status };
    } catch (err) {
        const status = err.response?.status;
        logger.warn('Webhook delivery failed', { hookId: hook.id, event, url: hook.url, status, error: err.message });
        return { id: hook.id, url: hook.url, ok: false, status: status || 0, error: err.message };
    }
}

/**
 * Fan-out an event to every active webhook subscribed to it. Fire-and-forget
 * from the caller's perspective (returns a promise but callers need not await).
 */
async function fireEvent(event, data) {
    const targets = [...webhooks.values()].filter(h => h.active && Array.isArray(h.events) && h.events.includes(event));
    if (!targets.length) return [];
    logger.info('Firing webhook event', { event, targets: targets.length });
    const results = await Promise.allSettled(targets.map(h => deliver(h, event, data)));
    return results.map(r => (r.status === 'fulfilled' ? r.value : { ok: false, error: String(r.reason) }));
}

/* ── POST /webhooks/register ────────────────────────────────────────────── */
router.post('/register', verifyToken, requireRole('hr'), async (req, res, next) => {
    try {
        const { url, events, secret } = req.body;
        if (!url || !events || !Array.isArray(events)) {
            return res.status(400).json({ success: false, error: 'url and events array are required.' });
        }

        const id = crypto.randomUUID();
        const hook = {
            id,
            url,
            events,
            secret: secret || null,
            active: true,
            createdBy: req.user.userId,
            createdAt: new Date().toISOString()
        };
        webhooks.set(id, hook);
        logger.info('Webhook registered', { id, url, events });
        res.status(201).json({ success: true, data: { id, url, events, active: true } });
    } catch (err) { next(err); }
});

/* ── GET /webhooks ──────────────────────────────────────────────────────── */
router.get('/', verifyToken, requireRole('hr'), async (req, res, next) => {
    try {
        const all = Array.from(webhooks.values()).map(h => ({
            id: h.id,
            url: h.url,
            events: h.events,
            active: h.active,
            createdAt: h.createdAt
        }));
        res.json(all);
    } catch (err) { next(err); }
});

/* ── DELETE /webhooks/:id ───────────────────────────────────────────────── */
router.delete('/:id', verifyToken, requireRole('hr'), async (req, res, next) => {
    try {
        const deleted = webhooks.delete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, error: 'Webhook not found.' });
        logger.info('Webhook deleted', { id: req.params.id });
        res.json({ success: true, message: 'Webhook deleted.' });
    } catch (err) { next(err); }
});

/* ── POST /webhooks/test/:id ────────────────────────────────────────────── */
/* Performs a REAL signed delivery to the registered URL and reports the result. */
router.post('/test/:id', verifyToken, requireRole('hr'), async (req, res, next) => {
    try {
        const hook = webhooks.get(req.params.id);
        if (!hook) return res.status(404).json({ success: false, error: 'Webhook not found.' });

        const result = await deliver(hook, 'test', {
            message: 'This is a test webhook payload from Enterprise Workflow Hub.'
        });

        if (result.ok) {
            res.json({ success: true, message: `Test delivered (HTTP ${result.status}).`, result });
        } else {
            res.status(502).json({ success: false, message: 'Test delivery failed.', result });
        }
    } catch (err) { next(err); }
});

/* ── POST /webhooks/incoming/hrms ───────────────────────────────────────── */
/* External HRMS systems (SAP / Workday) POST employee data here. When
 * HRMS_WEBHOOK_SECRET is configured we verify an HMAC signature, then transform
 * the payload and forward it to the ServiceNow employee table. */
router.post('/incoming/hrms', async (req, res, next) => {
    try {
        const { employee, source, signature } = req.body;
        if (!employee || !source) {
            return res.status(400).json({ success: false, error: 'employee and source are required.' });
        }

        // Signature verification (only enforced when a shared secret is configured)
        if (config.hrmsWebhookSecret) {
            const expected = signPayload(config.hrmsWebhookSecret, JSON.stringify(employee));
            const provided = (signature || '').replace(/^sha256=/, '');
            const a = Buffer.from(expected);
            const b = Buffer.from(provided);
            if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
                logger.warn('HRMS webhook rejected: invalid signature', { source });
                return res.status(401).json({ success: false, error: 'Invalid signature.' });
            }
        }

        // Transform the external payload into our ServiceNow employee schema
        const payload = {
            name: employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
            email: employee.email,
            department: employee.department || employee.dept || 'Unassigned',
            joining_date: employee.joiningDate || employee.startDate || new Date().toISOString().slice(0, 10),
            status: 'Pending'
        };

        if (!payload.name || !payload.email) {
            return res.status(400).json({ success: false, error: 'employee.name and employee.email are required.' });
        }

        try {
            const response = await snowClient.post(`/${config.snowScope}_employee`, payload);
            const created = response.data.result;
            logger.info('HRMS employee forwarded to ServiceNow', { source, id: created?.sys_id, email: payload.email });

            // Notify any of our own subscribers that an employee was created
            fireEvent('employee.created', { id: created?.sys_id, name: payload.name, email: payload.email, source })
                .catch(e => logger.warn('employee.created fan-out failed', { error: e.message }));

            res.status(201).json({
                success: true,
                message: 'HRMS payload forwarded to ServiceNow.',
                employee: { id: created?.sys_id, name: payload.name, email: payload.email, source }
            });
        } catch (snErr) {
            logger.error('HRMS forward to ServiceNow failed', { source, error: snErr.message });
            res.status(502).json({ success: false, error: 'Failed to forward employee to ServiceNow.' });
        }
    } catch (err) { next(err); }
});

module.exports = router;
// Expose the event fan-out so other routes can trigger deliveries without a circular import.
module.exports.fireEvent = fireEvent;
