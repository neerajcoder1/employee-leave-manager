const express = require('express');
const router = express.Router();
const managerController = require('../controllers/manager.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const leaveValidator = require('../validators/leave.validator');
const validateInput = require('../middleware/validation.middleware');

// Protect all manager routes
router.use(authenticate, authorize(['manager']));

/**
 * @swagger
 * tags:
 *   name: Manager Portal
 *   description: Manager-specific operations (viewing employees, reviewing leaves)
 */

/**
 * @swagger
 * /api/manager/employees:
 *   get:
 *     summary: List all registered employees
 *     description: Returns a list of all employees in the system along with their current leave balances.
 *     tags: [Manager Portal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Employees list retrieved successfully
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
 *                       username:
 *                         type: string
 *                       role:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                       annual_leave:
 *                         type: integer
 *                       sick_leave:
 *                         type: integer
 *                       casual_leave:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Requires manager role)
 */
router.get('/employees', managerController.getEmployees);

/**
 * @swagger
 * /api/manager/leaves:
 *   get:
 *     summary: View all submitted leave requests
 *     description: Retrieves all leave requests submitted by all employees in the system, sorted by request date.
 *     tags: [Manager Portal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All leave requests retrieved successfully
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
 *                       employee_id:
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
 *                       username:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/leaves', managerController.getAllLeaves);

/**
 * @swagger
 * /api/manager/leaves/{id}:
 *   patch:
 *     summary: Approve or Reject a leave request
 *     description: Updates the status of a pending leave request to 'Approved' or 'Rejected' with remarks. Deducts leave balance if approved. Dispatches in-app notification.
 *     tags: [Manager Portal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leave request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Approved, Rejected]
 *                 description: Status update
 *               managerRemarks:
 *                 type: string
 *                 description: Manager remarks or reason for decision
 *                 example: Approved. Enjoy your time off!
 *     responses:
 *       200:
 *         description: Leave request updated successfully
 *       400:
 *         description: Validation failed, leave request already processed, or insufficient leave balance
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Leave request not found
 */
router.patch('/leaves/:id', leaveValidator.updateStatus, validateInput, managerController.updateLeaveStatus);

module.exports = router;
