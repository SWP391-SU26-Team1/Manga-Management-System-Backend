const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./pageTaskFeedbacks.validation');
const controller = require('./pageTaskFeedbacks.controller');

/**
 * @swagger
 * /api/page-task-feedbacks:
 *   get:
 *     tags: [Page Task Feedbacks]
 *     summary: List feedbacks (also nested under /api/page-tasks/:taskId/feedbacks)
 *     parameters:
 *       - in: query
 *         name: taskId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: List of feedbacks }
 *   post:
 *     tags: [Page Task Feedbacks]
 *     summary: Create feedback on a task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taskId, content]
 *             properties:
 *               taskId: { type: string }
 *               content: { type: string, example: "Please fix the line weight on panel 3" }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *     responses:
 *       201: { description: Feedback created }
 *
 * /api/page-task-feedbacks/{feedbackId}:
 *   get:
 *     tags: [Page Task Feedbacks]
 *     summary: Get feedback by ID
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Feedback data }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Page Task Feedbacks]
 *     summary: Update feedback
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string }
 *               rating: { type: integer }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Page Task Feedbacks]
 *     summary: Delete feedback (editor, mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *
 * /api/page-task-feedbacks/{feedbackId}/status:
 *   patch:
 *     tags: [Page Task Feedbacks]
 *     summary: Update feedback status (editor, mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: feedbackId
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
 *               status: { type: string, enum: [open, resolved, dismissed] }
 *     responses:
 *       200: { description: Status updated }
 */
router.get('/', authenticateToken, controller.listFeedbacks);
router.get('/:feedbackId', authenticateToken, validate(v.feedbackIdParamSchema), controller.getFeedbackById);
router.post('/', authenticateToken, validate(v.createFeedbackSchema), controller.createFeedback);
router.patch('/:feedbackId', authenticateToken, validate(v.updateFeedbackSchema), controller.updateFeedback);
router.patch('/:feedbackId/status', authenticateToken, requireRole(['admin', 'editor', 'mangaka']), validate(v.updateFeedbackStatusSchema), controller.updateFeedbackStatus);
router.delete('/:feedbackId', authenticateToken, requireRole(['admin', 'editor', 'mangaka']), validate(v.feedbackIdParamSchema), controller.deleteFeedback);

module.exports = router;
