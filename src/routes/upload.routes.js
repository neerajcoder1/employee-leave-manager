const express = require('express');
const router = express.Router();
const { serveFile } = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Protect all upload files with authentication and ownership validation
router.get('/:filename', authenticate, serveFile);

module.exports = router;
