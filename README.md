# Manga Management System — Backend

REST API cho hệ thống quản lý manga, xây dựng bằng **Node.js + Express + Supabase (PostgreSQL)**.

---

## Tech Stack

| | |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 5 |
| Database | Supabase (PostgreSQL) |
| Auth | JWT + Bcrypt |
| Validation | Zod v4 |
| File Upload | Multer + Cloudinary |
| Docs | Swagger UI (OpenAPI 3.0) |
| Test | Jest + Supertest |

---

## Yêu cầu môi trường

- Node.js **18.x** trở lên
- npm **9.x** trở lên
- Tài khoản **Supabase** (có project sẵn)
- Tài khoản **Cloudinary**

---

## Cài đặt lần đầu

### 1. Clone repo

```bash
git clone https://github.com/<your-org>/<repo-name>.git
cd <repo-name>
```

### 2. Cài dependencies

```bash
npm install
```

### 3. Tạo file `.env`

Tạo file `.env` ở thư mục gốc (cùng cấp `package.json`), **không commit file này**:

```env
PORT=5000

# Supabase — lấy tại: Project Settings > API
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# JWT — tự tạo chuỗi random, ví dụ chạy: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
JWT_SECRET=<your-jwt-secret>

# Cloudinary — lấy tại: Cloudinary Dashboard > API Keys
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# Internal service secret — tự đặt chuỗi random bất kỳ
INTERNAL_SERVICE_SECRET=<random-secret>
```

### 4. Khởi động server

```bash
# Development — tự reload khi sửa file
npm run dev

# Production
npm start
```

Server chạy tại: **`http://localhost:5000`**

---

## Kiểm tra server

```bash
curl http://localhost:5000/api/health
```

```json
{ "success": true, "message": "Manga Management System Backend is running" }
```

---

## Swagger UI

Mở trình duyệt, vào: **`http://localhost:5000/api-docs`**

**Cách dùng Swagger để test API có auth:**
1. Gọi `POST /api/auth/login` → copy giá trị `data.token` trong response
2. Click **Authorize 🔒** ở góc trên phải trang Swagger
3. Dán token vào ô `Value` → click **Authorize**
4. Từ đây tất cả request sẽ tự gửi kèm token (kể cả khi reload trang)

---

## Cấu trúc thư mục

```
src/
├── app.js                        # Mount tất cả routes, Swagger, middleware
├── server.js                     # Entry point
├── config/
│   └── swagger.js                # Cấu hình OpenAPI spec
├── constants/
│   └── status.js                 # Enum roles, status của các module
├── middlewares/
│   ├── auth.middleware.js         # Xác thực JWT → req.user
│   ├── role.middleware.js         # requireRole(['admin', 'editor', ...])
│   ├── ownerOrAdmin.middleware.js # Chỉ cho chủ sở hữu hoặc admin
│   ├── internal.middleware.js     # Bảo vệ /api/internal bằng header secret
│   ├── validate.middleware.js     # Validate request body/params/query bằng Zod
│   ├── upload.middleware.js       # Multer config cho upload ảnh
│   └── error.middleware.js        # Global error handler
├── modules/                      # Mỗi module = routes + controller + service + repository
│   ├── auth/
│   ├── users/
│   ├── uploads/
│   ├── series/
│   ├── seriesMembers/
│   ├── chapters/
│   ├── pages/
│   ├── pageRegions/
│   ├── pageTasks/
│   ├── pageTaskFeedbacks/
│   ├── annotations/
│   ├── manuscripts/
│   ├── manuscriptFiles/
│   ├── reviewSessions/
│   ├── votes/
│   ├── rankingPeriods/
│   ├── seriesRankings/
│   ├── chapterRankings/
│   ├── notifications/
│   ├── dashboard/
│   ├── mangaka/                  # Routes dành riêng cho role mangaka
│   ├── assistant/                # Routes dành riêng cho role assistant
│   ├── editor/                   # Routes dành riêng cho role editor
│   ├── board/                    # Routes dành riêng cho hội đồng biên tập
│   ├── rankings/                 # Rankings tổng hợp (public + authenticated)
│   ├── admin/                    # Quản trị hệ thống
│   └── internal/                 # Gửi notification nội bộ giữa services
└── utils/
    ├── response.js               # sendSuccess() / sendError()
    ├── pagination.js             # parsePagination() / buildPaginationMeta()
    ├── appError.js               # Class AppError(message, statusCode)
    └── cloudinary.js             # Upload / delete file trên Cloudinary

tests/
├── setup.js                      # Set env vars cho test
├── helpers/jwt.js                # Tạo JWT token test
├── security.auth.test.js         # Test authentication & register
├── security.internal.test.js     # Test /api/internal guard
└── security.ownership.test.js    # Test ownership & role-based access
```

---

## Roles trong hệ thống

| Role | Mô tả | Cách tạo tài khoản |
|---|---|---|
| `mangaka` | Tác giả manga | Tự đăng ký `/api/auth/register` |
| `assistant` | Trợ lý (inking, coloring, lettering…) | Tự đăng ký `/api/auth/register` |
| `editor` | Biên tập viên | Admin tạo qua `/api/admin/users` |
| `board` | Hội đồng biên tập | Admin tạo qua `/api/admin/users` |
| `reviewer` | Người đánh giá bản thảo | Admin tạo qua `/api/admin/users` |
| `admin` | Quản trị viên hệ thống | Admin tạo qua `/api/admin/users` |

> `editor`, `board`, `reviewer`, `admin` **không thể tự đăng ký** — phải do admin cấp.

---

## API Response Format

Tất cả response đều theo format thống nhất:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "pagination": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 }
}
```

Lỗi:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error message",
  "data": null
}
```

---

## Environment Variables

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `PORT` | Không | Port server (mặc định: 5000) |
| `SUPABASE_URL` | Có | URL Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | Có | Service role key (chỉ dùng phía backend) |
| `JWT_SECRET` | Có | Secret ký JWT token — đặt chuỗi dài, random |
| `CLOUDINARY_CLOUD_NAME` | Có | Cloud name Cloudinary |
| `CLOUDINARY_API_KEY` | Có | API key Cloudinary |
| `CLOUDINARY_API_SECRET` | Có | API secret Cloudinary |
| `INTERNAL_SERVICE_SECRET` | Có | Secret cho header `x-internal-secret` gọi `/api/internal` |

---

## Chạy tests

```bash
npm test
```

19 integration tests kiểm tra: JWT auth guard, role-based access control, ownership check, register role restriction, internal route secret guard.

---

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy development với nodemon (auto reload) |
| `npm start` | Chạy production |
| `npm test` | Chạy integration tests |

---

## Lưu ý khi phát triển

- **Không commit `.env`** — file này đã có trong `.gitignore`
- Sau khi pull code mới, chạy `npm install` nếu `package.json` thay đổi
- Mọi thay đổi schema database cần thông báo cả team để cập nhật migration trên Supabase
- Swagger docs tự động sinh từ `@swagger` JSDoc comment trong các file `*.routes.js`
- Khi gọi `/api/internal/*` từ service khác, thêm header: `x-internal-secret: <INTERNAL_SERVICE_SECRET>`
