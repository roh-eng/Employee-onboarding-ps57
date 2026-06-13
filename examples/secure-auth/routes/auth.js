/**
 * routes/auth.js
 * ────────────────────────────────────────────────────────────────────────
 * Authentication endpoint.
 *
 *   POST /api/auth/login   { username, password }  ->  { token, user } | 401
 *
 * Credentials are validated against ServiceNow using the INTEGRATION TOKEN
 * (see services/serviceNowClient.js), and on success we mint our own short-
 * lived JWT for the browser. The browser never sees ServiceNow credentials.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const serviceNow = require('../services/serviceNowClient');

const router = express.Router();

/**
 * Rate-limit login attempts to blunt brute-force / credential-stuffing.
 * 10 attempts per IP per 15 minutes.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Please try again later.' },
});

/**
 * Validate a user's credentials against ServiceNow.
 *
 * Why a Scripted REST endpoint?
 *   A single integration token lets the backend READ ServiceNow data, but it
 *   cannot read a user's password (it's hashed in `sys_user`). So credential
 *   verification is delegated to a small ServiceNow-side Scripted REST API
 *   that the token is authorized to call. It receives { username, password }
 *   and returns { valid, sysId, name, roles }.  (See README → "ServiceNow setup".)
 *
 *   Alternative production pattern: ServiceNow OAuth "password" grant. The
 *   structure below stays the same — only this one function changes.
 *
 * @returns {Promise<null | { sysId: string, name: string, roles: string[] }>}
 *          Resolves to null when the credentials are invalid.
 */
async function validateUserCredentials(username, password) {
  const { data } = await serviceNow.post(config.serviceNow.validatePath, { username, password });

  // ServiceNow Scripted REST responses are usually wrapped in a `result` object.
  const result = data && (data.result || data);
  if (!result || result.valid !== true) return null;

  return {
    sysId: result.sysId,
    name: result.name || username,
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

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body || {};

    // ── 1) Validate input. Never trust the client. ──────────────────────
    if (
      typeof username !== 'string' || typeof password !== 'string' ||
      !username.trim() || !password
    ) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    // ── 2) Verify the user against ServiceNow (token-based). ────────────
    const user = await validateUserCredentials(username.trim(), password);

    // ── 3) Generic error: do NOT reveal whether the username exists. ────
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    // ── 4) Issue a short-lived JWT. Keep the payload minimal & non-secret.
    const role = resolveAppRole(user.roles);
    const token = jwt.sign(
      { sub: user.sysId, name: user.name, role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn, algorithm: 'HS256' }
    );

    // The client stores `token` and sends it as `Authorization: Bearer ...`.
    return res.json({
      success: true,
      token,
      user: { id: user.sysId, name: user.name, role },
    });
  } catch (err) {
    // Log details server-side; return a safe, generic message to the client.
    // (A ServiceNow/network error must not become a login oracle.)
    console.error('[auth] login error:', err.message);
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  }
});

module.exports = router;
