const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const ctrl = require('./board.controller');

router.use(authenticateToken);
router.use(requireRole(['board', 'admin']));

// Proposals
router.get('/proposals', ctrl.listProposals);
router.get('/proposals/pending', ctrl.listPendingProposals);
router.get('/proposals/:sessionId', ctrl.getProposalById);
router.get('/proposals/:sessionId/detail', ctrl.getProposalDetail);
router.get('/proposals/:sessionId/manuscripts', ctrl.getProposalManuscripts);
router.get('/proposals/:sessionId/files', ctrl.getProposalFiles);

// Pending items
router.get('/series/pending', ctrl.listPendingSeries);
router.get('/chapters/pending', ctrl.listPendingChapters);
router.get('/manuscripts/pending', ctrl.listPendingManuscripts);

// Document access
router.get('/series/:seriesId/manuscripts', ctrl.getSeriesManuscripts);
router.get('/chapters/:chapterId/manuscripts', ctrl.getChapterManuscripts);
router.get('/manuscripts/:manuscriptId/files', ctrl.getManuscriptFiles);

// Votes
router.get('/review-sessions/:sessionId/votes', ctrl.listVotes);
router.post('/review-sessions/:sessionId/votes', ctrl.createVote);
router.get('/votes/:voteId', ctrl.getVoteById);
router.patch('/votes/:voteId', ctrl.updateVote);
router.patch('/votes/:voteId/status', ctrl.updateVoteStatus);
router.delete('/votes/:voteId', ctrl.deleteVote);

// Process results
router.post('/review-sessions/:sessionId/process-result', ctrl.processResult);
router.patch('/series/:seriesId/apply-decision', ctrl.applyDecisionToSeries);
router.patch('/chapters/:chapterId/apply-decision', ctrl.applyDecisionToChapter);
router.patch('/manuscripts/:manuscriptId/apply-decision', ctrl.applyDecisionToManuscript);

// Series decisions
router.patch('/series/:seriesId/approve', ctrl.seriesDecision('approved'));
router.patch('/series/:seriesId/reject', ctrl.seriesDecision('rejected'));
router.patch('/series/:seriesId/publish', ctrl.seriesDecision('published'));
router.patch('/series/:seriesId/archive', ctrl.seriesDecision('archived'));
router.patch('/series/:seriesId/hide', ctrl.seriesDecision('hidden'));
router.patch('/series/:seriesId/ban', ctrl.seriesDecision('banned'));

// Chapter decisions
router.patch('/chapters/:chapterId/approve', ctrl.chapterDecision('approved'));
router.patch('/chapters/:chapterId/reject', ctrl.chapterDecision('rejected'));
router.patch('/chapters/:chapterId/publish', ctrl.chapterDecision('published'));
router.patch('/chapters/:chapterId/archive', ctrl.chapterDecision('archived'));
router.patch('/chapters/:chapterId/hide', ctrl.chapterDecision('hidden'));
router.patch('/chapters/:chapterId/ban', ctrl.chapterDecision('banned'));

// Decision history
router.get('/series/:seriesId/decision-history', ctrl.seriesDecisionHistory);
router.get('/chapters/:chapterId/decision-history', ctrl.chapterDecisionHistory);
router.get('/review-sessions/:sessionId/history', ctrl.sessionHistory);

// Rankings (read-only)
router.get('/ranking-periods', ctrl.listRankingPeriods);
router.get('/ranking-periods/:periodId', ctrl.getRankingPeriodById);
router.get('/series-rankings', ctrl.listSeriesRankings);
router.get('/chapter-rankings', ctrl.listChapterRankings);
router.get('/rankings/series/top', ctrl.listSeriesRankings);
router.get('/rankings/chapters/top', ctrl.listChapterRankings);
router.get('/rankings/series/:seriesId/history', ctrl.seriesRankingHistory);
router.get('/rankings/chapters/:chapterId/history', ctrl.chapterRankingHistory);

// Notifications
router.get('/notifications', ctrl.listNotifications);
router.get('/notifications/unread', ctrl.getUnreadNotifications);
router.patch('/notifications/read-all', ctrl.markAllRead);
router.patch('/notifications/:notificationId/read', ctrl.markNotificationRead);
router.delete('/notifications/:notificationId', ctrl.deleteNotification);
router.post('/notifications/decision-result', ctrl.sendDecisionNotification);
router.post('/notifications/proposal-approved', ctrl.sendDecisionNotification);
router.post('/notifications/proposal-rejected', ctrl.sendDecisionNotification);

module.exports = router;
