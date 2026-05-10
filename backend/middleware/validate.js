const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    next();
};

const employeeRules = [
    body('name').notEmpty().withMessage('Name is required').trim().escape(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('department').notEmpty().withMessage('Department is required').trim().escape(),
    body('joiningDate').isISO8601().withMessage('Valid joining date is required')
];

const taskRules = [
    body('status').isIn(['Pending', 'In Progress', 'Completed']).withMessage('Invalid status value')
];

const issueRules = [
    body('description').notEmpty().withMessage('Description is required').trim().escape(),
    body('priority').isIn(['High', 'Medium', 'Low']).withMessage('Priority must be High, Medium, or Low')
];

const projectRules = [
    body('project_name').notEmpty().withMessage('Project name is required').trim().escape(),
    body('client_name').notEmpty().withMessage('Client name is required').trim().escape(),
    body('project_manager').notEmpty().withMessage('Project manager is required').trim().escape()
];

const menuRules = [
    body('itemName').notEmpty().withMessage('Item name is required').trim().escape(),
    body('category').isIn(['Breakfast', 'Lunch', 'Snack', 'Beverage']).withMessage('Invalid category'),
    body('calories').isInt({ min: 0 }).withMessage('Calories must be a positive integer')
];

const loginRules = [
    body('username').notEmpty().withMessage('Username is required').trim().escape(),
    body('password').notEmpty().withMessage('Password is required').trim()
];

module.exports = {
    handleValidationErrors,
    employeeRules,
    taskRules,
    issueRules,
    projectRules,
    menuRules,
    loginRules
};
