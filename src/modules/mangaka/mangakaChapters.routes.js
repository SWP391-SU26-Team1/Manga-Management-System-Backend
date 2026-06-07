const express = require('express');
const router = express.Router({ mergeParams: true });
const { validate } = require('../../middlewares/validate.middleware');
const { z } = require('zod');
const ctrl = require('./mangakaChapters.controller');
const { requireSeriesMembership } = require('./mangaka.middleware');

const uuid = z.string().uuid();
const seriesP = z.object({ seriesId: uuid });
const chapterP = z.object({ seriesId: uuid, chapterId: uuid });

const createSchema = z.object({ params: seriesP, body: z.object({ title: z.string().min(1).max(255), description: z.string().optional(), cover_image_url: z.string().url().optional(), chapter_number: z.number().int().positive().optional() }) });
const updateSchema = z.object({ params: chapterP, body: z.object({ title: z.string().min(1).max(255).optional(), description: z.string().optional(), cover_image_url: z.string().url().optional() }) });
const reorderSchema = z.object({ params: chapterP, body: z.object({ chapter_number: z.number().int().positive() }) });
const copySchema = z.object({ params: seriesP, body: z.object({ source_chapter_id: uuid, title: z.string().min(1).max(255).optional() }) });

router.use(requireSeriesMembership);

router.get('/', ctrl.listChapters);
router.get('/:chapterId', validate(z.object({ params: chapterP })), ctrl.getChapterById);
router.get('/:chapterId/detail', validate(z.object({ params: chapterP })), ctrl.getChapterDetail);
router.post('/', validate(createSchema), ctrl.createChapter);
router.post('/copy-from', validate(copySchema), ctrl.copyFromChapter);
router.patch('/:chapterId', validate(updateSchema), ctrl.updateChapter);
router.patch('/:chapterId/reorder', validate(reorderSchema), ctrl.reorderChapter);
router.patch('/:chapterId/submit-review', validate(z.object({ params: chapterP })), ctrl.workflow('submit-review'));
router.patch('/:chapterId/publish', validate(z.object({ params: chapterP })), ctrl.workflow('publish'));
router.patch('/:chapterId/hide', validate(z.object({ params: chapterP })), ctrl.workflow('hide'));
router.patch('/:chapterId/archive', validate(z.object({ params: chapterP })), ctrl.workflow('archive'));
router.patch('/:chapterId/republish', validate(z.object({ params: chapterP })), ctrl.workflow('republish'));
router.delete('/:chapterId', validate(z.object({ params: chapterP })), ctrl.deleteChapter);

module.exports = router;
