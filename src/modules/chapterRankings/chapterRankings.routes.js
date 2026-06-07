const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./chapterRankings.validation');
const controller = require('./chapterRankings.controller');

router.get('/', controller.listRankings);
router.get('/:chapterRankingId', validate(v.chapterRankingIdParamSchema), controller.getRankingById);
router.post('/', authenticateToken, requireRole(['admin']), validate(v.createChapterRankingSchema), controller.createRanking);
router.patch('/:chapterRankingId', authenticateToken, requireRole(['admin']), validate(v.updateChapterRankingSchema), controller.updateRanking);
router.delete('/:chapterRankingId', authenticateToken, requireRole(['admin']), validate(v.chapterRankingIdParamSchema), controller.deleteRanking);

module.exports = router;
