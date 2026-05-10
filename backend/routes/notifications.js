const express = require('express');
const snowClient = require('../services/snowClient');
const config = require('../config');
const logger = require('../services/logger');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const TABLE = `${config.snowScope}_notification`;

/* ── In-memory fallback store when ServiceNow table is not yet created ─── */
const memoryStore = [];
let memoryId = 1;

function getUserFilter(req) {
    // Admins see all; others see only their own or broadcast notifications
    if (req.user.role === 'hr') return null;
    return `recipient=${req.user.userId}^ORrecipient=ALL^ORtype=Broadcast`;
}

/* ── GET all notifications ──────────────────────────────────────────────── */
router.get('/', verifyToken, async (req, res, next) => {
    try {
        const query = getUserFilter(req);
        const url = query ? `/${TABLE}?sysparm_query=${encodeURIComponent(query)}&sysparm_display_value=all` : `/${TABLE}?sysparm_display_value=all`;
        const response = await snowClient.get(url);
        const items = (response.data.result || []).map(n => ({
            sys_id: n.sys_id,
            title: n.title?.display_value ?? n.title,
            message: n.message?.display_value ?? n.message,
            type: n.type?.display_value ?? n.type ?? 'Info',
            recipient: n.recipient?.display_value ?? n.recipient ?? 'ALL',
            read: n.read?.value === true || n.read === true || n.read?.display_value === 'true',
            created: n.sys_created_on?.display_value ?? n.sys_created_on,
            createdBy: n.sys_created_by?.display_value ?? n.sys_created_by
        }));
        res.json(items);
    } catch (err) {
        logger.warn('ServiceNow notifications unavailable, serving in-memory fallback');
        const visible = req.user.role === 'hr'
            ? memoryStore
            : memoryStore.filter(n => n.recipient === req.user.userId || n.recipient === 'ALL' || n.type === 'Broadcast');
        res.json(visible);
    }
});

/* ── POST create notification ───────────────────────────────────────────── */
router.post('/', verifyToken, requireRole('hr', 'manager'), async (req, res, next) => {
    try {
        const payload = {
            title: req.body.title,
            message: req.body.message,
            type: req.body.type || 'Info',
            recipient: req.body.recipient || 'ALL'
        };
        const response = await snowClient.post(`/${TABLE}`, payload);
        logger.info('Notification created', { id: response.data.result?.sys_id });
        res.status(201).json({ success: true, data: response.data.result });
    } catch (err) {
        // In-memory fallback when ServiceNow table missing
        const item = {
            sys_id: String(memoryId++),
            title: req.body.title,
            message: req.body.message,
            type: req.body.type || 'Info',
            recipient: req.body.recipient || 'ALL',
            read: false,
            created: new Date().toISOString(),
            createdBy: req.user.userName
        };
        memoryStore.push(item);
        logger.info('Notification stored in-memory', { id: item.sys_id });
        res.status(201).json({ success: true, data: item, note: 'Stored in-memory (ServiceNow table not configured).' });
    }
});

/* ── PUT mark as read ───────────────────────────────────────────────────── */
router.put('/:id/read', verifyToken, async (req, res, next) => {
    try {
        await snowClient.patch(`/${TABLE}/${req.params.id}`, { read: true });
        res.json({ success: true, message: 'Marked as read.' });
    } catch (err) {
        const idx = memoryStore.findIndex(n => n.sys_id === req.params.id);
        if (idx !== -1) {
            memoryStore[idx].read = true;
            return res.json({ success: true, message: 'Marked as read (in-memory).' });
        }
        next(new Error('Notification not found.'));
    }
});

/* ── DELETE notification ────────────────────────────────────────────────── */
router.delete('/:id', verifyToken, requireRole('hr'), async (req, res, next) => {
    try {
        await snowClient.delete(`/${TABLE}/${req.params.id}`);
        res.json({ success: true, message: 'Notification deleted.' });
    } catch (err) {
        const idx = memoryStore.findIndex(n => n.sys_id === req.params.id);
        if (idx !== -1) {
            memoryStore.splice(idx, 1);
            return res.json({ success: true, message: 'Notification deleted (in-memory).' });
        }
        next(new Error('Notification not found.'));
    }
});

/* ── POST broadcast to teams ────────────────────────────────────────────── */
router.post('/broadcast', verifyToken, requireRole('hr', 'manager'), async (req, res, next) => {
    try {
        const { title, message, target } = req.body; // target: 'ALL', 'HR', 'IT', 'Employees'
        const payload = {
            title: title || 'Broadcast Alert',
            message: message || '',
            type: 'Broadcast',
            recipient: target || 'ALL'
        };
        const response = await snowClient.post(`/${TABLE}`, payload);
        logger.info('Broadcast sent', { id: response.data.result?.sys_id, target });
        res.status(201).json({ success: true, data: response.data.result });
    } catch (err) {
        const item = {
            sys_id: String(memoryId++),
            title: req.body.title || 'Broadcast Alert',
            message: req.body.message || '',
            type: 'Broadcast',
            recipient: req.body.target || 'ALL',
            read: false,
            created: new Date().toISOString(),
            createdBy: req.user.userName
        };
        memoryStore.push(item);
        logger.info('Broadcast stored in-memory', { id: item.sys_id });
        res.status(201).json({ success: true, data: item, note: 'Stored in-memory (ServiceNow table not configured).' });
    }
});

/* ── GET unread count ───────────────────────────────────────────────────── */
router.get('/unread-count', verifyToken, async (req, res, next) => {
    try {
        const query = getUserFilter(req);
        const url = query
            ? `/${TABLE}?sysparm_query=${encodeURIComponent(query + '^read=false')}&sysparm_count=true`
            : `/${TABLE}?sysparm_query=read=false&sysparm_count=true`;
        const response = await snowClient.get(url);
        res.json({ count: response.data.result?.length || 0 });
    } catch (err) {
        const visible = req.user.role === 'hr'
            ? memoryStore
            : memoryStore.filter(n => n.recipient === req.user.userId || n.recipient === 'ALL' || n.type === 'Broadcast');
        res.json({ count: visible.filter(n => !n.read).length });
    }
});

module.exports = router;
