const { body } = require('express-validator');

/**
 * Authentication Validators
 */
const authValidator = {
  register: [
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_@.-]+$/).withMessage('Username can only contain letters, numbers, underscores, dashes, dots, and @'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character')
  ],

  login: [
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required'),
    body('password')
      .notEmpty().withMessage('Password is required')
  ]
};

module.exports = authValidator;
