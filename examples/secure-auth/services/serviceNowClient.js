/**
 * services/serviceNowClient.js
 * ────────────────────────────────────────────────────────────────────────
 * A pre-configured Axios instance for talking to ServiceNow.
 *
 * Authentication is TOKEN-BASED: every request carries a single integration
 * token in the `Authorization: Bearer` header. This is fundamentally more
 * secure than putting per-user ServiceNow username/passwords anywhere near
 * the frontend:
 *   • the token lives ONLY in the server environment (never in the browser),
 *   • it can be scoped to least-privilege and rotated/revoked independently,
 *   • the browser only ever sees our own short-lived JWT, never ServiceNow creds.
 */

const axios = require('axios');
const config = require('../config');

const serviceNowClient = axios.create({
  baseURL: config.serviceNow.instance,
  timeout: 10000, // fail fast instead of hanging a request
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.serviceNow.apiToken}`,
  },
});

module.exports = serviceNowClient;
