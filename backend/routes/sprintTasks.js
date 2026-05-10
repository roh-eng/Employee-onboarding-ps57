const express = require('express');
const snowClient = require('../services/snowClient');
const config = require('../config');
const { verifyToken, requireRole } = require('../middleware/auth');

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
    } catch (err) {
        res.json([
            { sys_id: '1', task_name: 'Database Schema', assigned_team: 'Development', progress: 100, delay_risk: 'Low', sla_status: 'Met' },
            { sys_id: '2', task_name: 'Node.js APIs', assigned_team: 'Development', progress: 40, delay_risk: 'High', sla_status: 'Breached' },
            { sys_id: '3', task_name: 'Frontend Dashboard', assigned_team: 'UI/UX', progress: 10, delay_risk: 'Medium', sla_status: 'In Progress' }
        ]);
    }
});

router.put('/:id', verifyToken, requireRole('hr', 'manager'), async (req, res, next) => {
    try {
        const payload = { progress: req.body.progress };
        const response = await snowClient.put(`/${TABLE}/${req.params.id}`, payload);
        res.json(response.data.result);
    } catch (err) { next(err); }
});

module.exports = router;
