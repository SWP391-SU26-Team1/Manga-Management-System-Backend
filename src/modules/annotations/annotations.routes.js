const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./annotations.validation');
const controller = require('./annotations.controller');

/**
 * @swagger
 * /api/annotations:
 *   get:
 *     tags: [Annotations]
 *     summary: List annotations (also nested under /api/pages/:pageId/annotations and /api/page-tasks/:taskId/annotations)
 *     parameters:
 *       - in: query
 *         name: pageId
 *         schema: { type: string }
 *       - in: query
 *         name: taskId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: List of annotations }
 *   post:
 *     tags: [Annotations]
 *     summary: Create an annotation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               pageId: { type: string }
 *               taskId: { type: string }
 *               regionId: { type: string }
 *               content: { type: string, example: "The shading here needs more depth" }
 *               coordinates: { type: object, example: { x: 50, y: 60 } }
 *     responses:
 *       201: { description: Annotation created }
 *
 * /api/annotations/{annotationId}:
 *   get:
 *     tags: [Annotations]
 *     summary: Get annotation by ID
 *     parameters:
 *       - in: path
 *         name: annotationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Annotation data }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Annotations]
 *     summary: Update annotation
 *     parameters:
 *       - in: path
 *         name: annotationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string }
 *               coordinates: { type: object }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Annotations]
 *     summary: Delete annotation
 *     parameters:
 *       - in: path
 *         name: annotationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *
 * /api/annotations/{annotationId}/status:
 *   patch:
 *     tags: [Annotations]
 *     summary: Update annotation status
 *     parameters:
 *       - in: path
 *         name: annotationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [open, resolved, dismissed] }
 *     responses:
 *       200: { description: Status updated }
 */
router.get('/', authenticateToken, controller.listAnnotations);
router.get('/:annotationId', authenticateToken, validate(v.annotationIdParamSchema), controller.getAnnotationById);
router.post('/', authenticateToken, validate(v.createAnnotationSchema), controller.createAnnotation);
router.patch('/:annotationId', authenticateToken, validate(v.updateAnnotationSchema), controller.updateAnnotation);
router.patch('/:annotationId/status', authenticateToken, validate(v.updateAnnotationStatusSchema), controller.updateAnnotationStatus);
router.delete('/:annotationId', authenticateToken, validate(v.annotationIdParamSchema), controller.deleteAnnotation);

module.exports = router;
