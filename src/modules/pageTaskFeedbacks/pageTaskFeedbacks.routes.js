const express = require("express");
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require("../../middlewares/auth.middleware");
const { requireRole } = require("../../middlewares/role.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const v = require("./pageTaskFeedbacks.validation");
const controller = require("./pageTaskFeedbacks.controller");

/**
 * @swagger
 * /api/page-task-feedbacks:
 *   get:
 *     tags: [Page Task Feedbacks]
 *     summary: List all feedbacks
 *     responses:
 *       200: { description: List of feedbacks }
 *   post:
 *     tags: [Page Task Feedbacks]
 *     summary: Create feedback on a submission
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [submission_id, content]
 *             properties:
 *               submission_id: { type: string, format: uuid }
 *               mangaka_id: { type: string, format: uuid }
 *               assistant_id: { type: string, format: uuid }
 *               content: { type: string, example: "Please fix the line weight on panel 3" }
 *     responses:
 *       201: { description: Feedback created }
 *       404: { description: Submission not found }
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
 *     summary: Update feedback content
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
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Page Task Feedbacks]
 *     summary: Delete feedback
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 *
 * /api/page-submissions/{submissionId}/feedbacks:
 *   get:
 *     tags: [Page Task Feedbacks]
 *     summary: Get feedbacks for a submission
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of feedbacks }
 *       404: { description: Submission not found }
 *   post:
 *     tags: [Page Task Feedbacks]
 *     summary: Create feedback on a submission
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
 *               mangaka_id: { type: string, format: uuid }
 *               assistant_id: { type: string, format: uuid }
 *               content: { type: string }
 *     responses:
 *       201: { description: Feedback created }
 *       404: { description: Submission not found }
 */
router.get("/", authenticateToken, controller.listFeedbacks);
router.get(
  "/:feedbackId",
  authenticateToken,
  validate(v.feedbackIdParamSchema),
  controller.getFeedbackById,
);
router.post(
  "/",
  authenticateToken,
  validate(v.createFeedbackSchema),
  controller.createFeedback,
);
router.patch(
  "/:feedbackId",
  authenticateToken,
  validate(v.updateFeedbackSchema),
  controller.updateFeedback,
);
router.delete(
  "/:feedbackId",
  authenticateToken,
  validate(v.feedbackIdParamSchema),
  controller.deleteFeedback,
);

// Nested routes for submissions
router.get(
  "/submission/:submissionId",
  authenticateToken,
  validate(v.submissionIdParamSchema),
  controller.getFeedbacksBySubmission,
);
router.post(
  "/submission/:submissionId",
  authenticateToken,
  validate(v.createFeedbackSchema),
  controller.createFeedback,
);

module.exports = router;
