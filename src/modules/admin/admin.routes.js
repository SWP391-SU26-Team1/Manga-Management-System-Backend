const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const ctrl = require('./admin.controller');
const vUsers = require('../users/users.validation');
const vSeries = require('../series/series.validation');
const vChapters = require('../chapters/chapters.validation');
const vPages = require('../pages/pages.validation');
const vPageTasks = require('../pageTasks/pageTasks.validation');
const vFeedbacks = require('../pageTaskFeedbacks/pageTaskFeedbacks.validation');
const vAnnotations = require('../annotations/annotations.validation');
const vReviewSessions = require('../reviewSessions/reviewSessions.validation');
const vVotes = require('../votes/votes.validation');
const vRankingPeriods = require('../rankingPeriods/rankingPeriods.validation');
const vSeriesRankings = require('../seriesRankings/seriesRankings.validation');
const vChapterRankings = require('../chapterRankings/chapterRankings.validation');
const vNotifications = require('../notifications/notifications.validation');
const vManuscripts = require('../manuscripts/manuscripts.validation');
const vManuscriptFiles = require('../manuscriptFiles/manuscriptFiles.validation');

router.use(authenticateToken);
router.use(requireRole(['admin']));

// Users
router.get('/users', validate(vUsers.listUsersSchema), ctrl.listUsers);
router.get('/users/:userId', validate(vUsers.userIdParamSchema), ctrl.getUserById);
router.post('/users', validate(vUsers.createUserSchema), ctrl.createUser);
router.patch('/users/:userId', validate(vUsers.updateUserSchema), ctrl.updateUser);
router.patch('/users/:userId/status', validate(vUsers.updateUserStatusSchema), ctrl.updateUserStatus);
router.patch('/users/:userId/role', validate(vUsers.updateUserRoleSchema), ctrl.updateUserRole);
router.delete('/users/:userId', validate(vUsers.userIdParamSchema), ctrl.deleteUser);

// Series
router.get('/series', validate(vSeries.listSeriesSchema), ctrl.listAdminSeries);
router.get('/series/:seriesId', validate(vSeries.seriesIdParamSchema), ctrl.getAdminSeriesById);
router.patch('/series/:seriesId/status', validate(vSeries.updateSeriesStatusSchema), ctrl.updateAdminSeriesStatus);
router.delete('/series/:seriesId', validate(vSeries.seriesIdParamSchema), ctrl.deleteAdminSeries);

// Chapters
router.get('/chapters', validate(vChapters.listChaptersSchema), ctrl.listAdminChapters);
router.get('/chapters/:chapterId', validate(vChapters.chapterIdParamSchema), ctrl.getAdminChapterById);
router.patch('/chapters/:chapterId/status', validate(vChapters.updateChapterStatusSchema), ctrl.updateAdminChapterStatus);
router.delete('/chapters/:chapterId', validate(vChapters.chapterIdParamSchema), ctrl.deleteAdminChapter);

// Pages
router.get('/pages', validate(vPages.listPagesSchema), ctrl.listAdminPages);
router.get('/pages/:pageId', validate(vPages.pageIdParamSchema), ctrl.getAdminPageById);
router.patch('/pages/:pageId/status', validate(vPages.updatePageStatusSchema), ctrl.updateAdminPageStatus);
router.delete('/pages/:pageId', validate(vPages.pageIdParamSchema), ctrl.deleteAdminPage);

// Tasks
router.get('/page-tasks', validate(vPageTasks.listTasksSchema), ctrl.listAdminTasks);
router.get('/page-tasks/:taskId', validate(vPageTasks.taskIdParamSchema), ctrl.getAdminTaskById);
router.patch('/page-tasks/:taskId', validate(vPageTasks.updateTaskSchema), ctrl.updateAdminTask);
router.patch('/page-tasks/:taskId/status', validate(vPageTasks.updateTaskStatusSchema), ctrl.updateAdminTaskStatus);
router.delete('/page-tasks/:taskId', validate(vPageTasks.taskIdParamSchema), ctrl.deleteAdminTask);

// Feedbacks
router.get('/page-task-feedbacks', validate(vFeedbacks.listFeedbacksSchema), ctrl.listAdminFeedbacks);
router.get('/page-task-feedbacks/:feedbackId', validate(vFeedbacks.feedbackIdParamSchema), ctrl.getAdminFeedbackById);
router.patch('/page-task-feedbacks/:feedbackId/status', validate(vFeedbacks.updateFeedbackStatusSchema), ctrl.updateAdminFeedbackStatus);
router.delete('/page-task-feedbacks/:feedbackId', validate(vFeedbacks.feedbackIdParamSchema), ctrl.deleteAdminFeedback);

