const express = require('express');
const router = express.Router({ mergeParams: true });
const { validate } = require('../../middlewares/validate.middleware');
const { z } = require('zod');
const ctrl = require('./mangakaPageRegions.controller');
const { requireSeriesMembership } = require('./mangaka.middleware');

const uuid = z.string().uuid();
const pageP = z.object({ seriesId: uuid, chapterId: uuid, pageId: uuid });
const regionP = z.object({ seriesId: uuid, chapterId: uuid, pageId: uuid, regionId: uuid });

const regionBodySchema = z.object({
  region_type: z.string().min(1).max(50).optional(),
  coordinates: z.any().optional(),
  label: z.string().max(255).optional(),
});

const createSchema = z.object({ params: pageP, body: regionBodySchema });
const bulkSchema = z.object({ params: pageP, body: z.object({ regions: z.array(regionBodySchema).min(1) }) });
const updateSchema = z.object({ params: regionP, body: regionBodySchema });

router.use(requireSeriesMembership);

router.get('/', ctrl.listRegions);
router.get('/:regionId', validate(z.object({ params: regionP })), ctrl.getRegionById);
router.post('/', validate(createSchema), ctrl.createRegion);
router.post('/bulk', validate(bulkSchema), ctrl.bulkCreateRegions);
router.patch('/:regionId', validate(updateSchema), ctrl.updateRegion);
router.delete('/:regionId', validate(z.object({ params: regionP })), ctrl.deleteRegion);

module.exports = router;
