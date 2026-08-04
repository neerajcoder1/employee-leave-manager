const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../config/logger');

/**
 * Auth Controller
 */
const authController = {
  /**
   * Handle Employee Registration
   */
  async register(req, res, next) {
    try {
      const { username, password } = req.body;

      // 1. Check if user already exists
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username is already registered',
          errors: ['User already exists']
        });
      }

      // 2. Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Save new user (transaction initializes leave balances)
      const newUser = await User.createUser(username, hashedPassword, 'employee');

      // Audit Log
      logger.info(`User registration successful: Username "${newUser.username}"`, { userId: newUser.id, ip: req.ip });

      // 4. Return success response
      return res.status(201).json({
        success: true,
        message: 'Employee registered successfully',
        data: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          createdAt: newUser.created_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Handle Employee and Manager Login
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // 1. Find user by username
      const user = await User.findByUsername(username);
      if (!user) {
        logger.warn(`Failed login attempt: Username "${username}" not found`, { ip: req.ip });
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password',
          errors: ['Unauthorized']
        });
      }

      // 2. Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        logger.warn(`Failed login attempt: Incorrect password for Username "${username}"`, { userId: user.id, ip: req.ip });
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password',
          errors: ['Unauthorized']
        });
      }

      // 3. Issue JWT Token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Audit Log
      logger.info(`User login successful: Username "${user.username}"`, { userId: user.id, ip: req.ip });

      // 4. Return success response
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
