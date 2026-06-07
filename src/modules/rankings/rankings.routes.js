const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const ctrl = require('./rankings.controller');

// Public endpoints (no auth required)
router.get('/public/series/top', ctrl.getTopSeries);
router.get('/public/chapters/top', ctrl.getTopChapters);

// Authenticated routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'editor', 'board', 'mangaka']));

// Periods
router.get('/periods', ctrl.listPeriods);
router.get('/periods/:periodId', ctrl.getPeriodById);
router.post('/periods', requireRole(['admin', 'editor']), ctrl.createPeriod);
router.patch('/periods/:periodId', requireRole(['admin', 'editor']), ctrl.updatePeriod);
router.patch('/periods/:periodId/status', requireRole(['admin', 'editor']), ctrl.updatePeriodStatus);
router.delete('/periods/:periodId', requireRole(['admin']), ctrl.deletePeriod);


// Calculation
router.post('/periods/:periodId/calculate', requireRole(['admin', 'editor']), ctrl.calculateRankings);
router.post('/periods/:periodId/recalculate', requireRole(['admin', 'editor']), ctrl.recalculate);
router.get('/periods/:periodId/summary', ctrl.getPeriodSummary);
router.get('/periods/:periodId/export', ctrl.exportPeriod);

// Dynamic board
router.get('/series/top', ctrl.getTopSeries);
router.get('/chapters/top', ctrl.getTopChapters);

// History & analytics
router.get('/series/:seriesId/history', ctrl.getSeriesHistory);
router.get('/chapters/:chapterId/history', ctrl.getChapterHistory);
router.get('/analytics/series/:seriesId', ctrl.getSeriesHistory);
router.get('/analytics/chapters/:chapterId', ctrl.getChapterHistory);

// Trend & risk
router.get('/series/:seriesId/trend', ctrl.getSeriesTrend);
router.get('/series/:seriesId/risk-analysis', ctrl.checkSeriesRisk);
router.post('/series/:seriesId/check-risk', ctrl.checkSeriesRisk);
router.post('/check-risk-all', requireRole(['admin', 'editor']), ctrl.checkRiskAll);
router.post('/series/:seriesId/send-risk-warning', requireRole(['admin', 'editor']), ctrl.sendRiskWarning);

module.exports = router;
