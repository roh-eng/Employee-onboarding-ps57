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
        let query = '';
        if (req.user.role === 'employee') {
            // Employees can only see their own feedback
            query = `?sysparm_query=employee=${req.user.userId}`;
        }
        const response = await snowClient.get(`/${TABLE}${query}`);
        const items = (response.data.result || []).map(item => ({
            id: item.sys_id,
            employee: item.employee?.display_value ?? item.employee,
            category: item.category?.display_value ?? item.category,
            rating: item.rating?.display_value ?? item.rating,
            comments: item.comments,
            status: item.status?.display_value ?? item.status,
            submittedOn: item.submitted_on?.display_value ?? item.submitted_on
        }));
        res.json(items);
    } catch (err) { next(err); }
});

// POST /feedback — submit new feedback (all authenticated users)
router.post('/', verifyToken, feedbackRules, handleValidationErrors, async (req, res, next) => {
    try {
        const payload = {
            employee: req.user.userId,
            category: req.body.category,
            rating: req.body.rating,
            comments: req.body.comments,
            status: 'New',
            submitted_on: new Date().toISOString().split('T')[0]
        };
        const response = await snowClient.post(`/${TABLE}`, payload);
        logger.info('Feedback submitted', { id: response.data.result?.sys_id, user: req.user.userId });
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
