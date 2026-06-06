const express = require('express');
const snowClient = require('../services/snowClient');
const config = require('../config');
const logger = require('../services/logger');
const { verifyToken, requireRole } = require('../middleware/auth');
const { employeeRules, handleValidationErrors } = require('../middleware/validate');
const { fireEvent } = require('./webhooks');

const router = express.Router();
const TABLE = `${config.snowScope}_employee`;

const formatEmployee = (sysObj) => ({
    id: sysObj.sys_id,
    name: sysObj.name,
    email: sysObj.email,
    department: sysObj.department,
    joiningDate: sysObj.joining_date,
    status: sysObj.status
});

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const response = await snowClient.get(`/${TABLE}`);
        res.json((response.data.result || []).map(formatEmployee));
    } catch (err) { next(err); }
});

router.post('/', verifyToken, requireRole('hr'), employeeRules, handleValidationErrors, async (req, res, next) => {
    try {
        const payload = {
            name: req.body.name,
            email: req.body.email,
            department: req.body.department,
            joining_date: req.body.joiningDate,
            status: 'Pending'
        };
        const response = await snowClient.post(`/${TABLE}`, payload);
        logger.info('Employee created', { id: response.data.result?.sys_id });
        const employee = formatEmployee(response.data.result);
        fireEvent('employee.created', employee).catch(() => {});
        res.status(201).json(employee);
    } catch (err) { next(err); }
});

module.exports = router;
