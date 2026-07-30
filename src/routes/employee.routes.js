const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const leaveValidator = require('../validators/leave.validator');
const validateInput = require('../middleware/validation.middleware');

// Protect all employee routes
router.use(authenticate, authorize(['employee']));

/**
 * @swagger
 * tags:
 *   name: Employee Portal
 *   description: Employee-specific operations (profile, leave applications, leave history)
 */

/**
 * @swagger
 * /api/employee/profile:
 *   get:
 *     summary: Fetch employee profile and leave balances
 *     description: Returns the profile details and current leave balances (Annual, Sick, Maternity) for the logged-in employee.
 *     tags: [Employee Portal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                     balances:
 *                       type: object
 *                       properties:
 *                         annual:
 *                           type: integer
 *                         sick:
 *                           type: integer
 *                         maternity:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Requires employee role)
 */
router.get('/profile', employeeController.getProfile);

/**
 * @swagger
 * /api/employee/leave:
 *   post:
 *     summary: Apply for a new leave request
 *     description: Submit a leave request. Enforces validation rules on dates, checks that the employee has sufficient balance, and allows uploading a supporting document.
 *     tags: [Employee Portal]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - leaveType
 *               - startDate
 *               - endDate
 *               - reason
 *             properties:
 *               leaveType:
 *                 type: string
 *                 enum: [Annual, Sick, Maternity]
 *                 description: Type of leave being requested
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date of leave (YYYY-MM-DD)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date of leave (YYYY-MM-DD)
 *               reason:
 *                 type: string
 *                 description: Detailed reason for leave
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Supporting document (PDF, Word, or image) (Max size 5MB)
 *     responses:
 *       201:
 *         description: Leave request submitted successfully
 *       400:
 *         description: Validation failed or insufficient leave balance
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/leave', upload.single('document'), leaveValidator.applyLeave, validateInput, employeeController.applyLeave);

/**
 * @swagger
 * /api/employee/leave:
 *   get:
 *     summary: View own leave request history
 *     description: Retrieves all leave requests submitted by the logged-in employee, sorted by request date.
 *     tags: [Employee Portal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Leave history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       leave_type:
 *                         type: string
 *                       start_date:
 *                         type: string
 *                       end_date:
 *                         type: string
 *                       reason:
 *                         type: string
 *                       document_path:
 *                         type: string
 *                       status:
 *                         type: string
 *                       manager_remarks:
 *                         type: string
 *                       created_at:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/leave', employeeController.getLeaveHistory);

module.exports = router;
