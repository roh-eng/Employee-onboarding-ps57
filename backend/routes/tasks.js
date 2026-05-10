const express = require('express');
const snowClient = require('../services/snowClient');
const config = require('../config');
const { verifyToken, requireRole } = require('../middleware/auth');
const { taskRules, handleValidationErrors } = require('../middleware/validate');

const router = express.Router();
const TABLE = `${config.snowScope}_onboarding_task`;

const formatTask = (sysObj) => ({
    id: sysObj.sys_id?.display_value ?? sysObj.sys_id,
    employeeId: sysObj.employee?.value ?? sysObj.employee,
    employeeName: sysObj.employee?.display_value ?? 'Unknown',
    taskType: sysObj.task_type?.display_value ?? sysObj.task_type,
    assignedTo: sysObj.assigned_to?.display_value ?? sysObj.assigned_to,
    status: sysObj.status?.display_value ?? sysObj.status,
    dueDate: sysObj.due_date?.display_value ?? sysObj.due_date,
    priority: sysObj.priority?.display_value ?? sysObj.priority
});

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const response = await snowClient.get(`/${TABLE}?sysparm_display_value=all`);
        res.json((response.data.result || []).map(formatTask));
    } catch (err) { next(err); }
});

router.put('/:id', verifyToken, requireRole('hr', 'manager'), taskRules, handleValidationErrors, async (req, res, next) => {
    try {
        const payload = { status: req.body.status };
        const response = await snowClient.put(`/${TABLE}/${req.params.id}`, payload);
        res.json(formatTask(response.data.result));
    } catch (err) { next(err); }
});

module.exports = router;
