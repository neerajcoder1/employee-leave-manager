const { validationResult } = require('express-validator');
const fs = require('fs');

/**
 * Middleware to check validation results and handle express-validator errors.
 * Cleans up uploaded files if validation fails to prevent orphaned files.
 */
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Clean up uploaded file if validation failed
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error cleaning up file after validation failure:', err);
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => `${err.path || err.param}: ${err.msg}`)
    });
  }
  
  next();
};

module.exports = validateInput;
