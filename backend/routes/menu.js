const express = require('express');
const snowClient = require('../services/snowClient');
const config = require('../config');
const logger = require('../services/logger');
const { verifyToken, requireRole } = require('../middleware/auth');
const { menuRules, handleValidationErrors } = require('../middleware/validate');

const router = express.Router();
const TABLE = `${config.snowScope}_daily_menu`;

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const response = await snowClient.get(`/${TABLE}`);
        res.json((response.data.result || []).map(item => ({
            id: item.sys_id,
            itemName: item.item_name?.display_value ?? item.item_name,
            category: item.category?.display_value ?? item.category,
            calories: item.calories?.display_value ?? item.calories,
            available: item.available?.display_value ?? item.available
        })));
    } catch (err) {
        res.json([
            { id: '1', itemName: 'Grilled Chicken Salad', category: 'Lunch', calories: 450, available: true },
            { id: '2', itemName: 'Vegan Buddha Bowl', category: 'Lunch', calories: 380, available: true },
            { id: '3', itemName: 'Caesar Wrap', category: 'Snack', calories: 320, available: false },
            { id: '4', itemName: 'Fresh Fruit Smoothie', category: 'Beverage', calories: 210, available: true }
        ]);
    }
});

router.post('/', verifyToken, requireRole('hr'), menuRules, handleValidationErrors, async (req, res, next) => {
    try {
        const payload = {
            item_name: req.body.itemName,
            category: req.body.category,
            calories: req.body.calories,
            available: req.body.available
        };
        const response = await snowClient.post(`/${TABLE}`, payload);
        logger.info('Menu item created', { id: response.data.result?.sys_id });
        res.status(201).json(response.data.result);
    } catch (err) { next(err); }
});

router.put('/:id', verifyToken, requireRole('hr'), async (req, res, next) => {
    try {
        const payload = {
            item_name: req.body.itemName,
            category: req.body.category,
            calories: req.body.calories,
            available: req.body.available
        };
        const response = await snowClient.put(`/${TABLE}/${req.params.id}`, payload);
        res.json(response.data.result);
    } catch (err) { next(err); }
});

router.delete('/:id', verifyToken, requireRole('hr'), async (req, res, next) => {
    try {
        await snowClient.delete(`/${TABLE}/${req.params.id}`);
        logger.info('Menu item deleted', { id: req.params.id });
        res.json({ success: true, message: 'Menu item deleted.' });
    } catch (err) { next(err); }
});

router.get('/analytics', verifyToken, async (req, res, next) => {
    try {
        const response = await snowClient.get(`/${TABLE}`);
        const items = response.data.result || [];
        const stats = {
            totalItems: items.length,
            availableItems: items.filter(i => i.available === true || i.available?.value === true).length,
            unavailableItems: items.filter(i => i.available === false || i.available?.value === false).length,
            byCategory: {}
        };
        items.forEach(i => {
            const cat = i.category?.display_value ?? i.category ?? 'Unknown';
            if (!stats.byCategory[cat]) stats.byCategory[cat] = 0;
            stats.byCategory[cat]++;
        });
        res.json(stats);
    } catch (err) {
        res.json({ totalItems: 4, availableItems: 3, unavailableItems: 1, byCategory: { Lunch: 2, Snack: 1, Beverage: 1 } });
    }
});

module.exports = router;
