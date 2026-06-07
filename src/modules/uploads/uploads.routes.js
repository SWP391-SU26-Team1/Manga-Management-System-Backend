const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { uploadImage } = require('../../middlewares/upload.middleware');
const controller = require('./uploads.controller');

router.post('/single', authenticateToken, uploadImage.single('file'), controller.uploadSingle);
router.post('/multiple', authenticateToken, uploadImage.array('files'), controller.uploadMultiple);
// Delete is admin-only because publicId ownership is not tracked in the database
router.delete('/:publicId', authenticateToken, requireRole(['admin']), controller.deleteFile);

module.exports = router;
