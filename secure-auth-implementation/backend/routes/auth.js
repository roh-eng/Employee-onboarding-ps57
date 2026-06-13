/**
 * backend/routes/auth.js
 * ════════════════════════════════════════════════════════════════════════
 * Authentication endpoint.
 *
 *   POST /api/auth/login   { username, password }  ->  { token, user } | 401
 *
 * Credentials are validated against ServiceNow using a server-side INTEGRATION
 * TOKEN (Bearer) — never per-user ServiceNow passwords, and never anything
 * sensitive in the browser. On success we mint our own short-lived JWT.
 *
 * Drop-in usage in your Express app:
 *     app.use('/api/auth', require('./backend/routes/auth'));
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

/* ── ServiceNow integration client ──────────────────────────────────────
 * Authenticates with a single token (Bearer). This token lives ONLY on the
 * server (in .env) and is never exposed to the frontend.
 * (In a larger codebase, extract this into services/serviceNowClient.js.) */
const serviceNow = axios.create({
  baseURL: (process.env.SERVICENOW_INSTANCE || '').replace(/\/+$/, ''),
  timeout: 10000, // fail fast instead of hanging
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.SERVICENOW_API_TOKEN}`,
  },
});

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const VALIDATE_PATH = process.env.SERVICENOW_VALIDATE_PATH || '/api/x_auth/secure_auth/validate';

/* ── Lightweight in-memory login rate limiter (per IP) ───────────────────
 * Blunts brute-force / credential-stuffing. In production prefer
 * `express-rate-limit` backed by a shared store (e.g. Redis). */
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

function loginRateLimit(req, res, next) {
  const ip = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
  const now = Date.now();
  const rec = attempts.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > rec.resetAt) { rec.count = 0; rec.resetAt = now + WINDOW_MS; }
  rec.count += 1;
  attempts.set(ip, rec);
  if (rec.count > MAX_ATTEMPTS) {
    return res.status(429).json({ success: false, error: 'Too many login attempts. Please try again later.' });
  }
  next();
}

/**
 * Validate a user's credentials against ServiceNow.
 *
 * A single integration token can READ ServiceNow data, but it cannot read a
 * user's password (hashed in sys_user). So credential checking is delegated to
 * a small ServiceNow Scripted REST API the token is allowed to call. It takes
 * { username, password } and returns { valid, sysId, name, roles }.
 * (See README → "ServiceNow setup" for the server-side script, plus the
 * OAuth-password-grant alternative.)
 *
 * @returns {Promise<null | { sysId, name, roles }>}  null when invalid.
 */
async function validateUserCredentials(username, password) {
  const { data } = await serviceNow.post(VALIDATE_PATH, { username, password });
  const result = data && (data.result || data); // ServiceNow often wraps in `result`
  if (!result || result.valid !== true) return null;
  return {
    sysId: result.sysId,
    name: result.name || username,
    email: result.email || null, // surfaced to the client so the dashboard can show it
    roles: Array.isArray(result.roles) ? result.roles : [],
  };
}

/** Map ServiceNow roles to an app role (highest privilege wins). */
function resolveAppRole(roles) {
  const lower = roles.map((r) => String(r).toLowerCase());
  if (lower.some((r) => r.includes('admin') || r.includes('hr'))) return 'hr';
  if (lower.some((r) => r.includes('manager') || r.includes('itil'))) return 'manager';
  return 'employee';
}

/* ── POST /api/auth/login ───────────────────────────────────────────────── */
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { username, password } = req.body || {};

    // 1) Validate input — never trust the client.
    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    // 2) Verify the user against ServiceNow (token-based).
    const user = await validateUserCredentials(username.trim(), password);

    // 3) Generic error so we never reveal whether the username exists.
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    // 4) Issue a short-lived, signed JWT. Keep the payload minimal & non-secret.
    const role = resolveAppRole(user.roles);
    const token = jwt.sign(
      { sub: user.sysId, name: user.name, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' }
    );

    // The client stores `token` and sends it as `Authorization: Bearer <token>`.
    return res.json({ success: true, token, user: { id: user.sysId, name: user.name, email: user.email, role } });
  } catch (err) {
    // Log server-side; return a safe generic message (don't become a login oracle).
    console.error('[auth] login error:', err.message);
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  }
});

module.exports = router;
