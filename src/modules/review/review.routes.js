const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { z } = require('zod');
const ctrl = require('./review.controller');

const uuid = z.string().uuid();
const submissionIdParam = z.object({ params: z.object({ submissionId: uuid }) });

router.use(authenticateToken);
router.use(requireRole(['mangaka', 'editor', 'admin']));

/**
 * @swagger
 * /api/review/page-submissions/pending:
 *   get:
 *     tags: [Review]
 *     summary: List all pending submissions (mangaka, editor, admin)
 *     responses:
 *       200: { description: List of pending submissions }
 */
router.get('/page-submissions/pending', ctrl.listPendingSubmissions);

/**
 * @swagger
 * /api/review/page-submissions/{submissionId}:
 *   get:
 *     tags: [Review]
 *     summary: Get submission by ID
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Submission data }
 *       404: { description: Not found }
 */
router.get('/page-submissions/:submissionId', validate(submissionIdParam), ctrl.getSubmissionById);

/**
 * @swagger
 * /api/review/page-submissions/{submissionId}/approve:
 *   patch:
 *     tags: [Review]
 *     summary: Approve a submission — sets submission_status=approved, task=approved, version_type=approved
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Approved }
 */
router.patch('/page-submissions/:submissionId/approve', validate(submissionIdParam), ctrl.approveSubmission);

/**
 * @swagger
 * /api/review/page-submissions/{submissionId}/reject:
 *   patch:
 *     tags: [Review]
 *     summary: Reject a submission — sets submission_status=rejected, task=rejected
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Rejected }
 */
router.patch('/page-submissions/:submissionId/reject', validate(submissionIdParam), ctrl.rejectSubmission);

/**
 * @swagger
 * /api/review/page-submissions/{submissionId}/request-revision:
 *   patch:
 *     tags: [Review]
 *     summary: Request revision — sets needs_revision, auto-creates feedback record
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
 *               content: { type: string, example: "Màu nền hơi sáng, cần chỉnh tối hơn." }
 *     responses:
 *       200: { description: Revision requested, feedback created }
 */
router.patch(
  '/page-submissions/:submissionId/request-revision',
  validate(z.object({ params: z.object({ submissionId: uuid }), body: z.object({ content: z.string().min(1) }) })),
  ctrl.requestRevision
);

module.exports = router;
