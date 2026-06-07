const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const controller = require('./dashboard.controller');

router.get('/overview', authenticateToken, requireRole(['admin', 'editor']), controller.getOverview);
router.get('/task-summary', authenticateToken, requireRole(['admin', 'editor']), controller.getTaskSummary);
router.get('/review-summary', authenticateToken, requireRole(['admin', 'editor']), controller.getReviewSummary);
router.get('/ranking-summary', authenticateToken, requireRole(['admin', 'editor']), controller.getRankingSummary);
router.get('/user-summary', authenticateToken, requireRole(['admin']), controller.getUserSummary);

module.exports = router;
