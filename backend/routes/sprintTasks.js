const express = require('express');
const snowClient = require('../services/snowClient');
const config = require('../config');
const { verifyToken, requireRole } = require('../middleware/auth');
const { fireEvent } = require('./webhooks');

const router = express.Router();
const TABLE = `${config.snowScope}_project_sprint_task`;

const getVal = (field, fallback = '') => {
    if (!field) return fallback;
    if (typeof field === 'object') return field.display_value || field.value || fallback;
    return field;
};

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const response = await snowClient.get(`/${TABLE}?sysparm_display_value=all`);
        const formatted = (response.data.result || []).map(task => ({
            sys_id: getVal(task.sys_id),
            task_name: getVal(task.short_description) || getVal(task.task_name) || getVal(task.name) || getVal(task.number, 'Unnamed Task'),
            assigned_team: getVal(task.assigned_team, 'N/A'),
            progress: getVal(task.progress, 0),
            delay_risk: getVal(task.delay_risk, 'Low'),
            sla_status: getVal(task.sla_status, 'Pending')
        }));
        res.json(formatted);
    } catch (err) { next(err); }
});

router.put('/:id', verifyToken, requireRole('hr', 'manager'), async (req, res, next) => {
    try {
        const payload = { progress: req.body.progress };
        const response = await snowClient.put(`/${TABLE}/${req.params.id}`, payload);
        const result = response.data.result;
        // ServiceNow business rules may flip sla_status on update — notify subscribers on a breach
        if (getVal(result?.sla_status) === 'Breached') {
            fireEvent('sla.breached', {
                sys_id: getVal(result.sys_id),
                task_name: getVal(result.short_description) || getVal(result.task_name),
                sla_status: 'Breached',
                progress: getVal(result.progress, 0)
            }).catch(() => {});
        }
        res.json(result);
    } catch (err) { next(err); }
});

module.exports = router;
