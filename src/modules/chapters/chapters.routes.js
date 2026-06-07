const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./chapters.validation');
const controller = require('./chapters.controller');

/**
 * @swagger
 * /api/chapters:
 *   get:
 *     tags: [Chapters]
 *     summary: List chapters (also nested under /api/series/:seriesId/chapters)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: seriesId
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of chapters }
 *   post:
 *     tags: [Chapters]
 *     summary: Create a chapter (mangaka, admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seriesId, title, chapterNumber]
 *             properties:
 *               seriesId: { type: string }
 *               title: { type: string, example: "Chapter 1 - The Beginning" }
 *               chapterNumber: { type: integer, example: 1 }
 *               description: { type: string }
 *     responses:
 *       201: { description: Chapter created }
 *       400: { description: Validation error }
 */
router.get('/', validate(v.listChaptersSchema), controller.listChapters);

/**
 * @swagger
 * /api/chapters/{chapterId}:
 *   get:
 *     tags: [Chapters]
 *     summary: Get chapter by ID
 *     security: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chapter data }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Chapters]
 *     summary: Update chapter (mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Chapters]
 *     summary: Delete chapter (admin)
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.get('/:chapterId', validate(v.chapterIdParamSchema), controller.getChapterById);

/**
 * @swagger
 * /api/chapters/{chapterId}/detail:
 *   get:
 *     tags: [Chapters]
 *     summary: Get chapter with full details (pages, regions, tasks)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chapter detail with nested data }
 */
router.get('/:chapterId/detail', validate(v.chapterIdParamSchema), controller.getChapterDetail);

/**
 * @swagger
 * /api/chapters/{chapterId}/status:
 *   patch:
 *     tags: [Chapters]
 *     summary: Update chapter status (editor, admin)
 *     parameters:
 *       - in: path
 *         name: chapterId
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
 *               status: { type: string, enum: [draft, in_review, published, archived] }
 *     responses:
 *       200: { description: Status updated }
 */
router.post('/', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.createChapterSchema), controller.createChapter);
router.patch('/:chapterId', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.updateChapterSchema), controller.updateChapter);
router.patch('/:chapterId/status', authenticateToken, requireRole(['admin', 'editor']), validate(v.updateChapterStatusSchema), controller.updateChapterStatus);
router.delete('/:chapterId', authenticateToken, requireRole(['admin']), validate(v.chapterIdParamSchema), controller.deleteChapter);

module.exports = router;
