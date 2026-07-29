const db = require('../config/db');

/**
 * Notification Model
 */
const Notification = {
  /**
   * Get all unread notifications for a specific employee
   * @param {string} employeeId 
   */
  async findUnreadByEmployeeId(employeeId) {
    const queryText = `
      SELECT id, leave_request_id, message, is_read, created_at
      FROM notifications
      WHERE employee_id = $1 AND is_read = FALSE
      ORDER BY created_at DESC
    `;
    const { rows } = await db.query(queryText, [employeeId]);
    return rows;
  },

  /**
   * Mark a notification as read
   * @param {string} id - Notification ID
   * @param {string} employeeId - Requesting Employee ID (for security verification)
   */
  async markAsRead(id, employeeId) {
    const queryText = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND employee_id = $2
      RETURNING id, leave_request_id, message, is_read, created_at
    `;
    const { rows } = await db.query(queryText, [id, employeeId]);
    return rows[0];
  }
};

module.exports = Notification;
