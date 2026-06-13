/**
 * routes/tasks.js
 * ────────────────────────────────────────────────────────────────────────
 * A PROTECTED example resource: the signed-in user's onboarding tasks.
 *
 *   GET /api/tasks      (requires a valid JWT)
 *
 * The route is guarded by authMiddleware. It then uses the ServiceNow
 * integration token to fetch tasks scoped to the authenticated user and
 * returns a clean, minimal shape (never the raw ServiceNow record).
 */

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const config = require('../config');
const serviceNow = require('../services/serviceNowClient');

const router = express.Router();

// `authMiddleware` runs first — no valid JWT, no access (401).
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Scope the query to the authenticated user. req.user.id is the
    // ServiceNow sys_id embedded in the JWT — so a user can only ever
    // read their OWN tasks, even though we query with the service token.
    const snQuery = `assigned_to=${req.user.id}^ORDERBYDESCsys_created_on`;
    const url =
      `${config.serviceNow.tableApi}/x_onboarding_task` +
      `?sysparm_query=${encodeURIComponent(snQuery)}` +
      `&sysparm_limit=100&sysparm_display_value=true`;

    const { data } = await serviceNow.get(url);

    // Transform ServiceNow records into a stable client contract.
    const tasks = (data.result || []).map((t) => ({
      id: t.sys_id,
      title: t.short_description || t.title || 'Untitled task',
      status: t.state || t.status || 'unknown',
      dueDate: t.due_date || null,
    }));

    return res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    // 502 Bad Gateway: the failure is UPSTREAM (ServiceNow), not the client's.
    console.error('[tasks] fetch error:', err.message);
    return res.status(502).json({ success: false, error: 'Could not load tasks from ServiceNow.' });
  }
});

module.exports = router;
