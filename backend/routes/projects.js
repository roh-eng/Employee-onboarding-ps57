const express = require('express');
const snowClient = require('../services/snowClient');
const config = require('../config');
const logger = require('../services/logger');
const { verifyToken, requireRole } = require('../middleware/auth');
const { projectRules, handleValidationErrors } = require('../middleware/validate');

const router = express.Router();
const TABLE = `${config.snowScope}_project`;

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const response = await snowClient.get(`/${TABLE}`);
        res.json(response.data.result || []);
    } catch (err) { next(err); }
});

router.post('/', verifyToken, requireRole('hr', 'manager'), projectRules, handleValidationErrors, async (req, res, next) => {
    try {
        const payload = {
            project_name: req.body.project_name,
            client_name: req.body.client_name,
            project_manager: req.body.project_manager,
            start_date: req.body.start_date,
            deadline: req.body.deadline,
            status: 'Planning'
        };
        const response = await snowClient.post(`/${TABLE}`, payload);
        logger.info('Project created', { id: response.data.result?.sys_id });
        res.status(201).json(response.data.result);
    } catch (err) { next(err); }
});

module.exports = router;
