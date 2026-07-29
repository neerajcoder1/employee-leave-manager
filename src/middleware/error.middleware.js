/**
 * Centralized Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error stack locally in development, but not in response
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${statusCode} - ${message}`);
    console.error(err.stack);
  } else {
    console.error(`[Error] ${statusCode} - ${message}`);
  }

  // Consistent failure response format
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred on the server.' 
      : message,
    errors: err.errors || []
  });
};

module.exports = errorHandler;
