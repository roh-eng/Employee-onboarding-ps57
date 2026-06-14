const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const logger = require('./services/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { helmet, rateLimiter } = require('./middleware/security');
const { verifyToken, requireRole } = require('./middleware/auth');
const { initRealtime, broadcast } = require('./services/realtime');

const app = express();

// Render (and most PaaS) put the app behind a TLS-terminating proxy. Trust it so
// req.protocol / client IP are correct (needed for HTTPS detection + rate limiting).
app.set('trust proxy', 1);

/* ── Security Middleware ──────────────────────────────────────────────────── */
app.use(helmet);

/* ── CORS ─────────────────────────────────────────────────────────────────────
 * The frontend and API are served from the SAME origin (this Express app), so the
 * app's own calls are same-origin.
 * 
 * 1. Same-Origin Bypass: We dynamically allow requests where Origin === this server's own origin.
 *    This fixes Render deployments automatically without needing FRONTEND_URL env vars.
 * 2. Pre-defined Origins: We allow explicit external origins (localhost, ServiceNow, etc.)
 * 3. Safe Rejection: We NEVER throw an Error for unknown origins. Instead, we return 
 *    `origin: false`. The browser will gracefully block the request, preventing 500 errors.
 * 4. Server-to-Server: No Origin header = server-to-server (e.g., ServiceNow REST) -> allowed.
 */
const staticAllowed = new Set(
    [
        'http://localhost:3000', 
        'http://127.0.0.1:3000', 
        process.env.FRONTEND_URL, 
        process.env.APP_BASE_URL,
        process.env.SERVICENOW_INSTANCE_URL
    ]
    .filter(Boolean)
    .map(url => url.replace(/\/+$/, '')) // Normalize trailing slashes
);

app.use(cors((req, callback) => {
    const origin = req.header('Origin');
    
    // 1. Allow server-to-server requests (ServiceNow backend scripts, curl, same-origin GET)
    if (!origin) {
        return callback(null, { origin: true, credentials: true });
    }

    const reqOrigin = origin.replace(/\/+$/, '');
    
    // 2. Determine this server's own dynamic origin (handles Render dynamic URLs)
    const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
    const selfOrigin = `${proto}://${req.headers.host}`;
    
    // 3. Check if origin is allowed (Same-origin OR statically defined)
    const isAllowed = reqOrigin === selfOrigin || staticAllowed.has(reqOrigin);

    // 4. Return CORS options (false securely blocks the request without crashing)
    callback(null, {
        origin: isAllowed ? reqOrigin : false,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
    });
}));

app.use(rateLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/* ── Static Files ─────────────────────────────────────────────────────────── */
app.use(express.static(path.join(__dirname, '../frontend')));

/* ── API Routes ───────────────────────────────────────────────────────────── */
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/stats',   require('./routes/stats'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/tasks',   require('./routes/tasks'));
app.use('/api/issues',  require('./routes/issues'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/sprint-tasks', require('./routes/sprintTasks'));
app.use('/api/menu',    require('./routes/menu'));
app.use('/api/chat',    require('./routes/chat'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/feedback', require('./routes/feedback'));

/* ── Real-time broadcast endpoint (HTTP trigger for WS push) ────────────── */
app.post('/api/broadcast', verifyToken, requireRole('hr', 'manager'), async (req, res) => {
    const { channel, payload } = req.body;
    broadcast(channel, payload);
    res.json({ success: true, message: 'Broadcast sent.' });
});

/* ── Health Check ─────────────────────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), environment: config.nodeEnv });
});

/* ── Error Handling ───────────────────────────────────────────────────────── */
app.use(notFound);
app.use(errorHandler);

/* ── Global Error Listeners ───────────────────────────────────────────────── */
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
});
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason });
});

/* ── Start Server ─────────────────────────────────────────────────────────── */
let server;
if (require.main === module) {
server = app.listen(config.port, () => {
    logger.info(`Enterprise Workflow Hub Server running on http://localhost:${config.port}`);
    console.log(`Enterprise Workflow Hub Server running on http://localhost:${config.port}`);
    console.log('Press Ctrl+C to stop the server.');
});

/* ── Initialize WebSocket Server ────────────────────────────────────────── */
initRealtime(server);

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use.`);
        console.error(`ERROR: Port ${config.port} is already in use. Close the other server first and try again.`);
    } else {
        logger.error('Server error', { message: err.message });
        console.error('Server error:', err.message);
    }
    process.exit(1);
});
}

module.exports = app;
