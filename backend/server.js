const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const logger = require('./services/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { helmet, rateLimiter } = require('./middleware/security');

const app = express();

/* ── Security Middleware ──────────────────────────────────────────────────── */
app.use(helmet);
app.use(cors());
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
app.listen(config.port, () => {
    logger.info(`Enterprise Workflow Hub Server running on http://localhost:${config.port}`);
    console.log(`Enterprise Workflow Hub Server running on http://localhost:${config.port}`);
    console.log('Press Ctrl+C to stop the server.');
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use.`);
        console.error(`ERROR: Port ${config.port} is already in use. Close the other server first and try again.`);
    } else {
        logger.error('Server error', { message: err.message });
        console.error('Server error:', err.message);
    }
    process.exit(1);
});

module.exports = app;
