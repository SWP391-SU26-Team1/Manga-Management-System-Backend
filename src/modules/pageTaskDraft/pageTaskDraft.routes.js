const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./pageTaskDraft.validation');
const controller = require('./pageTaskDraft.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     PageTaskDraft:
 *       type: object
 *       properties:
 *         draftId:
 *           type: string
 *           format: uuid
 *           example: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
 *         taskId:
 *           type: string
 *           format: uuid
 *         imageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         canvasState:
 *           type: object
 *           nullable: true
 * 
 * /api/page-tasks/{taskId}/draft:
 *   get:
 *     tags: [Page Task Drafts]
 *     summary: Lấy bản nháp Canvas của Page Task
 *     description: Lấy dữ liệu Canvas đang làm việc tạm thời của Assistant được giao Task.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Trả về bản nháp (hoặc null nếu chưa có)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PageTaskDraft'
 *                   nullable: true
 *       403:
 *         description: Trợ lý không được giao task này
 *       404:
 *         description: Task không tồn tại
 * 
 *   put:
 *     tags: [Page Task Drafts]
 *     summary: Lưu tự động bản nháp Canvas
 *     description: Thêm mới hoặc cập nhật bản nháp làm việc của Canvas.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               canvasState:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Lưu nháp thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PageTaskDraft'
 *       403:
 *         description: Trợ lý không được giao task này
 * 
 *   delete:
 *     tags: [Page Task Drafts]
 *     summary: Xóa bản nháp Canvas
 *     description: Xóa bản nháp vẽ Canvas của Assistant cho Page Task này.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Xóa nháp thành công
 */

router.get(
  '/',
  authenticateToken,
  requireRole(['assistant']),
  validate(v.getDraftSchema),
  controller.getDraft
);

router.put(
  '/',
  authenticateToken,
  requireRole(['assistant']),
  validate(v.saveDraftSchema),
  controller.saveDraft
);

router.delete(
  '/',
  authenticateToken,
  requireRole(['assistant']),
  validate(v.deleteDraftSchema),
  controller.deleteDraft
);

module.exports = router;
