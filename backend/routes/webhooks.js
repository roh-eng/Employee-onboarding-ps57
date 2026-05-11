const express = require('express');
const crypto = require('crypto');
const logger = require('../services/logger');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/* ── In-memory webhook registry (production: move to ServiceNow table) ──── */
const webhooks = new Map();

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
router.post('/test/:id', verifyToken, requireRole('hr'), async (req, res, next) => {
    try {
        const hook = webhooks.get(req.params.id);
        if (!hook) return res.status(404).json({ success: false, error: 'Webhook not found.' });

        const payload = {
            event: 'test',
            timestamp: new Date().toISOString(),
            data: { message: 'This is a test webhook payload from Enterprise Workflow Hub.' }
        };

        // Simulate delivery
        logger.info('Test webhook payload generated', { hookId: hook.id, payload });
        res.json({ success: true, message: 'Test payload generated.', payload, targetUrl: hook.url });
    } catch (err) { next(err); }
});

/* ── POST /webhooks/incoming/hrms ───────────────────────────────────────── */
/* External HRMS systems can POST employee data here */
router.post('/incoming/hrms', async (req, res, next) => {
    try {
        const { employee, source, signature } = req.body;
        if (!employee || !source) {
            return res.status(400).json({ success: false, error: 'employee and source are required.' });
        }

        logger.info('HRMS webhook received', { source, employeeName: employee.name });

        // TODO: Validate signature, transform payload, forward to ServiceNow
        // This stub demonstrates the connector pattern for SAP / Workday integration

        res.status(202).json({
            success: true,
            message: 'HRMS payload accepted for processing.',
            received: {
                source,
                employeeName: employee.name,
                employeeEmail: employee.email,
                timestamp: new Date().toISOString()
            }
        });
    } catch (err) { next(err); }
});

module.exports = router;
