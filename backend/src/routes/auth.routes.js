const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');
const validateInput = require('../middleware/validation.middleware');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration and login operations
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new employee
 *     description: "Registers a new user with the employee role and initializes their default leave balances (Annual - 15, Sick - 10, Maternity - 10)."
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username (3-50 chars, alphanumeric or specific symbols)
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password (min 6 chars)
 *                 example: Password123
 *     responses:
 *       201:
 *         description: Employee registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Employee registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Username already registered
 *       500:
 *         description: Internal server error
 */
router.post('/register', authValidator.register, validateInput, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User Login
 *     description: Authenticates employee or manager credentials and returns a signed JWT access token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: manager@gcu.in
 *               password:
 *                 type: string
 *                 format: password
 *                 example: ManagerPass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT Access Token
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         username:
 *                           type: string
 *                         role:
 *                           type: string
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login', authValidator.login, validateInput, authController.login);

module.exports = router;
