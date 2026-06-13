/**
 * server.js
 * ────────────────────────────────────────────────────────────────────────
 * Wires the reference together so you can run it end-to-end:
 *
 *   public/login.html  ──POST /api/auth/login──►  routes/auth.js  ──token──►  ServiceNow
 *         │                                            │
 *         └── stores JWT ──GET /api/tasks (Bearer)──►  authMiddleware ► routes/tasks.js ► ServiceNow
 *
 * Run:  npm install && npm start   (after copying .env.example to .env)
 */

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');

const app = express();

// ── Security & body parsing ───────────────────────────────────────────────
app.use(helmet());                                   // hardened HTTP headers
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10kb' }));            // cap request body size

// ── Static demo frontend (vanilla login + dashboard) ──────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API routes ────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));      // public: login
app.use('/api/tasks', require('./routes/tasks'));    // protected: tasks

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── 404 + centralized error handler ───────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Not found.' }));
app.use((err, _req, res, _next) => {
  console.error('[server] unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

app.listen(config.port, () => {
  console.log(`\n  Secure-auth reference running:`);
  console.log(`    Login page : http://localhost:${config.port}/login.html`);
  console.log(`    Health     : http://localhost:${config.port}/api/health\n`);
});

module.exports = app; // exported for tests
