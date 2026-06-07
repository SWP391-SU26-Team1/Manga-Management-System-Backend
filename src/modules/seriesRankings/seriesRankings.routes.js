const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./seriesRankings.validation');
const controller = require('./seriesRankings.controller');

router.get('/', controller.listRankings);
router.get('/:seriesRankingId', validate(v.seriesRankingIdParamSchema), controller.getRankingById);
router.post('/', authenticateToken, requireRole(['admin']), validate(v.createSeriesRankingSchema), controller.createRanking);
router.patch('/:seriesRankingId', authenticateToken, requireRole(['admin']), validate(v.updateSeriesRankingSchema), controller.updateRanking);
router.delete('/:seriesRankingId', authenticateToken, requireRole(['admin']), validate(v.seriesRankingIdParamSchema), controller.deleteRanking);

module.exports = router;
