const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const ctrl = require('./admin.controller');

router.use(authenticateToken);
router.use(requireRole(['admin']));

// Users
router.get('/users', ctrl.listUsers);
router.get('/users/:userId', ctrl.getUserById);
router.post('/users', ctrl.createUser);
router.patch('/users/:userId', ctrl.updateUser);
router.patch('/users/:userId/status', ctrl.updateUserStatus);
router.patch('/users/:userId/role', ctrl.updateUserRole);
router.delete('/users/:userId', ctrl.deleteUser);

// Series
router.get('/series', ctrl.listAdminSeries);
router.get('/series/:seriesId', ctrl.getAdminSeriesById);
router.patch('/series/:seriesId/status', ctrl.updateAdminSeriesStatus);
router.delete('/series/:seriesId', ctrl.deleteAdminSeries);

// Chapters
router.get('/chapters', ctrl.listAdminChapters);
router.get('/chapters/:chapterId', ctrl.getAdminChapterById);
router.patch('/chapters/:chapterId/status', ctrl.updateAdminChapterStatus);
router.delete('/chapters/:chapterId', ctrl.deleteAdminChapter);

// Pages
router.get('/pages', ctrl.listAdminPages);
router.get('/pages/:pageId', ctrl.getAdminPageById);
router.patch('/pages/:pageId/status', ctrl.updateAdminPageStatus);
router.delete('/pages/:pageId', ctrl.deleteAdminPage);

// Tasks
router.get('/page-tasks', ctrl.listAdminTasks);
router.get('/page-tasks/:taskId', ctrl.getAdminTaskById);
router.patch('/page-tasks/:taskId', ctrl.updateAdminTask);
router.patch('/page-tasks/:taskId/status', ctrl.updateAdminTaskStatus);
router.delete('/page-tasks/:taskId', ctrl.deleteAdminTask);

// Feedbacks
router.get('/page-task-feedbacks', ctrl.listAdminFeedbacks);
router.get('/page-task-feedbacks/:feedbackId', ctrl.getAdminFeedbackById);
router.patch('/page-task-feedbacks/:feedbackId/status', ctrl.updateAdminFeedbackStatus);
router.delete('/page-task-feedbacks/:feedbackId', ctrl.deleteAdminFeedback);

// Annotations
router.get('/annotations', ctrl.listAdminAnnotations);
router.get('/annotations/:annotationId', ctrl.getAdminAnnotationById);
router.patch('/annotations/:annotationId/status', ctrl.updateAdminAnnotationStatus);
router.delete('/annotations/:annotationId', ctrl.deleteAdminAnnotation);

// Review Sessions
router.get('/review-sessions', ctrl.listAdminSessions);
router.get('/review-sessions/:sessionId', ctrl.getAdminSessionById);
router.patch('/review-sessions/:sessionId', ctrl.updateAdminSession);
router.patch('/review-sessions/:sessionId/status', ctrl.updateAdminSessionStatus);
router.delete('/review-sessions/:sessionId', ctrl.deleteAdminSession);

// Votes
router.get('/votes', ctrl.listAdminVotes);
router.get('/votes/:voteId', ctrl.getAdminVoteById);
router.patch('/votes/:voteId', ctrl.updateAdminVote);
router.patch('/votes/:voteId/status', ctrl.updateAdminVoteStatus);
router.delete('/votes/:voteId', ctrl.deleteAdminVote);

// Ranking Periods
router.get('/ranking-periods', ctrl.listAdminPeriods);
router.get('/ranking-periods/:periodId', ctrl.getAdminPeriodById);
router.post('/ranking-periods', ctrl.createAdminPeriod);
router.patch('/ranking-periods/:periodId', ctrl.updateAdminPeriod);
router.patch('/ranking-periods/:periodId/status', ctrl.updateAdminPeriodStatus);
router.delete('/ranking-periods/:periodId', ctrl.deleteAdminPeriod);

// Series Rankings
router.get('/series-rankings', ctrl.listAdminSeriesRankings);
router.post('/series-rankings', ctrl.createAdminSeriesRanking);
router.patch('/series-rankings/:seriesRankingId', ctrl.updateAdminSeriesRanking);
router.delete('/series-rankings/:seriesRankingId', ctrl.deleteAdminSeriesRanking);

// Chapter Rankings
router.get('/chapter-rankings', ctrl.listAdminChapterRankings);
router.post('/chapter-rankings', ctrl.createAdminChapterRanking);
router.patch('/chapter-rankings/:chapterRankingId', ctrl.updateAdminChapterRanking);
router.delete('/chapter-rankings/:chapterRankingId', ctrl.deleteAdminChapterRanking);

// Notifications
router.get('/notifications', ctrl.listAdminNotifications);
router.get('/notifications/:notificationId', ctrl.getAdminNotificationById);
router.post('/notifications', ctrl.createAdminNotification);
router.patch('/notifications/:notificationId', ctrl.updateAdminNotification);
router.delete('/notifications/:notificationId', ctrl.deleteAdminNotification);

// Dashboard
router.get('/dashboard/overview', ctrl.dashboardOverview);
router.get('/dashboard/users', ctrl.dashboardUsers);
router.get('/dashboard/series', ctrl.dashboardSeries);
router.get('/dashboard/tasks', ctrl.dashboardTasks);
router.get('/dashboard/reviews', ctrl.dashboardReviews);
router.get('/dashboard/rankings', ctrl.dashboardRankings);
router.get('/dashboard/notifications', ctrl.dashboardNotifications);

// Export
router.get('/export/full-system', ctrl.exportFullSystem);
router.get('/export/series/:seriesId', ctrl.exportSeries);
router.get('/export/users', ctrl.exportUsers);
router.get('/export/rankings', ctrl.exportRankings);

// Import
router.post('/import/full-system', ctrl.importFullSystem);
router.post('/import/series', ctrl.importSeries);
router.post('/import/users', ctrl.importUsers);
router.post('/import/rankings', ctrl.importRankings);

module.exports = router;
