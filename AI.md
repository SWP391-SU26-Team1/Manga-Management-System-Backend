# AI Implementation Guide
## Manga Creation Workflow & Publishing Management System

---

# 1. Mục tiêu

Hệ thống AI chỉ đóng vai trò **Assistant**.
AI KHÔNG được phép ghi trực tiếp vào dữ liệu chính của hệ thống.
Mọi kết quả AI đều phải được người dùng xem trước, chỉnh sửa nếu cần và xác nhận trước khi lưu.
Toàn bộ kết quả AI sẽ được lưu trong bảng:

```text
page_ai_suggestion
Sau khi người dùng xác nhận, dữ liệu mới được ghi vào các bảng chính như:

page_region

page_version

page_submission

2. Kiến trúc tổng thể
Frontend
      │
      ▼
AI Routes
      │
      ▼
AI Controller
      │
      ▼
AI Service
      │
      ├────────► Groq
      │
      ├────────► HuggingFace
      │
      └────────► Cloudinary
      │
      ▼
AI Repository
      │
      ▼
page_ai_suggestion
3. Thư mục cần tạo
src
│
├── modules
│   └── ai
│       ├── ai.routes.js
│       ├── ai.controller.js
│       ├── ai.service.js
│       ├── ai.repository.js
│       ├── ai.validation.js
│       └── ai.constant.js
│
├── providers
│       ├── groq.provider.js
│       ├── huggingface.provider.js
│       └── cloudinary.provider.js
│
└── utils
        └── aiPrompt.js
4. Trách nhiệm từng file
ai.routes.js
Chỉ khai báo API. Không xử lý logic.
Ví dụ:

POST /pages/:pageId/ai/panel-detection

POST /page-tasks/:taskId/ai/coloring

GET /suggestions/:suggestionId

PATCH /suggestions/:suggestionId/reject

ai.controller.js
Controller chỉ làm 3 việc:

Nhận request

Gọi service

Trả response
Controller KHÔNG chứa business logic.
Ví dụ: Client ➔ Controller ➔ Service ➔ Response

ai.service.js
Đây là trung tâm của module. Toàn bộ business logic sẽ nằm ở đây.
Bao gồm:

Tạo suggestion

Gọi AI (thông qua provider)

Upload Cloudinary (thông qua provider)

Cập nhật database

Xử lý background job (async)

ai.repository.js
Chỉ truy vấn database. Không chứa business logic.
Các hàm: create(), getById(), updateCompleted(), updateFailed(), markApplied(), reject().

Các file Provider (*.provider.js)
Chỉ chứa code giao tiếp với bên thứ 3 (Groq SDK, HuggingFace, Cloudinary).
[QUAN TRỌNG] Chuẩn hóa lỗi: Các Provider không được xử lý logic DB, nhưng bắt buộc phải ném ra CustomError (hoặc cấu trúc lỗi chuẩn của dự án) nếu API bên thứ 3 bị sập, timeout, hoặc trả về mã lỗi 4xx/5xx. Điều này giúp ai.service.js dễ dàng bắt lỗi (catch) và cập nhật trạng thái suggestion thành failed.

5. AI Workflow
Workflow 1: Panel Detection
Frontend
↓ POST /panel-detection
Controller
↓
Service ➔ Repository ➔ page_ai_suggestion (status=processing)
↓ return 202 Accepted
Background Job
↓
Groq Vision
↓
Repository ➔ status=completed
↓
Frontend Polling ➔ Preview ➔ User chỉnh sửa
↓
POST /regions/bulk
↓
page_region ➔ mark suggestion applied
Workflow 2: Smart Coloring
Assistant
↓ POST /coloring
Service ➔ page_ai_suggestion (processing)
↓ return 202 Accepted
Background Job
↓
HuggingFace ➔ Temporary URL
↓
Cloudinary ➔ Permanent URL
↓
Repository ➔ completed
↓
Assistant Preview ➔ Use as Submission
↓
page_version ➔ page_submission ➔ page_task=submitted ➔ suggestion=applied
6. Trạng thái page_ai_suggestion
processing: Đang chạy AI.

completed: AI xử lý thành công, chờ người dùng duyệt.

failed: AI lỗi (Model sập, API timeout).

cancelled: User chủ động hủy luồng khi đang chạy.

applied: Người dùng đã sử dụng kết quả để lưu chính thức.

rejected: Người dùng bỏ kết quả AI.

7. Luồng xử lý bất đồng bộ
Không bao giờ dùng await AI trực tiếp trong request (tránh timeout).
Luôn áp dụng:
Tạo suggestion ➔ return HTTP 202 ➔ Background chạy ngầm ➔ update database ➔ Frontend polling.

8. Polling & Bảo vệ API (Rate Limiting)
Frontend sẽ gọi: GET /api/ai/suggestions/:id

Nếu processing ➔ Hiển thị Loading.

Nếu completed ➔ Hiển thị kết quả.

Nếu failed ➔ Hiện thông báo lỗi.

[QUAN TRỌNG] Exponential Backoff (Giãn cách thời gian chờ):
Để tránh làm nghẽn Backend khi có nhiều user gọi AI cùng lúc, Frontend KHÔNG ĐƯỢC poll mỗi giây một lần. Nên áp dụng chiến lược giãn thời gian:

Lần 1: Sau 2 giây.

Lần 2: Sau 4 giây.

Lần 3: Sau 8 giây.

Tối đa: Dừng sau 60 giây và báo lỗi Timeout.

9. Dọn dẹp dữ liệu (Cleanup Strategy)
Với luồng Smart Coloring, ảnh được lưu lên Cloudinary. Nếu Assistant bấm rejected hoặc bỏ ngang không bao giờ applied, ảnh này sẽ trở thành rác.
Giải pháp: Cần có một Cronjob (Ví dụ: chạy bằng node-cron vào lúc 2h sáng Chủ Nhật hàng tuần) quét bảng page_ai_suggestion:

Tìm các bản ghi có suggestion_type = 'smart_coloring' VÀ status IN ('rejected', 'failed') VÀ created_at < (hiện tại - 7 ngày).

Lấy result_data.image_url gọi sang cloudinary.provider.js để xóa file vật lý, tiết kiệm dung lượng lưu trữ.

10. Database Constraints
AI chỉ ghi vào page_ai_suggestion.
KHÔNG ghi trực tiếp vào page_region, page_submission, page_version.
Chỉ ghi sau khi người dùng kích hoạt API xác nhận (POST /regions/bulk hoặc POST /submissions).

11. API Cần Implement
Panel Detection
POST /pages/:pageId/ai/panel-detection (Khởi tạo AI)

GET /ai/suggestions/:suggestionId (Polling)

PATCH /ai/suggestions/:suggestionId/reject (Bỏ kết quả)

Smart Coloring
POST /page-tasks/:taskId/ai/coloring (Sinh ảnh)

POST /page-tasks/:taskId/submissions (Gửi kèm suggestion_id sau khi Assistant chốt)

12. Tích hợp vào Module cũ
pages.service.js (Hàm bulkInsertRegions)
Thêm logic:
if (req.body.suggestion_id) {
    await aiRepository.markApplied(req.body.suggestion_id);
}
pageTasks.service.js (Hàm submitTask)
Thêm logic:
Nếu có req.body.suggestion_id ➔ Đọc result_data.image_url ➔ Tạo page_version ➔ Tạo page_submission ➔ markApplied().

13. Nguyên tắc thiết kế (Checklist)
[x] AI không sửa dữ liệu chính.

[x] AI luôn có bước Preview.

[x] User luôn quyết định cuối cùng.

[x] AI chạy Background. Không block HTTP Request.

[x] Controller không chứa Business Logic.

[x] Repository chỉ query Database.

[x] Provider chỉ gọi API bên thứ ba & bắt lỗi ngoại lệ (Exception Handling).

[x] Service điều phối toàn bộ workflow.

[x] Luôn lưu lịch sử AI trong page_ai_suggestion.

[x] Có chiến lược Cleanup dọn dẹp rác định kỳ.

14. Roadmap Implement
Phase 1: Database & Repository (Tạo bảng page_ai_suggestion và viết các hàm CRUD).

Phase 2: Providers & Error Handling (Cấu hình kết nối Groq, HuggingFace, Cloudinary).

Phase 3: AI Service (Viết Core Logic điều phối các workflow bất đồng bộ).

Phase 4: Controller, Routes & Validation (Mở cổng API và validate dữ liệu đầu vào).

Phase 5: Tích hợp Module Cũ (Cập nhật logic pages.service và pageTasks.service).

Phase 6: End-to-End Testing (Test toàn bộ luồng bằng Postman đảm bảo dữ liệu chạy đúng).