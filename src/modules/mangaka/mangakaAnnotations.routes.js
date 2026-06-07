const express = require('express');
const router = express.Router({ mergeParams: true });
const { validate } = require('../../middlewares/validate.middleware');
const { z } = require('zod');
const ctrl = require('./mangakaAnnotations.controller');
const { requireSeriesMembership } = require('./mangaka.middleware');

const uuid = z.string().uuid();
const pageP = z.object({ seriesId: uuid, chapterId: uuid, pageId: uuid });
const annoP = z.object({ seriesId: uuid, chapterId: uuid, pageId: uuid, annotationId: uuid });
const body = z.object({ content: z.string().min(1), position_x: z.number().optional(), position_y: z.number().optional(), annotation_type: z.string().max(50).optional() });

router.use(requireSeriesMembership);

router.get('/', ctrl.listAnnotations);
router.get('/:annotationId', validate(z.object({ params: annoP })), ctrl.getAnnotationById);
router.post('/', validate(z.object({ params: pageP, body })), ctrl.createAnnotation);
router.patch('/:annotationId', validate(z.object({ params: annoP, body: body.partial() })), ctrl.updateAnnotation);
router.delete('/:annotationId', validate(z.object({ params: annoP })), ctrl.deleteAnnotation);

module.exports = router;
