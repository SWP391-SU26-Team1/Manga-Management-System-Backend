const express = require('express');
const router = express.Router();
const { validate } = require('../../middlewares/validate.middleware');
const { z } = require('zod');
const ctrl = require('./mangakaImport.controller');

const uuid = z.string().uuid();
const seriesP = z.object({ seriesId: uuid });

const regionSchema = z.object({ region_type: z.string().optional(), coordinates: z.any().optional(), label: z.string().optional() });
const pageSchema = z.object({ page_number: z.number().int().positive().optional(), image_url: z.string().url().optional(), regions: z.array(regionSchema).optional() });
const chapterImportSchema = z.object({ params: seriesP, body: z.object({ title: z.string().min(1).max(255), description: z.string().optional(), cover_image_url: z.string().url().optional(), pages: z.array(pageSchema).optional() }) });
const bulkImportSchema = z.object({ params: seriesP, body: z.object({ chapters: z.array(z.object({ title: z.string().min(1), pages: z.array(pageSchema).optional() })) }) });

router.post('/series/:seriesId/chapters', validate(chapterImportSchema), ctrl.importChapter);
router.post('/series/:seriesId/bulk', validate(bulkImportSchema), ctrl.importFromExport);

module.exports = router;
