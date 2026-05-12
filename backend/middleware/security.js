const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config');

const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://dev293414.service-now.com"]
        }
    }
});

// Disable rate limiting in test environment to avoid flaky CI failures
const isTest = config.nodeEnv === 'test';

const rateLimiter = isTest
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, error: 'Too many requests from this IP, please try again later.' }
    });

const authLimiter = isTest
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: { success: false, error: 'Too many login attempts. Please try again after 15 minutes.' }
    });

module.exports = { helmet: helmetConfig, rateLimiter, authLimiter };
