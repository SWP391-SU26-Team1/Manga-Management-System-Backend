const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./reviewSessions.validation');
const controller = require('./reviewSessions.controller');

/**
 * @swagger
 * /api/review-sessions:
 *   get:
 *     tags: [Review Sessions]
 *     summary: List review sessions (also nested under /api/series/:seriesId/review-sessions and /api/chapters/:chapterId/review-sessions)
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
 *       200: { description: List of review sessions }
 *   post:
 *     tags: [Review Sessions]
 *     summary: Create a review session (editor, admin)
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
 *               title: { type: string, example: "Chapter 5 Review" }
 *               description: { type: string }
 *               deadline: { type: string, format: date }
 *     responses:
 *       201: { description: Session created }
 *
 * /api/review-sessions/{sessionId}:
 *   get:
 *     tags: [Review Sessions]
 *     summary: Get review session by ID
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Session data }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Review Sessions]
 *     summary: Update review session (editor, admin)
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 *               deadline: { type: string, format: date }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Review Sessions]
 *     summary: Delete review session (editor, admin)
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *
 * /api/review-sessions/{sessionId}/status:
 *   patch:
 *     tags: [Review Sessions]
 *     summary: Update session status directly (editor, admin)
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 * /api/review-sessions/{sessionId}/start:
 *   patch:
 *     tags: [Review Sessions]
 *     summary: Start review session (editor, admin)
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Session started }
 *
 * /api/review-sessions/{sessionId}/pause:
 *   patch:
 *     tags: [Review Sessions]
 *     summary: Pause review session (editor, admin)
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Session paused }
 *
 * /api/review-sessions/{sessionId}/complete:
 *   patch:
 *     tags: [Review Sessions]
 *     summary: Complete review session (editor, admin)
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Session completed }
 *
 * /api/review-sessions/{sessionId}/finish:
 *   patch:
 *     tags: [Review Sessions]
 *     summary: Finish and close review session (editor, admin)
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Session finished }
 *
 * /api/review-sessions/{sessionId}/cancel:
 *   patch:
 *     tags: [Review Sessions]
 *     summary: Cancel review session (editor, admin)
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Session cancelled }
 */
router.get('/', authenticateToken, controller.listSessions);
router.get('/:sessionId', authenticateToken, validate(v.sessionIdParamSchema), controller.getSessionById);
router.post('/', authenticateToken, requireRole(['admin', 'editor']), validate(v.createSessionSchema), controller.createSession);
router.patch('/:sessionId', authenticateToken, requireRole(['admin', 'editor']), validate(v.updateSessionSchema), controller.updateSession);
router.patch('/:sessionId/status', authenticateToken, requireRole(['admin', 'editor']), validate(v.updateSessionStatusSchema), controller.updateSessionStatus);
router.delete('/:sessionId', authenticateToken, requireRole(['admin', 'editor']), validate(v.sessionIdParamSchema), controller.deleteSession);

router.patch('/:sessionId/start', authenticateToken, requireRole(['admin', 'editor']), validate(v.sessionIdParamSchema), controller.workflowAction('start'));
router.patch('/:sessionId/pause', authenticateToken, requireRole(['admin', 'editor']), validate(v.sessionIdParamSchema), controller.workflowAction('pause'));
router.patch('/:sessionId/complete', authenticateToken, requireRole(['admin', 'editor']), validate(v.sessionIdParamSchema), controller.workflowAction('complete'));
router.patch('/:sessionId/finish', authenticateToken, requireRole(['admin', 'editor']), validate(v.sessionIdParamSchema), controller.workflowAction('finish'));
router.patch('/:sessionId/cancel', authenticateToken, requireRole(['admin', 'editor']), validate(v.sessionIdParamSchema), controller.workflowAction('cancel'));

module.exports = router;
