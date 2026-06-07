const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./rankingPeriods.validation');
const controller = require('./rankingPeriods.controller');
const seriesRankingsRouter = require('../seriesRankings/seriesRankings.routes');
const chapterRankingsRouter = require('../chapterRankings/chapterRankings.routes');

/**
 * @swagger
 * /api/ranking-periods:
 *   get:
 *     tags: [Ranking Periods]
 *     summary: List ranking periods (public)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: List of ranking periods }
 *   post:
 *     tags: [Ranking Periods]
 *     summary: Create a ranking period (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, startDate, endDate]
 *             properties:
 *               name: { type: string, example: "Q2 2025" }
 *               startDate: { type: string, format: date, example: "2025-04-01" }
 *               endDate: { type: string, format: date, example: "2025-06-30" }
 *     responses:
 *       201: { description: Period created }
 *
 * /api/ranking-periods/{periodId}:
 *   get:
 *     tags: [Ranking Periods]
 *     summary: Get ranking period by ID (public)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Period data }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Ranking Periods]
 *     summary: Update ranking period (admin)
 *     parameters:
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Ranking Periods]
 *     summary: Delete ranking period (admin)
 *     parameters:
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *
 * /api/ranking-periods/{periodId}/status:
 *   patch:
 *     tags: [Ranking Periods]
 *     summary: Update period status (admin)
 *     parameters:
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [upcoming, active, closed, archived] }
 *     responses:
 *       200: { description: Status updated }
 *
 * /api/ranking-periods/{periodId}/calculate:
 *   post:
 *     tags: [Ranking Periods]
 *     summary: Trigger ranking calculation for a period (admin)
 *     parameters:
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Rankings calculated }
 *
 * /api/ranking-periods/{periodId}/series-rankings:
 *   get:
 *     tags: [Rankings]
 *     summary: Get series rankings for a period
 *     parameters:
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Series rankings }
 *
 * /api/ranking-periods/{periodId}/chapter-rankings:
 *   get:
 *     tags: [Rankings]
 *     summary: Get chapter rankings for a period
 *     parameters:
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chapter rankings }
 */
router.get('/', controller.listPeriods);
router.get('/:periodId', validate(v.periodIdParamSchema), controller.getPeriodById);
router.post('/', authenticateToken, requireRole(['admin']), validate(v.createPeriodSchema), controller.createPeriod);
router.patch('/:periodId', authenticateToken, requireRole(['admin']), validate(v.updatePeriodSchema), controller.updatePeriod);
router.patch('/:periodId/status', authenticateToken, requireRole(['admin']), validate(v.updatePeriodStatusSchema), controller.updatePeriodStatus);
router.post('/:periodId/calculate', authenticateToken, requireRole(['admin']), validate(v.periodIdParamSchema), controller.calculateRanking);
router.delete('/:periodId', authenticateToken, requireRole(['admin']), validate(v.periodIdParamSchema), controller.deletePeriod);

router.use('/:periodId/series-rankings', seriesRankingsRouter);
router.use('/:periodId/chapter-rankings', chapterRankingsRouter);

module.exports = router;
