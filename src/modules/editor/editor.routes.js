const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middlewares/auth.middleware");
const { requireRole } = require("../../middlewares/role.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { z } = require("zod");
const editorValidation = require("./editor.validation");
const ctrl = require("./editor.controller");

const uuid = z.string().uuid();

router.use(authenticateToken);
router.use(requireRole(["editor", "admin"]));

// Series
router.get("/series", ctrl.listSeries);
router.get("/series/:seriesId", ctrl.getSeriesById);
router.get("/series/:seriesId/detail", ctrl.getSeriesDetail);
router.patch("/series/:seriesId", ctrl.updateSeries);
router.patch("/series/:seriesId/status", ctrl.updateSeriesStatus);
router.patch("/series/:seriesId/hide", ctrl.seriesWorkflow("hidden"));
router.patch("/series/:seriesId/archive", ctrl.seriesWorkflow("archived"));
router.patch("/series/:seriesId/republish", ctrl.seriesWorkflow("published"));

// Team
router.get("/series/:seriesId/members", ctrl.listMembers);
router.post("/series/:seriesId/members", ctrl.addMember);
router.patch("/series/:seriesId/members/:seriesMemberId", ctrl.updateMember);
router.delete("/series/:seriesId/members/:seriesMemberId", ctrl.removeMember);

// Dashboard
router.get("/dashboard/overview", ctrl.dashboardOverview);
router.get("/dashboard/series/:seriesId/progress", ctrl.seriesProgress);
router.get("/dashboard/chapters/:chapterId/progress", ctrl.chapterProgress);
router.get("/dashboard/tasks/summary", ctrl.taskSummary);
router.get("/dashboard/assistants/workload", ctrl.assistantsWorkload);
router.get(
  "/dashboard/assistants/:assistantId/performance",
  ctrl.assistantPerformance,
);

// Review Tasks
router.get("/review/page-tasks/pending", (req, res, next) => {
  req.query.status = "submitted";
  ctrl.listReviewTasks(req, res, next);
});
router.get("/review/page-tasks", ctrl.listReviewTasks);
router.get("/review/page-tasks/:taskId", ctrl.getReviewTaskById);
router.get("/review/page-tasks/:taskId/detail", ctrl.getReviewTaskDetail);
router.patch(
  "/page-tasks/:taskId/start-review",
  ctrl.taskWorkflow("start-review"),
);
router.patch("/page-tasks/:taskId/approve", ctrl.taskWorkflow("approve"));
router.patch(
  "/page-tasks/:taskId/request-revision",
  ctrl.taskWorkflow("request-revision"),
);
router.patch("/page-tasks/:taskId/reject", ctrl.taskWorkflow("reject"));
router.patch("/page-tasks/:taskId/complete", ctrl.taskWorkflow("complete"));
router.patch(
  "/page-tasks/:taskId/override-status",
  ctrl.taskWorkflow("override-status"),
);
router.patch("/page-tasks/bulk/approve", ctrl.bulkApproveTasks);
router.patch("/page-tasks/bulk/reject", ctrl.bulkRejectTasks);
router.patch("/page-tasks/bulk/request-revision", ctrl.bulkRequestRevision);
router.patch("/page-tasks/bulk/status", ctrl.bulkUpdateTaskStatus);

// Review Manuscripts
router.get("/review/manuscripts/pending", (req, res, next) => {
  req.query.status = "submitted";
  ctrl.listReviewManuscripts(req, res, next);
});
router.get("/review/manuscripts", ctrl.listReviewManuscripts);
router.get("/review/manuscripts/:manuscriptId", ctrl.getReviewManuscriptById);
router.get(
  "/review/manuscripts/:manuscriptId/detail",
  ctrl.getReviewManuscriptDetail,
);
router.patch(
  "/manuscripts/:manuscriptId/start-review",
  ctrl.manuscriptWorkflow("start-review"),
);
router.patch(
  "/manuscripts/:manuscriptId/approve",
  ctrl.manuscriptWorkflow("approve"),
);
router.patch(
  "/manuscripts/:manuscriptId/request-revision",
  ctrl.manuscriptWorkflow("request-revision"),
);
router.patch(
  "/manuscripts/:manuscriptId/reject",
  ctrl.manuscriptWorkflow("reject"),
);
router.patch(
  "/manuscripts/:manuscriptId/publish",
  ctrl.manuscriptWorkflow("publish"),
);
router.patch(
  "/manuscripts/:manuscriptId/archive",
  ctrl.manuscriptWorkflow("archive"),
);
router.patch(
  "/manuscripts/:manuscriptId/override-status",
  ctrl.manuscriptWorkflow("override-status"),
);
router.patch("/manuscripts/bulk/approve", ctrl.bulkApproveManuscripts);
router.patch("/manuscripts/bulk/reject", ctrl.bulkRejectManuscripts);
router.patch("/manuscripts/bulk/status", ctrl.bulkUpdateManuscriptStatus);

// Annotations
router.get("/pages/:pageId/annotations", ctrl.listAnnotationsByPage);
router.get("/page-regions/:regionId/annotations", ctrl.listAnnotationsByRegion);
router.get("/page-tasks/:taskId/annotations", ctrl.listAnnotationsByTask);
router.get("/annotations/:annotationId", ctrl.getAnnotationById);
router.post("/pages/:pageId/annotations", ctrl.createAnnotation);
router.patch("/annotations/:annotationId", ctrl.updateAnnotation);
router.patch("/annotations/:annotationId/status", ctrl.updateAnnotationStatus);
router.delete("/annotations/:annotationId", ctrl.deleteAnnotation);

// Feedbacks
router.get("/feedbacks", ctrl.getFeedbacks);
router.get("/page-tasks/:taskId/feedbacks", ctrl.listTaskFeedbacks);
router.post("/page-tasks/:taskId/feedbacks", ctrl.createFeedback);
router.patch("/page-task-feedbacks/:feedbackId", ctrl.updateFeedback);
router.patch(
  "/page-task-feedbacks/:feedbackId/status",
  ctrl.updateFeedbackStatus,
);
router.delete("/page-task-feedbacks/:feedbackId", ctrl.deleteFeedback);

// Review Sessions
router.get("/review-sessions", ctrl.listReviewSessions);
router.get("/review-sessions/:sessionId", ctrl.getReviewSessionById);
router.get("/review-sessions/:sessionId/detail", ctrl.getReviewSessionDetail);
router.post("/review-sessions", ctrl.createReviewSession);
router.patch("/review-sessions/:sessionId", ctrl.updateReviewSession);
router.patch(
  "/review-sessions/:sessionId/start",
  ctrl.reviewSessionWorkflow("start"),
);
router.patch(
  "/review-sessions/:sessionId/pause",
  ctrl.reviewSessionWorkflow("pause"),
);
router.patch(
  "/review-sessions/:sessionId/complete",
  ctrl.reviewSessionWorkflow("complete"),
);
router.patch(
  "/review-sessions/:sessionId/finish",
  ctrl.reviewSessionWorkflow("finish"),
);
router.patch(
  "/review-sessions/:sessionId/cancel",
  ctrl.reviewSessionWorkflow("cancel"),
);

// Alerts
router.get(
  "/alerts",
  validate(editorValidation.listAlertsSchema),
  ctrl.listAlerts,
);
router.patch(
  "/alerts/:alert_id/resolve",
  validate(editorValidation.alertIdParamSchema),
  ctrl.resolveAlert,
);

// Reports
router.get(
  "/reports",
  validate(editorValidation.listReportsSchema),
  ctrl.listReports,
);
router.post(
  "/reports",
  validate(editorValidation.createReportSchema),
  ctrl.createReport,
);
router.patch(
  "/reports/:report_id",
  validate(editorValidation.updateReportSchema),
  ctrl.updateReport,
);
router.post(
  "/reports/:report_id/submit",
  validate(editorValidation.submitReportSchema),
  ctrl.submitReport,
);

// Proposals
router.get(
  "/proposals",
  validate(editorValidation.listProposalsSchema),
  ctrl.listProposals,
);
router.post(
  "/proposals",
  validate(editorValidation.createProposalSchema),
  ctrl.createProposal,
);

// Team management
router.get("/team", validate(editorValidation.listTeamSchema), ctrl.listTeam);
router.post(
  "/team",
  validate(editorValidation.createTeamMemberSchema),
  ctrl.createTeamMember,
);
router.patch(
  "/team/:user_id",
  validate(editorValidation.updateTeamMemberSchema),
  ctrl.updateTeamMember,
);
router.delete(
  "/team/:user_id",
  validate(editorValidation.teamUserIdParamSchema),
  ctrl.deleteTeamMember,
);
router.post(
  "/team/:user_id/nudge",
  validate(editorValidation.teamUserIdParamSchema),
  ctrl.nudgeTeamMember,
);
router.post(
  "/meetings",
  validate(editorValidation.createMeetingSchema),
  ctrl.createMeeting,
);

// Notifications
router.get("/notifications", ctrl.listNotifications);
router.get("/notifications/unread", ctrl.getUnreadNotifications);
router.patch("/notifications/read-all", ctrl.markAllRead);
router.patch("/notifications/:notificationId/read", ctrl.markNotificationRead);
router.delete("/notifications/:notificationId", ctrl.deleteNotification);

module.exports = router;
