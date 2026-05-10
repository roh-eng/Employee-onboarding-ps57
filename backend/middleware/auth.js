const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../services/logger');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn('Access denied: no token provided');
        return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    } catch (err) {
        logger.warn('Invalid token', { error: err.message });
        return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }
};

const requireRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        logger.warn('Forbidden: insufficient role', { userRole: req.user?.role, required: allowedRoles });
        return res.status(403).json({ success: false, error: 'Forbidden: insufficient privileges.' });
    }
    next();
};

module.exports = { verifyToken, requireRole };
