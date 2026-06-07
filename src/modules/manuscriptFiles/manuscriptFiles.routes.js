const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./manuscriptFiles.validation');
const controller = require('./manuscriptFiles.controller');

/**
 * @swagger
 * /api/manuscript-files:
 *   get:
 *     tags: [Manuscript Files]
 *     summary: List manuscript files (also nested under /api/manuscripts/:manuscriptId/files)
 *     parameters:
 *       - in: query
 *         name: manuscriptId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: List of files }
 *   post:
 *     tags: [Manuscript Files]
 *     summary: Add file to manuscript (mangaka, admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [manuscriptId, fileUrl, fileName]
 *             properties:
 *               manuscriptId: { type: string }
 *               fileUrl: { type: string, example: "https://res.cloudinary.com/..." }
 *               publicId: { type: string }
 *               fileName: { type: string, example: "chapter1_draft.psd" }
 *               fileType: { type: string, enum: [image, pdf, archive], example: "image" }
 *               fileSize: { type: integer }
 *     responses:
 *       201: { description: File added }
 *
 * /api/manuscript-files/{fileId}:
 *   get:
 *     tags: [Manuscript Files]
 *     summary: Get file by ID
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: File data }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Manuscript Files]
 *     summary: Update file metadata (mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName: { type: string }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Manuscript Files]
 *     summary: Delete file (mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *
 * /api/manuscript-files/{fileId}/status:
 *   patch:
 *     tags: [Manuscript Files]
 *     summary: Update file status (editor, admin)
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, approved, rejected] }
 *     responses:
 *       200: { description: Status updated }
 */
router.get('/', authenticateToken, controller.listFiles);
router.get('/:fileId', authenticateToken, validate(v.fileIdParamSchema), controller.getFileById);
router.post('/', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.createFileSchema), controller.createFile);
router.patch('/:fileId', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.updateFileSchema), controller.updateFile);
router.patch('/:fileId/status', authenticateToken, requireRole(['admin', 'editor']), validate(v.updateFileStatusSchema), controller.updateFileStatus);
router.delete('/:fileId', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.fileIdParamSchema), controller.deleteFile);

module.exports = router;
