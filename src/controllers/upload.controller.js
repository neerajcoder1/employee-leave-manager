const path = require('path');
const fs = require('fs');
const db = require('../config/db');

/**
 * Serves uploaded documents securely checking for authentication and ownership
 */
const serveFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const documentPath = `uploads/${filename}`;

    // 1. Managers can access all documents
    if (req.user.role === 'manager') {
      const filePath = path.join(__dirname, '../../uploads', filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }
      return res.sendFile(filePath);
    }

    // 2. Employees can only access their own documents (anti-IDOR)
    const queryText = `
      SELECT employee_id 
      FROM leave_requests 
      WHERE document_path = $1
    `;
    const { rows } = await db.query(queryText, [documentPath]);

    if (rows.length === 0 || rows[0].employee_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this document',
        errors: ['Unauthorized document access']
      });
    }

    const filePath = path.join(__dirname, '../../uploads', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

module.exports = { serveFile };
