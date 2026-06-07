const express = require('express');
const router = express.Router({ mergeParams: true });
const { validate } = require('../../middlewares/validate.middleware');
const { z } = require('zod');
const ctrl = require('./mangakaDashboard.controller');

const uuid = z.string().uuid();
const seriesP = z.object({ params: z.object({ seriesId: uuid }) });

router.use(ctrl.assertMemberMiddleware);

router.get('/:seriesId/progress', validate(seriesP), ctrl.getProgress);
router.get('/:seriesId/workload', validate(seriesP), ctrl.getWorkload);
router.get('/:seriesId/performance', validate(seriesP), ctrl.getPerformance);

module.exports = router;
