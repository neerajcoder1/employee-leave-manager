const fs = require('fs');
const User = require('../models/user.model');
const Leave = require('../models/leave.model');

/**
 * Employee Controller
 */
const employeeController = {
  /**
   * Fetch current employee profile and leave balance
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await User.getProfileWithBalance(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Employee profile not found',
          errors: ['User profile not found in database']
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          id: profile.id,
          username: profile.username,
          role: profile.role,
          createdAt: profile.created_at,
          balances: {
            annual: profile.annual_leave,
            sick: profile.sick_leave,
            maternity: profile.maternity_leave
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Submit a new leave request (with optional supporting document)
   */
  async applyLeave(req, res, next) {
    try {
      const { leaveType, startDate, endDate, reason } = req.body;
      const employeeId = req.user.id;
      if (leaveType === 'Sick' && !req.file) {
        return res.status(400).json({ success: false, message: 'Supporting document is strictly required for Sick Leave.' });
      }

      // Create the leave request, passing the file object to be saved in DB
      try {
        const newLeave = await Leave.createLeaveRequest({
          employeeId,
          leaveType,
          startDate,
          endDate,
          reason,
          file: req.file
        });

        return res.status(201).json({
          success: true,
          message: 'Leave request submitted successfully',
          data: newLeave
        });
      } catch (dbError) {        
        return res.status(400).json({
          success: false,
          message: dbError.message || 'Failed to submit leave request',
          errors: [dbError.message]
        });
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * Retrieve leave request history of logged-in employee
   */
  async getLeaveHistory(req, res, next) {
    try {
      const employeeId = req.user.id;
      const history = await Leave.findByEmployeeId(employeeId);

      return res.status(200).json({
        success: true,
        message: 'Leave history retrieved successfully',
        data: history
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = employeeController;
