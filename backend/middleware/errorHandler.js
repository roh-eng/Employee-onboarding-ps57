const logger = require('../services/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(err.message, {
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

const notFound = (req, res) => {
    res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found.` });
};

module.exports = { errorHandler, notFound };
