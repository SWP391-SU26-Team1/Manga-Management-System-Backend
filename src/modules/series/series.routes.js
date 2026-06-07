const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./series.validation');
const controller = require('./series.controller');

router.get('/', validate(v.listSeriesSchema), controller.listSeries);
router.get('/:seriesId', validate(v.seriesIdParamSchema), controller.getSeriesById);
router.get('/:seriesId/detail', validate(v.seriesIdParamSchema), controller.getSeriesDetail);
router.post('/', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.createSeriesSchema), controller.createSeries);
router.patch('/:seriesId', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.updateSeriesSchema), controller.updateSeries);
router.patch('/:seriesId/status', authenticateToken, requireRole(['admin', 'editor']), validate(v.updateSeriesStatusSchema), controller.updateSeriesStatus);
router.delete('/:seriesId', authenticateToken, requireRole(['admin']), validate(v.seriesIdParamSchema), controller.deleteSeries);

module.exports = router;
