const express = require('express');
const router = express.Router({ mergeParams: true });
const { validate } = require('../../middlewares/validate.middleware');
const { z } = require('zod');
const ctrl = require('./mangakaPages.controller');
const { requireSeriesMembership } = require('./mangaka.middleware');

const uuid = z.string().uuid();
const chapterP = z.object({ seriesId: uuid, chapterId: uuid });
const pageP = z.object({ seriesId: uuid, chapterId: uuid, pageId: uuid });

const createSchema = z.object({ params: chapterP, body: z.object({ image_url: z.string().url().optional(), page_number: z.number().int().positive().optional() }) });
const bulkSchema = z.object({ params: chapterP, body: z.object({ pages: z.array(z.object({ image_url: z.string().url().optional(), page_number: z.number().int().positive().optional() })).min(1) }) });
const updateSchema = z.object({ params: pageP, body: z.object({ image_url: z.string().url().optional() }) });
const reorderSchema = z.object({ params: pageP, body: z.object({ page_number: z.number().int().positive() }) });

router.use(requireSeriesMembership);

router.get('/', ctrl.listPages);
router.get('/:pageId', validate(z.object({ params: pageP })), ctrl.getPageById);
router.get('/:pageId/detail', validate(z.object({ params: pageP })), ctrl.getPageDetail);
router.post('/', validate(createSchema), ctrl.createPage);
router.post('/bulk', validate(bulkSchema), ctrl.bulkCreatePages);
router.patch('/:pageId', validate(updateSchema), ctrl.updatePage);
router.patch('/:pageId/reorder', validate(reorderSchema), ctrl.reorderPage);
router.patch('/:pageId/approve', validate(z.object({ params: pageP })), ctrl.workflow('approve'));
router.patch('/:pageId/reject', validate(z.object({ params: pageP })), ctrl.workflow('reject'));
router.patch('/:pageId/publish', validate(z.object({ params: pageP })), ctrl.workflow('publish'));
router.patch('/:pageId/hide', validate(z.object({ params: pageP })), ctrl.workflow('hide'));
router.delete('/:pageId', validate(z.object({ params: pageP })), ctrl.deletePage);

module.exports = router;
