const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./pages.validation');
const controller = require('./pages.controller');

/**
 * @swagger
 * /api/pages:
 *   get:
 *     tags: [Pages]
 *     summary: List pages (also nested under /api/chapters/:chapterId/pages)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: chapterId
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of pages }
 *   post:
 *     tags: [Pages]
 *     summary: Create a page (mangaka, admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chapterId, pageNumber]
 *             properties:
 *               chapterId: { type: string }
 *               pageNumber: { type: integer, example: 1 }
 *               imageUrl: { type: string }
 *     responses:
 *       201: { description: Page created }
 */
router.get('/', validate(v.listPagesSchema), controller.listPages);

/**
 * @swagger
 * /api/pages/{pageId}:
 *   get:
 *     tags: [Pages]
 *     summary: Get page by ID
 *     security: []
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Page data }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Pages]
 *     summary: Update page (mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pageNumber: { type: integer }
 *               imageUrl: { type: string }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Pages]
 *     summary: Delete page (admin)
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.get('/:pageId', validate(v.pageIdParamSchema), controller.getPageById);

/**
 * @swagger
 * /api/pages/{pageId}/detail:
 *   get:
 *     tags: [Pages]
 *     summary: Get page with full details (regions, tasks, annotations)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Page detail with nested data }
 */
router.get('/:pageId/detail', validate(v.pageIdParamSchema), controller.getPageDetail);

/**
 * @swagger
 * /api/pages/{pageId}/status:
 *   patch:
 *     tags: [Pages]
 *     summary: Update page status (editor, admin)
 *     parameters:
 *       - in: path
 *         name: pageId
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
 *               status: { type: string, enum: [draft, in_review, approved, published] }
 *     responses:
 *       200: { description: Status updated }
 */
router.post('/', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.createPageSchema), controller.createPage);
router.patch('/:pageId', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.updatePageSchema), controller.updatePage);
router.patch('/:pageId/status', authenticateToken, requireRole(['admin', 'editor']), validate(v.updatePageStatusSchema), controller.updatePageStatus);
router.delete('/:pageId', authenticateToken, requireRole(['admin']), validate(v.pageIdParamSchema), controller.deletePage);

module.exports = router;
