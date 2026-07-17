const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
require("dotenv").config();

const { errorHandler } = require("./middlewares/error.middleware");

// Module routes
const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const uploadsRoutes = require("./modules/uploads/uploads.routes");
const seriesRoutes = require("./modules/series/series.routes");
const seriesMembersRoutes = require("./modules/seriesMembers/seriesMembers.routes");
const chaptersRoutes = require("./modules/chapters/chapters.routes");
const pagesRoutes = require("./modules/pages/pages.routes");
const pageRegionsRoutes = require("./modules/pageRegions/pageRegions.routes");
const pageTasksRoutes = require("./modules/pageTasks/pageTasks.routes");
const pageTaskFeedbacksRoutes = require("./modules/pageTaskFeedbacks/pageTaskFeedbacks.routes");
const annotationsRoutes = require("./modules/annotations/annotations.routes");
const manuscriptsRoutes = require("./modules/manuscripts/manuscripts.routes");
const manuscriptFilesRoutes = require("./modules/manuscriptFiles/manuscriptFiles.routes");
const reviewSessionsRoutes = require("./modules/reviewSessions/reviewSessions.routes");
const votesRoutes = require("./modules/votes/votes.routes");
const rankingPeriodsRoutes = require("./modules/rankingPeriods/rankingPeriods.routes");
const seriesRankingsRoutes = require("./modules/seriesRankings/seriesRankings.routes");
const chapterRankingsRoutes = require("./modules/chapterRankings/chapterRankings.routes");
const notificationsRoutes = require("./modules/notifications/notifications.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const aiRoutes = require("./modules/ai/ai.routes");
const bookmarksRoutes = require("./modules/bookmarks/bookmarks.routes");
const chapterLikesRoutes = require("./modules/chapterLikes/chapterLikes.routes");
const commentsRoutes = require("./modules/comments/comments.routes");
const viewLogsRoutes = require("./modules/viewLogs/viewLogs.routes");
const pageTaskDraftRoutes = require("./modules/pageTaskDraft/pageTaskDraft.routes");
// Role-specific routes
const mangakaRoutes = require("./modules/mangaka/mangaka.routes");
const assistantRoutes = require("./modules/assistant/assistant.routes");
const editorRoutes = require("./modules/editor/editor.routes");
const boardRoutes = require("./modules/board/board.routes");
const rankingsRoutes2 = require("./modules/rankings/rankings.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const internalRoutes = require("./modules/internal/internal.routes");
const reviewRoutes = require("./modules/review/review.routes");
const submissionFeedbacksRoutes = require("./modules/review/submissionFeedbacks.routes");
const { requireInternalSecret } = require("./middlewares/internal.middleware");

const app = express();

// Swagger UI — disable CSP so the UI loads correctly
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Manga Management API",
    swaggerOptions: { persistAuthorization: true },
  }),
);
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder
app.use(express.static("public"));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Manga Management System Backend is running",
  });
});

// Auth & Users
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/uploads", uploadsRoutes);

// Series & nested
app.use("/api/series", seriesRoutes);
app.use("/api/series/:seriesId/members", seriesMembersRoutes);
app.use("/api/series/:seriesId/chapters", chaptersRoutes);
app.use("/api/series/:seriesId/review-sessions", reviewSessionsRoutes);
app.use("/api/series/:seriesId/rankings", seriesRankingsRoutes);
app.use("/api/series/:seriesId/chapter-rankings", chapterRankingsRoutes);
app.use("/api/series/:seriesId/manuscripts", manuscriptsRoutes);

// Series members standalone
app.use("/api/series-members", seriesMembersRoutes);

// Chapters & nested
app.use("/api/chapters", chaptersRoutes);
app.use("/api/chapters/:chapterId/pages", pagesRoutes);
app.use("/api/chapters/:chapterId/review-sessions", reviewSessionsRoutes);
app.use("/api/chapters/:chapterId/rankings", chapterRankingsRoutes);
app.use("/api/chapters/:chapterId/manuscripts", manuscriptsRoutes);

