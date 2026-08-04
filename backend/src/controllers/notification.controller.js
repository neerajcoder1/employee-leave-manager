const Notification = require('../models/notification.model');

/**
 * Notification Controller
 */
const notificationController = {
  /**
   * Get unread notifications for logged-in employee
   */
  async getNotifications(req, res, next) {
    try {
      const employeeId = req.user.id;
      const notifications = await Notification.findUnreadByEmployeeId(employeeId);

      return res.status(200).json({
        success: true,
        message: 'Unread notifications retrieved successfully',
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark a specific notification as read
   */
  async markRead(req, res, next) {
    try {
      const notificationId = req.params.id;
      const employeeId = req.user.id;

      const updatedNotification = await Notification.markAsRead(notificationId, employeeId);

      if (!updatedNotification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or access unauthorized',
          errors: ['No notification record matches the request parameters']
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read successfully',
        data: updatedNotification
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = notificationController;
