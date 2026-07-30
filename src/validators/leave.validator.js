const { body, param } = require('express-validator');

/**
 * Leave Request Validators
 */
const leaveValidator = {
  applyLeave: [
    body('leaveType')
      .trim()
      .notEmpty().withMessage('Leave type is required')
      .isIn(['Annual', 'Sick', 'Maternity']).withMessage('Leave type must be one of: Annual, Sick, Maternity'),
    
    body('startDate')
      .trim()
      .notEmpty().withMessage('Start date is required')
      .isISO8601().withMessage('Start date must be a valid date (YYYY-MM-DD)'),
    
    body('endDate')
      .trim()
      .notEmpty().withMessage('End date is required')
      .isISO8601().withMessage('End date must be a valid date (YYYY-MM-DD)')
      .custom((value, { req }) => {
        const start = new Date(req.body.startDate);
        const end = new Date(value);
        if (end < start) {
          throw new Error('End date must be on or after start date');
        }
        return true;
      }),
    
    body('reason')
      .trim()
      .notEmpty().withMessage('Reason for leave is required')
      .isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters')
  ],

  updateStatus: [
    param('id')
      .isUUID().withMessage('Invalid leave request ID format'),
      
    body('status')
      .trim()
      .notEmpty().withMessage('Status is required')
      .isIn(['Approved', 'Rejected']).withMessage('Status must be Approved or Rejected'),
      
    body('managerRemarks')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Remarks cannot exceed 500 characters')
  ],

  getDetails: [
    param('id')
      .isUUID().withMessage('Invalid leave request ID format')
  ]
};

module.exports = leaveValidator;
