const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    // Keep the test run output clean — silence all logging under NODE_ENV=test.
    silent: process.env.NODE_ENV === 'test',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'enterprise-workflow-hub' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({ filename: path.join(__dirname, '../../logs/error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(__dirname, '../../logs/combined.log') })
    ]
});

module.exports = logger;
