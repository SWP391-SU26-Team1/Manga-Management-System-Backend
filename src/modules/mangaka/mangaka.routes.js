const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middlewares/auth.middleware");
const { requireRole } = require("../../middlewares/role.middleware");

const seriesRoutes = require("./mangakaSeries.routes");
const chaptersRoutes = require("./mangakaChapters.routes");
const pagesRoutes = require("./mangakaPages.routes");
const regionsRoutes = require("./mangakaPageRegions.routes");
const pageTasksRoutes = require("./mangakaPageTasks.routes");
const { seriesTaskRouter } = require("./mangakaPageTasks.routes");
const annotationsRoutes = require("./mangakaAnnotations.routes");
const manuscriptsRoutes = require("./mangakaManuscripts.routes");
const notificationsRoutes = require("./mangakaNotifications.routes");
const dashboardRoutes = require("./mangakaDashboard.routes");
const exportRoutes = require("./mangakaExport.routes");
const importRoutes = require("./mangakaImport.routes");

// All mangaka routes require authentication and mangaka role
router.use(authenticateToken);
router.use(requireRole(["mangaka", "admin"]));

// Flat series routes (with member sub-routes inline)
router.use("/series", seriesRoutes);

// Series-level task overview + allocation
router.use("/series/:seriesId/tasks", seriesTaskRouter);

// Nested: /series/:seriesId/chapters
router.use("/series/:seriesId/chapters", chaptersRoutes);

// Nested: /series/:seriesId/chapters/:chapterId/pages
router.use("/series/:seriesId/chapters/:chapterId/pages", pagesRoutes);

// Nested: /series/:seriesId/chapters/:chapterId/pages/:pageId/regions
router.use(
  "/series/:seriesId/chapters/:chapterId/pages/:pageId/regions",
  regionsRoutes,
);

// Nested: /series/:seriesId/chapters/:chapterId/pages/:pageId/tasks
router.use(
  "/series/:seriesId/chapters/:chapterId/pages/:pageId/tasks",
  pageTasksRoutes,
);

// Nested: /series/:seriesId/chapters/:chapterId/pages/:pageId/annotations
router.use(
  "/series/:seriesId/chapters/:chapterId/pages/:pageId/annotations",
  annotationsRoutes,
);

// Nested: /series/:seriesId/manuscripts
router.use("/series/:seriesId/manuscripts", manuscriptsRoutes);

// Flat: /notifications (personal)
router.use("/notifications", notificationsRoutes);

// Dashboard: /dashboard/series/:seriesId/...
router.use("/dashboard", dashboardRoutes);

// Export: /export/series/:seriesId
router.use("/export", exportRoutes);

// Import: /import/series/:seriesId/...
router.use("/import", importRoutes);

module.exports = router;
