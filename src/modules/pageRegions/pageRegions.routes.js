const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./pageRegions.validation');
const controller = require('./pageRegions.controller');

/**
 * @swagger
 * /api/page-regions:
 *   get:
 *     tags: [Page Regions]
 *     summary: List page regions (also nested under /api/pages/:pageId/regions)
 *     parameters:
 *       - in: query
 *         name: pageId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: List of regions }
 *   post:
 *     tags: [Page Regions]
 *     summary: Create a region on a page (mangaka, editor, admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pageId, regionType, coordinates]
 *             properties:
 *               pageId: { type: string }
 *               regionType: { type: string, enum: [panel, speech_bubble, caption, sfx], example: "panel" }
 *               coordinates: { type: object, example: { x: 10, y: 20, width: 100, height: 80 } }
 *               content: { type: string }
 *     responses:
 *       201: { description: Region created }
 */
router.get('/', authenticateToken, controller.listRegions);

/**
 * @swagger
 * /api/page-regions/{regionId}:
 *   get:
 *     tags: [Page Regions]
 *     summary: Get region by ID
 *     parameters:
 *       - in: path
 *         name: regionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Region data }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Page Regions]
 *     summary: Update region (mangaka, editor, admin)
 *     parameters:
 *       - in: path
 *         name: regionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coordinates: { type: object }
 *               content: { type: string }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Page Regions]
 *     summary: Delete region (mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: regionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.get('/:regionId', authenticateToken, validate(v.regionIdParamSchema), controller.getRegionById);
router.post('/', authenticateToken, requireRole(['admin', 'mangaka', 'editor']), validate(v.createRegionSchema), controller.createRegion);
router.patch('/:regionId', authenticateToken, requireRole(['admin', 'mangaka', 'editor']), validate(v.updateRegionSchema), controller.updateRegion);
router.delete('/:regionId', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.regionIdParamSchema), controller.deleteRegion);

module.exports = router;
