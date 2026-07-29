const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Protect all notification routes (only employees get notifications)
router.use(authenticate, authorize(['employee']));

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notification management for employees
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Retrieve unread notifications
 *     description: Returns a list of all unread notifications for the logged-in employee.
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notifications retrieved successfully
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
 *                       leave_request_id:
 *                         type: string
 *                       message:
 *                         type: string
 *                       is_read:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/', notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     description: Marks a specific notification as read so that it will no longer show up as unread.
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found or access unauthorized
 */
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
