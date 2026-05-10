const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../config');
const logger = require('../services/logger');
const { loginRules, handleValidationErrors } = require('../middleware/validate');
const { authLimiter } = require('../middleware/security');

const router = express.Router();

router.post('/login', authLimiter, loginRules, handleValidationErrors, async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const tempClient = axios.create({
            baseURL: `${config.snowInstance}/api/now/table`,
            auth: { username, password },
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });

        const response = await tempClient.get(`/sys_user?sysparm_query=user_name=${encodeURIComponent(username)}&sysparm_limit=1`);

        if (response.data.result && response.data.result.length > 0) {
            const user = response.data.result[0];
            const token = jwt.sign(
                { userId: user.sys_id, userName: user.name || username, role: req.body.role || 'employee' },
                config.jwtSecret,
                { expiresIn: config.jwtExpiresIn }
            );

            logger.info(`User authenticated: ${username}`);
            res.json({
                success: true,
                token,
                userName: user.name || username,
                userId: user.sys_id,
                role: req.body.role || 'employee'
            });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }
    } catch (err) {
        logger.error(`Login failed for ${req.body.username}`, { error: err.message });
        next(new Error('Invalid credentials or ServiceNow unreachable.'));
    }
});

router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully.' });
});

router.get('/session', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token.' });

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        res.json({ success: true, user: decoded });
    } catch (err) {
        res.status(401).json({ success: false, error: 'Invalid token.' });
    }
});

module.exports = router;
