const express = require('express');
const snowClient = require('../services/snowClient');
const config = require('../config');
const logger = require('../services/logger');
const { verifyToken } = require('../middleware/auth');
const { issueRules, handleValidationErrors } = require('../middleware/validate');

const router = express.Router();
const TABLE = `${config.snowScope}_issue`;

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const response = await snowClient.get(`/${TABLE}`);
        res.json(response.data.result || []);
    } catch (err) { next(err); }
});

router.post('/', verifyToken, issueRules, handleValidationErrors, async (req, res, next) => {
    try {
        const payload = {
            description: req.body.description,
            priority: req.body.priority,
            status: 'New'
        };
        const response = await snowClient.post(`/${TABLE}`, payload);
        logger.info('Issue created', { id: response.data.result?.sys_id });
        res.status(201).json(response.data.result);
    } catch (err) { next(err); }
});

module.exports = router;
