/**
 * config.js
 * ────────────────────────────────────────────────────────────────────────
 * Single source of truth for configuration.
 *
 * Loads environment variables and FAILS FAST if a required one is missing,
 * so the server never boots in a half-configured (and possibly insecure)
 * state. Nothing in this app reads `process.env` directly except here.
 */

require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

/**
 * Read a required env var. Throws (with only the key name, never the value)
 * if it is missing, so misconfiguration is loud and obvious at startup.
 */
function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Copy .env.example to .env and fill it in.`
    );
  }
  return value.trim();
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 4000}`,

  // ── ServiceNow integration (token-based) ──────────────────────────────
  serviceNow: {
    // Trailing slash stripped so we can safely concatenate paths.
    instance: required('SERVICENOW_INSTANCE').replace(/\/+$/, ''),
    apiToken: required('SERVICENOW_API_TOKEN'),
    validatePath: process.env.SERVICENOW_VALIDATE_PATH || '/api/x_auth/secure_auth/validate',
    tableApi: '/api/now/table',
  },

  // ── App session tokens (JWT) ──────────────────────────────────────────
  jwt: {
    // A real secret is REQUIRED in production; a clearly-insecure default is
    // tolerated only in dev so the example runs out of the box.
    secret: isProd
      ? required('JWT_SECRET')
      : (process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me'),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
};
