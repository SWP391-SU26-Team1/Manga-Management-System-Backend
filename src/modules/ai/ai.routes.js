const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./ai.validation');
const controller = require('./ai.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     AISuggestion:
 *       type: object
 *       properties:
 *         suggestion_id:
 *           type: string
 *           format: uuid
 *           example: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
 *         page_id:
 *           type: string
 *           format: uuid
 *         region_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         task_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         requested_by_id:
 *           type: string
 *           format: uuid
 *         attempt_number:
 *           type: integer
 *           example: 1
 *         ai_model:
 *           type: string
 *           example: "llama-3.2-11b-vision-preview"
 *         prompt:
 *           type: string
 *         reference_image_url:
 *           type: string
 *           format: uri
 *         result_data:
 *           type: object
 *           nullable: true
 *           description: "JSON result — panels array for detection, image URL for coloring, error for failed"
 *         status:
 *           type: string
 *           enum: [processing, completed, failed, applied, rejected]
 *           example: "processing"
 *         processing_time_ms:
 *           type: integer
 *           nullable: true
 *           example: 1500
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/pages/{pageId}/ai/panel-detection:
 *   post:
 *     tags: [AI Assistant]
 *     summary: Nhận diện khung tranh (Panel Detection) bằng Groq Vision AI
 *     description: |
 *       Khởi tạo background job để AI phân tích ảnh manga page và nhận diện tọa độ các khung tranh (panels).
 *
 *       **Luồng hoạt động:**
 *       1. Server tạo record `page_ai_suggestion` với status `processing`
 *       2. Trả về HTTP 202 ngay lập tức (không chờ AI xử lý xong)
 *       3. AI chạy ngầm trong background, khi xong sẽ cập nhật status → `completed` hoặc `failed`
 *       4. Frontend polling bằng `GET /api/ai/suggestions/{suggestionId}` để kiểm tra kết quả
 *
 *       **Quyền truy cập:** mangaka, editor, admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của manga page cần nhận diện panel
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Custom prompt gửi cho AI (để trống sẽ dùng prompt mặc định)
 *                 example: "Detect all reading panels in this manga page"
 *               ai_model:
 *                 type: string
 *                 description: Tên model AI (mặc định llama-3.2-11b-vision-preview)
 *                 example: "llama-3.2-11b-vision-preview"
 *     responses:
 *       202:
 *         description: AI panel detection job đã được khởi tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "AI panel detection job initiated"
 *                 data:
 *                   $ref: '#/components/schemas/AISuggestion'
 *             example:
 *               success: true
 *               message: "AI panel detection job initiated"
 *               data:
 *                 suggestion_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
 *                 page_id: "11111111-1111-4111-a111-111111111111"
 *                 status: "processing"
 *                 attempt_number: 1
 *                 ai_model: "llama-3.2-11b-vision-preview"
 *       400:
 *         description: Page không có ảnh phiên bản nào hoặc UUID không hợp lệ
 *       403:
 *         description: Role không có quyền (assistant, reader không được phép)
 *       404:
 *         description: Page không tồn tại
 */
router.post(
  '/panel-detection',
  authenticateToken,
  requireRole(['admin', 'mangaka', 'editor']),
  validate(v.panelDetectionSchema),
  controller.panelDetection
);

/**
 * @swagger
 * /api/page-tasks/{taskId}/ai/coloring:
 *   post:
 *     tags: [AI Assistant]
 *     summary: Gợi ý đổ màu thông minh (Smart Coloring) bằng HuggingFace AI
 *     description: |
 *       Khởi tạo background job để AI tạo ảnh đổ màu dựa trên ảnh manga gốc và prompt mô tả phong cách.
 *
 *       **Luồng hoạt động:**
 *       1. Server tạo record `page_ai_suggestion` với status `processing`
 *       2. Trả về HTTP 202 ngay lập tức
 *       3. AI tạo ảnh màu trong background → upload lên Cloudinary → cập nhật `result_data.colored_image_url`
 *       4. Frontend polling bằng `GET /api/ai/suggestions/{suggestionId}`
 *
 *       **Quyền truy cập:** assistant (chỉ task được giao), mangaka, editor, admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của page task cần đổ màu
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Mô tả phong cách màu sắc mong muốn
 *                 example: "vibrant anime colors, soft sunset lighting, studio ghibli style"
 *               ai_model:
 *                 type: string
 *                 description: Tên model AI (mặc định black-forest-labs/FLUX.1-schnell)
 *                 example: "black-forest-labs/FLUX.1-schnell"
 *               reference_image_url:
 *                 type: string
 *                 format: uri
 *                 description: URL ảnh tham khảo (nếu không truyền sẽ dùng ảnh phiên bản mới nhất của page)
 *                 example: "https://res.cloudinary.com/demo/image/upload/v1/page.png"
 *     responses:
 *       202:
 *         description: AI smart coloring job đã được khởi tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "AI smart coloring job initiated"
 *                 data:
 *                   $ref: '#/components/schemas/AISuggestion'
 *       400:
 *         description: Không tìm thấy ảnh nguồn hoặc UUID không hợp lệ
 *       403:
 *         description: Assistant cố gắng truy cập task không phải của mình
 *       404:
 *         description: Task không tồn tại
 */
router.post(
  '/coloring',
  authenticateToken,
  requireRole(['admin', 'mangaka', 'editor', 'assistant']),
  validate(v.smartColoringSchema),
  controller.smartColoring
);

/**
 * @swagger
 * /api/ai/suggestions/{suggestionId}:
 *   get:
 *     tags: [AI Assistant]
 *     summary: Polling — Kiểm tra trạng thái và kết quả của AI suggestion
 *     description: |
 *       Frontend gọi endpoint này định kỳ (mỗi 2-3 giây) để kiểm tra xem AI job đã chạy xong chưa.
 *
 *       **Các trạng thái có thể:**
 *       - `processing` — AI đang xử lý
 *       - `completed` — Đã xong, `result_data` chứa kết quả
 *       - `failed` — Lỗi, `result_data.error` chứa thông tin lỗi
 *       - `applied` — Người dùng đã áp dụng kết quả
 *       - `rejected` — Người dùng đã từ chối kết quả
 *
 *       **Kết quả Panel Detection (`result_data`):**
 *       ```json
 *       { "panels": [{ "x": 50, "y": 50, "width": 400, "height": 300 }] }
 *       ```
 *
 *       **Kết quả Smart Coloring (`result_data`):**
 *       ```json
 *       { "type": "smart_coloring", "image_url": "https://...", "public_id": "manga-ai-suggestions/..." }
 *       ```
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: suggestionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của AI suggestion cần kiểm tra
 *     responses:
 *       200:
 *         description: Thông tin chi tiết AI suggestion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *                 data:
 *                   $ref: '#/components/schemas/AISuggestion'
 *       400:
 *         description: UUID không hợp lệ
 *       404:
 *         description: Suggestion không tồn tại
 */
router.get(
  '/suggestions/:suggestionId',
  authenticateToken,
  validate(v.suggestionIdParamSchema),
  controller.getSuggestion
);

/**
 * @swagger
 * /api/ai/suggestions/{suggestionId}/reject:
 *   patch:
 *     tags: [AI Assistant]
 *     summary: Từ chối kết quả AI suggestion
 *     description: |
 *       Người dùng xem kết quả AI và quyết định từ chối (không áp dụng).
 *       Chỉ người tạo suggestion hoặc admin mới có quyền reject.
 *       Không thể reject suggestion đã ở trạng thái `applied`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: suggestionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của AI suggestion cần từ chối
 *     responses:
 *       200:
 *         description: AI suggestion đã bị từ chối
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "AI suggestion rejected"
 *                 data:
 *                   $ref: '#/components/schemas/AISuggestion'
 *       400:
 *         description: Không thể reject suggestion đã applied hoặc UUID không hợp lệ
 *       403:
 *         description: Không phải người tạo suggestion và không phải admin
 *       404:
 *         description: Suggestion không tồn tại
 */
router.patch(
  '/suggestions/:suggestionId/reject',
  authenticateToken,
  validate(v.suggestionIdParamSchema),
  controller.rejectSuggestion
);

module.exports = router;