// Annotations
router.get('/annotations', ctrl.listAdminAnnotations);
router.get('/annotations/:annotationId', validate(vAnnotations.annotationIdParamSchema), ctrl.getAdminAnnotationById);
router.patch('/annotations/:annotationId/status', validate(vAnnotations.updateAnnotationStatusSchema), ctrl.updateAdminAnnotationStatus);
router.delete('/annotations/:annotationId', validate(vAnnotations.annotationIdParamSchema), ctrl.deleteAdminAnnotation);

// Review Sessions
router.get('/review-sessions', ctrl.listAdminSessions);
router.get('/review-sessions/:sessionId', validate(vReviewSessions.sessionIdParamSchema), ctrl.getAdminSessionById);
router.patch('/review-sessions/:sessionId', validate(vReviewSessions.updateSessionSchema), ctrl.updateAdminSession);
router.patch('/review-sessions/:sessionId/status', validate(vReviewSessions.updateSessionStatusSchema), ctrl.updateAdminSessionStatus);
router.delete('/review-sessions/:sessionId', validate(vReviewSessions.sessionIdParamSchema), ctrl.deleteAdminSession);

// Votes
router.get('/votes', ctrl.listAdminVotes);
router.get('/votes/:voteId', validate(vVotes.voteIdParamSchema), ctrl.getAdminVoteById);
router.patch('/votes/:voteId', validate(vVotes.updateVoteSchema), ctrl.updateAdminVote);
router.patch('/votes/:voteId/status', validate(vVotes.updateVoteStatusSchema), ctrl.updateAdminVoteStatus);
router.delete('/votes/:voteId', validate(vVotes.voteIdParamSchema), ctrl.deleteAdminVote);

// Ranking Periods
router.get('/ranking-periods', ctrl.listAdminPeriods);
router.get('/ranking-periods/:periodId', validate(vRankingPeriods.periodIdParamSchema), ctrl.getAdminPeriodById);
router.post('/ranking-periods', validate(vRankingPeriods.createPeriodSchema), ctrl.createAdminPeriod);
router.patch('/ranking-periods/:periodId', validate(vRankingPeriods.updatePeriodSchema), ctrl.updateAdminPeriod);
router.patch('/ranking-periods/:periodId/status', validate(vRankingPeriods.updatePeriodStatusSchema), ctrl.updateAdminPeriodStatus);
router.delete('/ranking-periods/:periodId', validate(vRankingPeriods.periodIdParamSchema), ctrl.deleteAdminPeriod);

// Series Rankings
router.get('/series-rankings', ctrl.listAdminSeriesRankings);
router.post('/series-rankings', validate(vSeriesRankings.createSeriesRankingSchema), ctrl.createAdminSeriesRanking);
router.patch('/series-rankings/:seriesRankingId', validate(vSeriesRankings.updateSeriesRankingSchema), ctrl.updateAdminSeriesRanking);
router.delete('/series-rankings/:seriesRankingId', validate(vSeriesRankings.seriesRankingIdParamSchema), ctrl.deleteAdminSeriesRanking);

// Chapter Rankings
router.get('/chapter-rankings', ctrl.listAdminChapterRankings);
router.post('/chapter-rankings', validate(vChapterRankings.createChapterRankingSchema), ctrl.createAdminChapterRanking);
router.patch('/chapter-rankings/:chapterRankingId', validate(vChapterRankings.updateChapterRankingSchema), ctrl.updateAdminChapterRanking);
router.delete('/chapter-rankings/:chapterRankingId', validate(vChapterRankings.chapterRankingIdParamSchema), ctrl.deleteAdminChapterRanking);

// Notifications
router.get('/notifications', ctrl.listAdminNotifications);
router.get('/notifications/:notificationId', validate(vNotifications.notificationIdParamSchema), ctrl.getAdminNotificationById);
router.post('/notifications', validate(vNotifications.createNotificationSchema), ctrl.createAdminNotification);
router.patch('/notifications/:notificationId', validate(vNotifications.updateNotificationSchema), ctrl.updateAdminNotification);
router.delete('/notifications/:notificationId', validate(vNotifications.notificationIdParamSchema), ctrl.deleteAdminNotification);

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
