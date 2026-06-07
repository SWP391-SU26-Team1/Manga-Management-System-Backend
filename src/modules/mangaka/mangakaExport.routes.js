const express = require('express');
const router = express.Router();
const { validate } = require('../../middlewares/validate.middleware');
const { z } = require('zod');
const ctrl = require('./mangakaExport.controller');

const uuid = z.string().uuid();

router.get('/series/:seriesId', validate(z.object({ params: z.object({ seriesId: uuid }) })), ctrl.exportSeries);
router.get('/series/:seriesId/chapters/:chapterId', validate(z.object({ params: z.object({ seriesId: uuid, chapterId: uuid }) })), ctrl.exportChapter);

module.exports = router;
