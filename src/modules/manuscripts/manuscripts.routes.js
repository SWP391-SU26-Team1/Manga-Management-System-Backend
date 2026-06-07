const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./manuscripts.validation');
const controller = require('./manuscripts.controller');

/**
 * @swagger
 * /api/manuscripts:
 *   get:
 *     tags: [Manuscripts]
 *     summary: List manuscripts (also nested under /api/series/:seriesId/manuscripts and /api/chapters/:chapterId/manuscripts)
 *     parameters:
 *       - in: query
 *         name: seriesId
 *         schema: { type: string }
 *       - in: query
 *         name: chapterId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: List of manuscripts }
 *   post:
 *     tags: [Manuscripts]
 *     summary: Create a manuscript (mangaka, admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               seriesId: { type: string }
 *               chapterId: { type: string }
 *               title: { type: string, example: "Draft v1" }
 *               description: { type: string }
 *     responses:
 *       201: { description: Manuscript created }
 *
 * /api/manuscripts/{manuscriptId}:
 *   get:
 *     tags: [Manuscripts]
 *     summary: Get manuscript by ID
 *     parameters:
 *       - in: path
 *         name: manuscriptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Manuscript data }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Manuscripts]
 *     summary: Update manuscript (mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: manuscriptId
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
 *     tags: [Manuscripts]
 *     summary: Delete manuscript (mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: manuscriptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *
 * /api/manuscripts/{manuscriptId}/status:
 *   patch:
 *     tags: [Manuscripts]
 *     summary: Update manuscript status directly (editor, admin)
 *     parameters:
 *       - in: path
 *         name: manuscriptId
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
 *               status: { type: string }
 *     responses:
 *       200: { description: Status updated }
 *
 * /api/manuscripts/{manuscriptId}/submit:
 *   patch:
 *     tags: [Manuscripts]
 *     summary: Submit manuscript for review (mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: manuscriptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Submitted }
 *
 * /api/manuscripts/{manuscriptId}/start-review:
 *   patch:
 *     tags: [Manuscripts]
 *     summary: Start review (editor, admin)
 *     parameters:
 *       - in: path
 *         name: manuscriptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Review started }
 *
 * /api/manuscripts/{manuscriptId}/approve:
 *   patch:
 *     tags: [Manuscripts]
 *     summary: Approve manuscript (editor, admin)
 *     parameters:
 *       - in: path
 *         name: manuscriptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Approved }
 *
 * /api/manuscripts/{manuscriptId}/request-revision:
 *   patch:
 *     tags: [Manuscripts]
 *     summary: Request revision (editor, admin)
 *     parameters:
 *       - in: path
 *         name: manuscriptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Revision requested }
 *
 * /api/manuscripts/{manuscriptId}/reject:
 *   patch:
 *     tags: [Manuscripts]
 *     summary: Reject manuscript (editor, admin)
 *     parameters:
 *       - in: path
 *         name: manuscriptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Rejected }
 *
 * /api/manuscripts/{manuscriptId}/publish:
 *   patch:
 *     tags: [Manuscripts]
 *     summary: Publish manuscript (editor, admin)
 *     parameters:
 *       - in: path
 *         name: manuscriptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Published }
 *
 * /api/manuscripts/{manuscriptId}/archive:
 *   patch:
 *     tags: [Manuscripts]
 *     summary: Archive manuscript (editor, admin)
 *     parameters:
 *       - in: path
 *         name: manuscriptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Archived }
 *
 * /api/manuscripts/{manuscriptId}/hide:
 *   patch:
 *     tags: [Manuscripts]
 *     summary: Hide manuscript (editor, admin)
 *     parameters:
 *       - in: path
 *         name: manuscriptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Hidden }
 */
router.get('/', authenticateToken, controller.listManuscripts);
router.get('/:manuscriptId', authenticateToken, validate(v.manuscriptIdParamSchema), controller.getManuscriptById);
router.post('/', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.createManuscriptSchema), controller.createManuscript);
router.patch('/:manuscriptId', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.updateManuscriptSchema), controller.updateManuscript);
router.patch('/:manuscriptId/status', authenticateToken, requireRole(['admin', 'editor']), validate(v.updateManuscriptStatusSchema), controller.updateManuscriptStatus);
router.delete('/:manuscriptId', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.manuscriptIdParamSchema), controller.deleteManuscript);

router.patch('/:manuscriptId/submit', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.manuscriptIdParamSchema), controller.workflowAction('submit'));
router.patch('/:manuscriptId/start-review', authenticateToken, requireRole(['admin', 'editor']), validate(v.manuscriptIdParamSchema), controller.workflowAction('start-review'));
router.patch('/:manuscriptId/approve', authenticateToken, requireRole(['admin', 'editor']), validate(v.manuscriptIdParamSchema), controller.workflowAction('approve'));
router.patch('/:manuscriptId/request-revision', authenticateToken, requireRole(['admin', 'editor']), validate(v.manuscriptIdParamSchema), controller.workflowAction('request-revision'));
router.patch('/:manuscriptId/reject', authenticateToken, requireRole(['admin', 'editor']), validate(v.manuscriptIdParamSchema), controller.workflowAction('reject'));
router.patch('/:manuscriptId/publish', authenticateToken, requireRole(['admin', 'editor']), validate(v.manuscriptIdParamSchema), controller.workflowAction('publish'));
router.patch('/:manuscriptId/archive', authenticateToken, requireRole(['admin', 'editor']), validate(v.manuscriptIdParamSchema), controller.workflowAction('archive'));
router.patch('/:manuscriptId/hide', authenticateToken, requireRole(['admin', 'editor']), validate(v.manuscriptIdParamSchema), controller.workflowAction('hide'));

module.exports = router;
