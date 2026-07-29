const db = require('../config/db');

/**
 * Leave Request Model
 */
const Leave = {
  /**
   * Submit a new leave request (after checking balance, but does not deduct balance yet)
   */
  async createLeaveRequest({ employeeId, leaveType, startDate, endDate, reason, documentPath }) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Calculate leave duration
      // (end_date - start_date + 1)
      const durationQuery = `SELECT ($1::DATE - $2::DATE + 1) AS duration`;
      const durationRes = await client.query(durationQuery, [endDate, startDate]);
      const duration = parseInt(durationRes.rows[0].duration, 10);

      if (duration <= 0) {
        throw new Error('End date must be on or after start date');
      }

      // 2. Fetch current balance
      const balanceCol = `${leaveType.toLowerCase()}_leave`;
      const balanceQuery = `
        SELECT ${balanceCol} AS balance 
        FROM leave_balances 
        WHERE employee_id = $1
      `;
      const balanceRes = await client.query(balanceQuery, [employeeId]);
      
      if (!balanceRes.rows.length) {
        throw new Error('Employee leave balance record not found');
      }
      
      const currentBalance = balanceRes.rows[0].balance;

      if (currentBalance < duration) {
        throw new Error(`Insufficient leave balance. Requested: ${duration} days, Available: ${currentBalance} days`);
      }

      // 3. Insert leave request
      const insertQuery = `
        INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, document_path)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, employee_id, leave_type, start_date, end_date, reason, document_path, status, created_at
      `;
      const leaveRes = await client.query(insertQuery, [
        employeeId,
        leaveType,
        startDate,
        endDate,
        reason,
        documentPath
      ]);

      await client.query('COMMIT');
      return leaveRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Find a leave request by ID
   */
  async findById(id) {
    const queryText = `
      SELECT lr.id, lr.employee_id, lr.leave_type, lr.start_date, lr.end_date,
             lr.reason, lr.document_path, lr.status, lr.manager_remarks, lr.created_at,
             u.username
      FROM leave_requests lr
      JOIN users u ON lr.employee_id = u.id
      WHERE lr.id = $1
    `;
    const { rows } = await db.query(queryText, [id]);
    return rows[0];
  },

  /**
   * View all leave requests submitted by a specific employee
   */
  async findByEmployeeId(employeeId) {
    const queryText = `
      SELECT id, leave_type, start_date, end_date, reason, document_path, status, manager_remarks, created_at
      FROM leave_requests
      WHERE employee_id = $1
      ORDER BY created_at DESC
    `;
    const { rows } = await db.query(queryText, [employeeId]);
    return rows;
  },

  /**
   * View all leave requests (for Manager dashboard)
   */
  async findAll() {
    const queryText = `
      SELECT lr.id, lr.employee_id, lr.leave_type, lr.start_date, lr.end_date,
             lr.reason, lr.document_path, lr.status, lr.manager_remarks, lr.created_at,
             u.username
      FROM leave_requests lr
      JOIN users u ON lr.employee_id = u.id
      ORDER BY lr.created_at DESC
    `;
    const { rows } = await db.query(queryText);
    return rows;
  },

  /**
   * Process a leave request (Approve or Reject with remarks and update balance if approved)
   * This is a complete transaction.
   */
  async updateStatus(id, status, remarks, managerId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch the leave request with a lock to prevent concurrent status updates
      const requestQuery = `
        SELECT id, employee_id, leave_type, start_date, end_date, status 
        FROM leave_requests 
        WHERE id = $1 
        FOR UPDATE
      `;
      const requestRes = await client.query(requestQuery, [id]);
      const request = requestRes.rows[0];

      if (!request) {
        throw new Error('Leave request not found');
      }

      if (request.status !== 'Pending') {
        throw new Error(`Leave request has already been processed. Current status: ${request.status}`);
      }

      const durationQuery = `SELECT ($1::DATE - $2::DATE + 1) AS duration`;
      const durationRes = await client.query(durationQuery, [request.end_date, request.start_date]);
      const duration = parseInt(durationRes.rows[0].duration, 10);

      // 2. If approved, deduct balance
      if (status === 'Approved') {
        const balanceCol = `${request.leave_type.toLowerCase()}_leave`;
        
        // Fetch balance with FOR UPDATE lock
        const balanceQuery = `
          SELECT ${balanceCol} AS balance 
          FROM leave_balances 
          WHERE employee_id = $1 
          FOR UPDATE
        `;
        const balanceRes = await client.query(balanceQuery, [request.employee_id]);
        
        if (!balanceRes.rows.length) {
          throw new Error('Employee leave balance record not found');
        }

        const currentBalance = balanceRes.rows[0].balance;

        if (currentBalance < duration) {
          throw new Error(`Insufficient leave balance. Needed: ${duration} days, Available: ${currentBalance} days`);
        }

        // Deduct balance
        const updateBalanceQuery = `
          UPDATE leave_balances 
          SET ${balanceCol} = ${balanceCol} - $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE employee_id = $2
        `;
        await client.query(updateBalanceQuery, [duration, request.employee_id]);
      }

      // 3. Update status and remarks
      const updateStatusQuery = `
        UPDATE leave_requests 
        SET status = $1, 
            manager_remarks = $2
        WHERE id = $3
        RETURNING id, employee_id, leave_type, start_date, end_date, status, manager_remarks, created_at
      `;
      const updateRes = await client.query(updateStatusQuery, [status, remarks, id]);
      const updatedRequest = updateRes.rows[0];

      // 4. Create in-app notification
      const notificationMessage = `Your leave request for ${updatedRequest.leave_type} (${new Date(updatedRequest.start_date).toLocaleDateString()} to ${new Date(updatedRequest.end_date).toLocaleDateString()}) has been ${status.toLowerCase()}.${remarks ? ' Remarks: ' + remarks : ''}`;
      
      const insertNotificationQuery = `
        INSERT INTO notifications (employee_id, leave_request_id, message)
        VALUES ($1, $2, $3)
      `;
      await client.query(insertNotificationQuery, [updatedRequest.employee_id, updatedRequest.id, notificationMessage]);

      await client.query('COMMIT');
      return updatedRequest;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = Leave;
