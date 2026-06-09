const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { z } = require('zod');
const ctrl = require('./review.controller');

/**
 * @swagger
 * /api/page-submissions/{submissionId}/feedbacks:
 *   get:
 *     tags: [Page Task Feedbacks]
 *     summary: List feedbacks for a submission
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of feedbacks }
 *   post:
 *     tags: [Page Task Feedbacks]
 *     summary: Add feedback on a submission
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: "Cần chỉnh lại ánh sáng nhân vật." }
 *     responses:
 *       201: { description: Feedback created }
 */
router.get('/', authenticateToken, ctrl.listFeedbacks);
router.post(
  '/',
  authenticateToken,
  validate(z.object({ body: z.object({ content: z.string().min(1) }) })),
  ctrl.createFeedback
);

module.exports = router;
