const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middlewares/auth.middleware");
const { requireRole } = require("../../middlewares/role.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { z } = require("zod");
const ctrl = require("./assistant.controller");

const uuid = z.string().uuid();

router.use(authenticateToken);
router.use(requireRole(["assistant", "admin"]));

// Tasks
router.get("/page-tasks", ctrl.listMyTasks);
router.get(
  "/page-tasks/:taskId",
  validate(z.object({ params: z.object({ taskId: uuid }) })),
  ctrl.getTaskById,
);
router.get(
  "/page-tasks/:taskId/detail",
  validate(z.object({ params: z.object({ taskId: uuid }) })),
  ctrl.getTaskDetail,
);
router.patch(
  "/page-tasks/:taskId/start",
  validate(z.object({ params: z.object({ taskId: uuid }) })),
  ctrl.taskWorkflow("start"),
);
router.patch(
  "/page-tasks/:taskId/submit",
  validate(
    z.object({
      params: z.object({ taskId: uuid }),
      body: z.object({ content: z.string().optional() }),
    }),
  ),
  ctrl.taskWorkflow("submit"),
);
router.patch(
  "/page-tasks/:taskId/resubmit",
  validate(
    z.object({
      params: z.object({ taskId: uuid }),
      body: z.object({ content: z.string().optional() }),
    }),
  ),
  ctrl.taskWorkflow("resubmit"),
);
router.patch(
  "/page-tasks/:taskId/hold",
  validate(z.object({ params: z.object({ taskId: uuid }) })),
  ctrl.taskWorkflow("hold"),
);

// Submissions
router.post(
  "/page-tasks/:taskId/submissions",
  validate(
    z.object({
      params: z.object({ taskId: uuid }),
      body: z.object({
        file_url: z.string().url(),
        submission_notes: z.string().optional(),
        suggestion_id: uuid.optional(),
      }),
    }),
  ),
  ctrl.createSubmission,
);
router.get(
  "/page-tasks/:taskId/submissions",
  validate(z.object({ params: z.object({ taskId: uuid }) })),
  ctrl.listTaskSubmissions,
);
router.get(
  "/page-submissions/:submissionId",
  validate(z.object({ params: z.object({ submissionId: uuid }) })),
  ctrl.getSubmissionById,
);

// Feedbacks (submission-scoped)
router.get(
  "/page-submissions/:submissionId/feedbacks",
  validate(z.object({ params: z.object({ submissionId: uuid }) })),
  ctrl.listSubmissionFeedbacks,
);
router.post(
  "/page-submissions/:submissionId/feedbacks",
  validate(
    z.object({
      params: z.object({ submissionId: uuid }),
      body: z.object({ content: z.string().min(1) }),
    }),
  ),
  ctrl.createSubmissionFeedback,
);

// Annotations
router.get("/page-tasks/:taskId/annotations", ctrl.listTaskAnnotations);
router.get("/pages/:pageId/annotations", ctrl.listPageAnnotations);
router.get("/page-regions/:regionId/annotations", ctrl.listRegionAnnotations);

// Manuscript files
router.get("/manuscripts/:manuscriptId/files", ctrl.listManuscriptFiles);
router.post(
  "/manuscripts/:manuscriptId/files",
  validate(
    z.object({
      params: z.object({ manuscriptId: uuid }),
      body: z.object({
        file_url: z.string().url(),
        file_name: z.string().min(1),
        file_type: z.string().optional(),
        description: z.string().optional(),
      }),
    }),
  ),
  ctrl.addManuscriptFile,
);
router.post(
  "/manuscripts/:manuscriptId/files/bulk",
  validate(
    z.object({
      params: z.object({ manuscriptId: uuid }),
      body: z.object({
        files: z
          .array(
            z.object({
              file_url: z.string().url(),
              file_name: z.string().min(1),
            }),
          )
          .min(1),
      }),
    }),
  ),
  ctrl.bulkAddManuscriptFiles,
);

// Dashboard & Performance
router.get("/dashboard/overview", ctrl.dashboardOverview);
router.get("/dashboard/performance", ctrl.dashboardPerformance);
router.get("/performance/breakdown", ctrl.performanceBreakdown);
router.get("/performance/by-series", ctrl.performanceBySeries);
router.get("/performance/by-chapter", ctrl.performanceByChapter);

// Notifications
router.get("/notifications", ctrl.listNotifications);
router.get("/notifications/unread", ctrl.getUnreadNotifications);
router.patch("/notifications/read-all", ctrl.markAllRead);
router.patch("/notifications/:notificationId/read", ctrl.markNotificationRead);
router.delete("/notifications/:notificationId", ctrl.deleteNotification);

// --- Drafts (Bản Nháp) ---
router.get("/drafts/manuscripts", ctrl.listDraftManuscripts);
router.get("/drafts/pages", ctrl.listDraftPages);
router.get(
  "/drafts/manuscripts/:manuscriptId",
  validate(z.object({ params: z.object({ manuscriptId: uuid }) })),
  ctrl.getManuscriptDetail,
);
router.get(
  "/drafts/pages/:pageId",
  validate(z.object({ params: z.object({ pageId: uuid }) })),
  ctrl.getDraftPageDetail,
);
router.patch(
  "/drafts/manuscripts/:manuscriptId",
  validate(
    z.object({
      params: z.object({ manuscriptId: uuid }),
      body: z.object({
        title: z.string().optional(),
        content: z.string().optional(),
      }),
    }),
  ),
  ctrl.updateManuscriptDraft,
);
router.delete(
  "/drafts/manuscripts/:manuscriptId",
  validate(z.object({ params: z.object({ manuscriptId: uuid }) })),
  ctrl.deleteManuscriptDraft,
);

// --- Drawing & Editing (Vẽ & Chỉnh sửa) ---
router.get("/drawing/pages", ctrl.listDrawingPages);
router.get(
  "/drawing/pages/:pageId",
  validate(z.object({ params: z.object({ pageId: uuid }) })),
  ctrl.getDrawingPageDetail,
);
router.get(
  "/drawing/pages/:pageId/versions",
  validate(z.object({ params: z.object({ pageId: uuid }) })),
  ctrl.listPageVersions,
);
router.get(
  "/drawing/versions/:versionId",
  validate(z.object({ params: z.object({ versionId: uuid }) })),
  ctrl.getVersionDetail,
);
router.get("/drawing/tasks", ctrl.listMyDrawingTasks);
router.patch(
  "/drawing/pages/:pageId/status",
  validate(
    z.object({
      params: z.object({ pageId: uuid }),
      body: z.object({ status: z.string().min(1) }),
    }),
  ),
  ctrl.updatePageDrawingStatus,
);

module.exports = router;
