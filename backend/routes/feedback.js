const express = require('express');
const snowClient = require('../services/snowClient');
const config = require('../config');
const logger = require('../services/logger');
const { verifyToken, requireRole } = require('../middleware/auth');
const { feedbackRules, handleValidationErrors } = require('../middleware/validate');

const router = express.Router();
const TABLE = `${config.snowScope}_employee_feedback`;

/**
 * Employee Feedback & Survey Module
 * Allows employees to submit feedback/surveys, HR/Managers to view all feedback.
 * Table: x_1850353_employ_0_employee_feedback
 * Columns: employee (reference), category (choice), rating (integer), comments (string), status (choice), submitted_on (glide_date)
 */

// GET /feedback — list all feedback (HR/Manager), or own feedback (Employee)
router.get('/', verifyToken, async (req, res, next) => {
    try {
        // Live table columns: employee_name (string), feedback (string), rating (int).
        let query = '?sysparm_query=ORDERBYDESCsys_created_on';
        if (req.user.role === 'employee') {
            // Employees only see their own submissions (matched by name)
            query = `?sysparm_query=employee_name=${encodeURIComponent(req.user.userName)}^ORDERBYDESCsys_created_on`;
        }
        const response = await snowClient.get(`/${TABLE}${query}`);
        const items = (response.data.result || []).map(item => {
            // Category is stored inline as a "[Category] comment" prefix
            const raw = (item.feedback?.display_value ?? item.feedback ?? '').toString();
            const m = /^\[([^\]]+)\]\s*([\s\S]*)$/.exec(raw);
            return {
                id: item.sys_id,
                employee: item.employee_name?.display_value ?? item.employee_name,
                rating: item.rating?.display_value ?? item.rating,
                category: m ? m[1] : 'General',
                comments: m ? m[2] : raw,
                submittedOn: item.sys_created_on?.display_value ?? item.sys_created_on
            };
        });
        res.json(items);
    } catch (err) { next(err); }
});

// POST /feedback — submit new feedback (all authenticated users)
router.post('/', verifyToken, feedbackRules, handleValidationErrors, async (req, res, next) => {
    try {
        // Map to the live table columns (employee_name, feedback, rating).
        // Category is folded into the feedback text so no extra column is needed.
        const category = (req.body.category || 'General').toString().trim();
        const payload = {
            employee_name: req.user.userName,
            feedback: `[${category}] ${req.body.comments}`,
            rating: req.body.rating
        };
        const response = await snowClient.post(`/${TABLE}`, payload);
        logger.info('Feedback submitted', { id: response.data.result?.sys_id, user: req.user.userName });
        res.status(201).json(response.data.result);
    } catch (err) { next(err); }
});

// PUT /feedback/:id — update feedback status (HR/Manager can acknowledge/review)
router.put('/:id', verifyToken, requireRole('hr', 'manager'), async (req, res, next) => {
    try {
        const payload = { status: req.body.status };
        const response = await snowClient.put(`/${TABLE}/${req.params.id}`, payload);
        logger.info('Feedback status updated', { id: req.params.id, status: req.body.status });
        res.json(response.data.result);
    } catch (err) { next(err); }
});

// GET /feedback/analytics — aggregated feedback stats (HR/Manager)
router.get('/analytics', verifyToken, requireRole('hr', 'manager'), async (req, res, next) => {
    try {
        const response = await snowClient.get(`/${TABLE}`);
        const items = response.data.result || [];
        const stats = {
            totalFeedback: items.length,
            byStatus: {},
            byCategory: {},
            averageRating: 0
        };
        let ratingSum = 0;
        items.forEach(i => {
            const status = i.status?.display_value ?? i.status ?? 'Unknown';
            const category = i.category?.display_value ?? i.category ?? 'Unknown';
            const rating = parseInt(i.rating?.display_value ?? i.rating ?? '0', 10);
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
            ratingSum += rating;
        });
        stats.averageRating = items.length > 0 ? (ratingSum / items.length).toFixed(1) : 0;
        res.json(stats);
    } catch (err) { next(err); }
});

module.exports = router;
