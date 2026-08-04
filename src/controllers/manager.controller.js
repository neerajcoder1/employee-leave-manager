const User = require('../models/user.model');
const Leave = require('../models/leave.model');
const logger = require('../config/logger');

/**
 * Manager Controller
 */
const managerController = {
  /**
   * List all registered employees along with their current leave balances
   */
  async getEmployees(req, res, next) {
    try {
      const employees = await User.getAllEmployees();

      return res.status(200).json({
        success: true,
        message: 'Employees list retrieved successfully',
        data: employees
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * List all leave requests submitted by all employees
   */
  async getAllLeaves(req, res, next) {
    try {
      const leaves = await Leave.findAll();

      return res.status(200).json({
        success: true,
        message: 'All leave requests retrieved successfully',
        data: leaves
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Process a leave request (Approve or Reject with remarks)
   */
  async updateLeaveStatus(req, res, next) {
    try {
      const leaveId = req.params.id;
      const { status, managerRemarks } = req.body;
      const managerId = req.user.id;

      try {
        const updatedLeave = await Leave.updateStatus(leaveId, status, managerRemarks, managerId);

        // Audit Log
        logger.info(`Leave request processed: ID "${leaveId}", Status "${status}", Remarks "${managerRemarks || ''}"`, { managerId, ip: req.ip });

        return res.status(200).json({
          success: true,
          message: `Leave request has been ${status.toLowerCase()} successfully`,
          data: updatedLeave
        });
      } catch (dbError) {
        return res.status(400).json({
          success: false,
          message: dbError.message || 'Failed to update leave request status',
          errors: [dbError.message]
        });
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a leave request entirely from history
   */
  async deleteLeave(req, res, next) {
    try {
      const leaveId = req.params.id;
      const deletedLeave = await Leave.delete(leaveId);

      if (!deletedLeave) {
        return res.status(404).json({
          success: false,
          message: 'Leave request not found'
        });
      }

      logger.info(`Leave request deleted: ID "${leaveId}"`, { managerId: req.user.id, ip: req.ip });

      return res.status(200).json({
        success: true,
        message: 'Leave request deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = managerController;
