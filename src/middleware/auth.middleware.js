const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate requests via JWT
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is missing or invalid',
      errors: ['No token provided']
    });
  }

  try {
    // Force algorithm verification check
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    
    // Attach decoded user info to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    let errorMessage = 'Failed to authenticate token';
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired';
    }
    
    return res.status(401).json({
      success: false,
      message: errorMessage,
      errors: [error.message]
    });
  }
};

/**
 * Middleware to restrict route access by role
 * @param {Array<string>} roles - Allowed roles
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this resource',
        errors: [`Require role: ${roles.join(' or ')}`]
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
