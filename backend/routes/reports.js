const express = require('express');
const snowClient = require('../services/snowClient');
const config = require('../config');
const logger = require('../services/logger');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/* ── Helper: Convert array of objects to CSV ────────────────────────────── */
function toCsv(rows, columns) {
    const header = columns.map(c => c.label).join(',');
    const lines = rows.map(row =>
        columns.map(c => {
            const val = c.getter(row);
            const str = val == null ? '' : String(val);
            return '"' + str.replace(/"/g, '""') + '"';
        }).join(',')
    );
    return [header, ...lines].join('\n');
}

/* ── GET /reports/employees/csv ─────────────────────────────────────────── */
router.get('/employees/csv', verifyToken, requireRole('hr', 'manager'), async (req, res, next) => {
    try {
        const response = await snowClient.get(`/${config.snowScope}_employee`);
        const employees = response.data.result || [];

        const csv = toCsv(employees, [
            { label: 'Employee ID', getter: r => r.sys_id },
            { label: 'Name', getter: r => r.name },
            { label: 'Email', getter: r => r.email },
            { label: 'Department', getter: r => r.department },
            { label: 'Joining Date', getter: r => r.joining_date },
            { label: 'Status', getter: r => r.status }
        ]);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="employees_report.csv"');
        res.send(csv);
        logger.info('Employee report exported', { count: employees.length, user: req.user.userName });
    } catch (err) { next(err); }
});

/* ── GET /reports/tasks/csv ─────────────────────────────────────────────── */
router.get('/tasks/csv', verifyToken, requireRole('hr', 'manager'), async (req, res, next) => {
    try {
        const response = await snowClient.get(`/${config.snowScope}_onboarding_task?sysparm_display_value=all`);
        const tasks = response.data.result || [];

        const csv = toCsv(tasks, [
            { label: 'Task ID', getter: r => r.sys_id },
            { label: 'Employee', getter: r => r.employee?.display_value || r.employee },
            { label: 'Task Type', getter: r => r.task_type?.display_value || r.task_type },
            { label: 'Assigned To', getter: r => r.assigned_to?.display_value || r.assigned_to },
            { label: 'Status', getter: r => r.status?.display_value || r.status },
            { label: 'Due Date', getter: r => r.due_date?.display_value || r.due_date },
            { label: 'Priority', getter: r => r.priority?.display_value || r.priority }
        ]);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="tasks_report.csv"');
        res.send(csv);
        logger.info('Task report exported', { count: tasks.length, user: req.user.userName });
    } catch (err) { next(err); }
});

/* ── GET /reports/projects/csv ──────────────────────────────────────────── */
router.get('/projects/csv', verifyToken, requireRole('hr', 'manager'), async (req, res, next) => {
    try {
        const response = await snowClient.get(`/${config.snowScope}_project`);
        const projects = response.data.result || [];

        const csv = toCsv(projects, [
            { label: 'Project ID', getter: r => r.sys_id },
            { label: 'Project Name', getter: r => r.project_name },
            { label: 'Client', getter: r => r.client_name },
            { label: 'Manager', getter: r => r.project_manager },
            { label: 'Start Date', getter: r => r.start_date },
            { label: 'Deadline', getter: r => r.deadline },
            { label: 'Status', getter: r => r.status }
        ]);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="projects_report.csv"');
        res.send(csv);
        logger.info('Project report exported', { count: projects.length, user: req.user.userName });
    } catch (err) { next(err); }
});

/* ── GET /reports/sprint-tasks/csv ──────────────────────────────────────── */
router.get('/sprint-tasks/csv', verifyToken, requireRole('hr', 'manager'), async (req, res, next) => {
    try {
        const response = await snowClient.get(`/${config.snowScope}_project_sprint_task?sysparm_display_value=all`);
        const tasks = response.data.result || [];

        const csv = toCsv(tasks, [
            { label: 'Task ID', getter: r => r.sys_id },
            { label: 'Name', getter: r => r.short_description },
            { label: 'Assigned Team', getter: r => r.assigned_team?.display_value || r.assigned_team },
            { label: 'Progress %', getter: r => r.progress },
            { label: 'Delay Risk', getter: r => r.delay_risk?.display_value || r.delay_risk },
            { label: 'SLA Status', getter: r => r.sla_status?.display_value || r.sla_status }
        ]);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="sprint_tasks_report.csv"');
        res.send(csv);
        logger.info('Sprint task report exported', { count: tasks.length, user: req.user.userName });
    } catch (err) { next(err); }
});

/* ── GET /reports/dashboard/json ────────────────────────────────────────── */
router.get('/dashboard/json', verifyToken, requireRole('hr', 'manager'), async (req, res, next) => {
    try {
        const [empRes, taskRes, projRes, sprintRes] = await Promise.all([
            snowClient.get(`/${config.snowScope}_employee`),
            snowClient.get(`/${config.snowScope}_onboarding_task`),
            snowClient.get(`/${config.snowScope}_project`),
            snowClient.get(`/${config.snowScope}_project_sprint_task`)
        ]);

        const employees = empRes.data.result || [];
        const tasks = taskRes.data.result || [];
        const projects = projRes.data.result || [];
        const sprintTasks = sprintRes.data.result || [];

        const report = {
            generatedAt: new Date().toISOString(),
            generatedBy: req.user.userName,
            summary: {
                totalEmployees: employees.length,
                onboardedEmployees: employees.filter(e => e.status === 'Onboarded').length,
                pendingEmployees: employees.filter(e => e.status === 'Pending').length,
                totalTasks: tasks.length,
                pendingTasks: tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length,
                completedTasks: tasks.filter(t => t.status === 'Completed').length,
                totalProjects: projects.length,
                activeProjects: projects.filter(p => p.status === 'Development' || p.status === 'Planning').length,
                totalSprintTasks: sprintTasks.length,
                highRiskSprintTasks: sprintTasks.filter(t => t.delay_risk === 'High').length
            },
            departments: employees.reduce((acc, e) => {
                const dept = e.department || 'Unknown';
                acc[dept] = (acc[dept] || 0) + 1;
                return acc;
            }, {}),
            taskStatusBreakdown: tasks.reduce((acc, t) => {
                const status = t.status || 'Unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {})
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="dashboard_report.json"');
        res.json(report);
        logger.info('Dashboard JSON report exported', { user: req.user.userName });
    } catch (err) { next(err); }
});

module.exports = router;
