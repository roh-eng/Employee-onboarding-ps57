const express = require('express');
const snowClient = require('../services/snowClient');
const config = require('../config');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Company-wide aggregates — HR/Manager only (employees see a personal dashboard instead).
router.get('/', verifyToken, requireRole('hr', 'manager'), async (req, res, next) => {
    try {
        const [empRes, taskRes] = await Promise.all([
            snowClient.get(`/${config.snowScope}_employee`),
            snowClient.get(`/${config.snowScope}_onboarding_task`)
        ]);

        const employees = empRes.data.result || [];
        const tasks = taskRes.data.result || [];

        // ServiceNow stores these choice values lowercase (onboarded/pending/completed),
        // so compare case-insensitively or the counts come back as 0.
        const norm = v => String(v == null ? '' : (v.value ?? v.display_value ?? v)).toLowerCase();
        res.json({
            totalEmployees: employees.length,
            onboardedEmployees: employees.filter(e => norm(e.status) === 'onboarded').length,
            pendingTasks: tasks.filter(t => { const s = norm(t.status); return s && s !== 'completed' && s !== 'complete'; }).length,
            activeIssues: 0
        });
    } catch (err) { next(err); }
});

router.get('/employee', verifyToken, requireRole('hr', 'manager'), async (req, res, next) => {
    try {
        const response = await snowClient.get(`/${config.snowScope}_project_sprint_task?sysparm_display_value=all`);
        const tasks = response.data.result || [];

        const stats = {
            priority: { High: 0, Medium: 0, Low: 0 },
            sla: { Met: 0, Breached: 0, InProgress: 0 },
            avgProgress: 0,
            totalTasks: tasks.length
        };

        if (tasks.length > 0) {
            let totalProgress = 0;
            tasks.forEach(t => {
                // Sprint tasks have no `priority` field; derive priority from the AI delay_risk signal
                const risk = String((t.delay_risk && (t.delay_risk.display_value || t.delay_risk)) || 'Low').toLowerCase();
                if (risk.includes('high')) stats.priority.High++;
                else if (risk.includes('medium') || risk.includes('moderate')) stats.priority.Medium++;
                else stats.priority.Low++;

                const sla = (t.sla_status && (t.sla_status.display_value || t.sla_status)) || 'In Progress';
                if (sla === 'Met') stats.sla.Met++;
                else if (sla === 'Breached') stats.sla.Breached++;
                else stats.sla.InProgress++;

                totalProgress += parseInt((t.progress && (t.progress.value || t.progress)) || 0);
            });
            stats.avgProgress = Math.round(totalProgress / tasks.length);
        }

        res.json(stats);
    } catch (err) { next(err); }
});

module.exports = router;
