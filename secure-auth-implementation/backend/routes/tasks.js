/**
 * backend/routes/tasks.js
 * ════════════════════════════════════════════════════════════════════════
 * Example PROTECTED route: the signed-in user's onboarding tasks.
 *
 *   GET /api/tasks      (requires a valid JWT)
 *
 * Demonstrates how to guard a route with authMiddleware and then use the
 * ServiceNow integration token to fetch data scoped to the authenticated user.
 *
 * Drop-in usage in your Express app:
 *     app.use('/api/tasks', require('./backend/routes/tasks'));
 */

const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
require('dotenv').config();

const router = express.Router();

/* ServiceNow integration client (Bearer token).
 * (In a larger codebase, share one client via services/serviceNowClient.js.) */
const serviceNow = axios.create({
  baseURL: (process.env.SERVICENOW_INSTANCE || '').replace(/\/+$/, ''),
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.SERVICENOW_API_TOKEN}`,
  },
});

const TABLE_API = '/api/now/table';

// `authMiddleware` runs FIRST — no valid JWT, no access (401).
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Scope the query to the authenticated user. req.user.id is the ServiceNow
    // sys_id embedded in the JWT, so a user can only read their OWN tasks even
    // though we query with the shared integration token.
    const snQuery = `assigned_to=${req.user.id}^ORDERBYDESCsys_created_on`;
    const url =
      `${TABLE_API}/x_onboarding_task` +
      `?sysparm_query=${encodeURIComponent(snQuery)}` +
      `&sysparm_limit=100&sysparm_display_value=true`;

    const { data } = await serviceNow.get(url);

    // Transform ServiceNow records into a stable, minimal client contract
    // (never return the raw record).
    const tasks = (data.result || []).map((t) => ({
      id: t.sys_id,
      title: t.short_description || t.title || 'Untitled task',
      status: t.state || t.status || 'unknown',
      dueDate: t.due_date || null,
    }));

    return res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    // 502 Bad Gateway: the failure is UPSTREAM (ServiceNow), not the client's request.
    console.error('[tasks] fetch error:', err.message);
    return res.status(502).json({ success: false, error: 'Could not load tasks from ServiceNow.' });
  }
});

module.exports = router;