// Pages & nested
app.use("/api/pages", pagesRoutes);
app.use("/api/pages/:pageId/regions", pageRegionsRoutes);
app.use("/api/pages/:pageId/tasks", pageTasksRoutes);
app.use("/api/pages/:pageId/annotations", annotationsRoutes);
app.use("/api/pages/:pageId/ai", aiRoutes);

// Page regions standalone
app.use("/api/page-regions", pageRegionsRoutes);

// Page tasks standalone + nested
app.use("/api/page-tasks", pageTasksRoutes);
app.use("/api/page-tasks/:taskId/feedbacks", pageTaskFeedbacksRoutes);
app.use("/api/page-tasks/:taskId/annotations", annotationsRoutes);
app.use("/api/page-tasks/:taskId/ai", aiRoutes);
app.use("/api/page-tasks/:taskId/draft", pageTaskDraftRoutes);

// Assistants tasks
app.use("/api/assistants/:assistantId/tasks", pageTasksRoutes);

// Page task feedbacks standalone
app.use("/api/page-task-feedbacks", pageTaskFeedbacksRoutes);

// Annotations standalone
app.use("/api/annotations", annotationsRoutes);

// Manuscripts & files
app.use("/api/manuscripts", manuscriptsRoutes);
app.use("/api/manuscripts/:manuscriptId/files", manuscriptFilesRoutes);
app.use("/api/manuscript-files", manuscriptFilesRoutes);

// Review sessions & votes
app.use("/api/review-sessions", reviewSessionsRoutes);
app.use("/api/review-sessions/:sessionId/votes", votesRoutes);
app.use("/api/votes", votesRoutes);

// Rankings
app.use("/api/ranking-periods", rankingPeriodsRoutes);
app.use("/api/series-rankings", seriesRankingsRoutes);
app.use("/api/chapter-rankings", chapterRankingsRoutes);
app.use("/api/rankings/series/top", seriesRankingsRoutes);
app.use("/api/rankings/chapters/top", chapterRankingsRoutes);

// Users nested
app.use("/api/users/:userId/notifications", notificationsRoutes);
app.use("/api/users/:userId/votes", votesRoutes);
app.use("/api/users/:userId/manuscripts", manuscriptsRoutes);

// Mark all read for user
app.patch(
  "/api/users/:userId/notifications/read-all",
  require("./middlewares/auth.middleware").authenticateToken,
  (req, res, next) => {
    require("./modules/notifications/notifications.controller").markAllRead(
      req,
      res,
      next,
    );
  },
);

// Notifications standalone
app.use("/api/notifications", notificationsRoutes);
app.use("/api/bookmarks", bookmarksRoutes);
app.use("/api/chapter-likes", chapterLikesRoutes);
app.use("/api/chapters/:chapterId/comments", commentsRoutes);
app.use("/api/view-logs", viewLogsRoutes);

// Dashboard
app.use("/api/dashboard", dashboardRoutes);

// AI standalone (polling & reject)
app.use("/api/ai", aiRoutes);

// Role-specific routes
app.use("/api/mangaka", mangakaRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/editor", editorRoutes);
app.use("/api/board", boardRoutes);
app.use("/api/rankings", rankingsRoutes2);
app.use("/api/admin", adminRoutes);

// Public rankings (no auth)
app.use("/api/public/rankings", rankingsRoutes2);

// Review routes (mangaka, editor, admin)
app.use("/api/review", reviewRoutes);

// Submission feedbacks (shared by assistant + reviewer)
app.use(
  "/api/page-submissions/:submissionId/feedbacks",
  submissionFeedbacksRoutes,
);

// Internal service routes — protected by shared secret (x-internal-secret header)
app.use("/api/internal", requireInternalSecret, internalRoutes);

app.use(errorHandler);

module.exports = app;
