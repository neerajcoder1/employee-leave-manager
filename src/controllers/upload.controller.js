const path = require('path');
const fs = require('fs');
const db = require('../config/db');

/**
 * Serves uploaded documents securely checking for authentication and ownership
 */
const serveFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    // Strip the extension to get the UUID for the database query
    const documentId = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
    // The path in the database matches exactly what was requested
    const documentPath = `uploads/${filename}`;

    // 1. Authorization Check
    let isAuthorized = false;

    if (req.user.role === 'manager') {
      isAuthorized = true;
    } else {
      // Employees can only access their own documents
      const queryText = `
        SELECT employee_id 
        FROM leave_requests 
        WHERE document_path = $1
      `;
      const { rows } = await db.query(queryText, [documentPath]);

      if (rows.length > 0 && rows[0].employee_id === req.user.id) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this document',
        errors: ['Unauthorized document access']
      });
    }

    // 2. Fetch the document from the database
    const docQuery = `SELECT filename, mime_type, file_data FROM documents WHERE id = $1`;
    const docRes = await db.query(docQuery, [documentId]);

    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const document = docRes.rows[0];

    // 3. Send the document with correct headers
    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`);
    return res.send(document.file_data);

  } catch (error) {
    if (error.code === '22P02') { // Invalid UUID format (old file path)
        return res.status(404).json({ success: false, message: 'Document not found (Old format)' });
    }
    next(error);
  }
};

module.exports = { serveFile };
