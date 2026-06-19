/**
 * @swagger
 * components:
 *   schemas:
 *     Series:
 *       type: object
 *       properties:
 *         series_id: { type: string, format: uuid }
 *         title: { type: string }
 *         description: { type: string }
 *         status: { type: string, enum: [draft, pending_review, approved, published, hidden, archived, deleted, rejected, banned] }
 *         genre: { type: string }
 *         cover_image_url: { type: string }
 *         view_count: { type: integer }
 *         created_at: { type: string, format: date-time }
 *     Chapter:
 *       type: object
 *       properties:
 *         chapter_id: { type: string, format: uuid }
 *         series_id: { type: string, format: uuid }
 *         title: { type: string }
 *         chapter_number: { type: integer }
 *         status: { type: string }
 *     Page:
 *       type: object
 *       properties:
 *         page_id: { type: string, format: uuid }
 *         chapter_id: { type: string, format: uuid }
 *         page_number: { type: integer }
 *         image_url: { type: string }
 *         status: { type: string }
 *     PageTask:
 *       type: object
 *       properties:
 *         task_id: { type: string, format: uuid }
 *         page_id: { type: string, format: uuid }
 *         task_type: { type: string }
 *         status: { type: string }
 *         assistant_id: { type: string, format: uuid }
 *         deadline: { type: string, format: date-time }
 *     User:
 *       type: object
 *       properties:
 *         user_id: { type: string, format: uuid }
 *         username: { type: string }
 *         email: { type: string }
 *         role: { type: string, enum: [mangaka, assistant, editor, board, admin] }
 *         status: { type: string }
 *     Notification:
 *       type: object
 *       properties:
 *         notification_id: { type: string, format: uuid }
 *         user_id: { type: string, format: uuid }
 *         title: { type: string }
 *         content: { type: string }
 *         type: { type: string }
 *         is_read: { type: boolean }
 *         created_at: { type: string, format: date-time }
 *     Vote:
 *       type: object
 *       properties:
 *         vote_id: { type: string, format: uuid }
 *         session_id: { type: string, format: uuid }
 *         voter_id: { type: string, format: uuid }
 *         decision: { type: string }
 *         score: { type: number, minimum: 1, maximum: 10 }
 *         note: { type: string }
 *         status: { type: string }
 */

/**
 * =====================
 * SERIES (generic)
 * =====================
 *
 * @swagger
 * /api/series:
 *   get:
 *     tags: [Series]
 *     summary: List all series
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: List of series }
 *   post:
 *     tags: [Series]
 *     summary: Create a series
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               genre: { type: string }
 *               cover_image_url: { type: string }
 *     responses:
 *       201: { description: Series created }
 *
 * /api/series/{seriesId}:
 *   get:
 *     tags: [Series]
 *     summary: Get series by ID
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Series detail }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Series]
 *     summary: Update series
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Series]
 *     summary: Delete (soft) series
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deleted }
 */

/**
 * =====================
 * MANGAKA
 * =====================
 *
 * @swagger
 * /api/mangaka/series:
 *   get:
 *     tags: [Mangaka]
 *     summary: List my series (member only)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: My series list }
 *   post:
 *     tags: [Mangaka]
 *     summary: Create series (auto-adds as owner)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: "Dragon Blade Academy" }
 *               description: { type: string }
 *               genre: { type: string, example: "Fantasy" }
 *               cover_image_url: { type: string }
 *     responses:
 *       201: { description: Series created }
 *
 * /api/mangaka/series/{seriesId}/submit-review:
 *   patch:
 *     tags: [Mangaka]
 *     summary: Submit series for review (draft → pending_review)
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Submitted }
 *
 * /api/mangaka/series/{seriesId}/members:
 *   get:
 *     tags: [Mangaka]
 *     summary: List series members
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Members list }
 *   post:
 *     tags: [Mangaka]
 *     summary: Add member to series
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, role_in_series]
 *             properties:
 *               user_id: { type: string, format: uuid }
 *               role_in_series: { type: string, example: "assistant" }
 *     responses:
 *       201: { description: Member added }
 *
 * /api/mangaka/series/{seriesId}/chapters:
 *   get:
 *     tags: [Mangaka]
 *     summary: List chapters in a series
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Chapters list }
 *   post:
 *     tags: [Mangaka]
 *     summary: Create chapter
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               chapter_number: { type: integer }
 *     responses:
 *       201: { description: Chapter created }
 *
 * /api/mangaka/series/{seriesId}/chapters/{chapterId}/pages:
 *   get:
 *     tags: [Mangaka]
 *     summary: List pages in a chapter
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Pages list }
 *
 * /api/mangaka/series/{seriesId}/chapters/{chapterId}/pages/{pageId}/tasks:
 *   get:
 *     tags: [Mangaka]
 *     summary: List tasks for a page
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: task_type
 *         schema: { type: string }
 *     responses:
 *       200: { description: Tasks list }
 *   post:
 *     tags: [Mangaka]
 *     summary: Create task for page
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               task_type: { type: string, example: "coloring" }
 *               assistant_id: { type: string, format: uuid }
 *               deadline: { type: string, format: date-time }
 *               description: { type: string }
 *     responses:
 *       201: { description: Task created }
 *
 * /api/mangaka/series/{seriesId}/recovery-proposals:
 *   get:
 *     tags: [Mangaka]
 *     summary: List recovery proposals for my series
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Recovery proposals list }
 *   post:
 *     tags: [Mangaka]
 *     summary: Create a recovery proposal for a series
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title: { type: string, example: "Recovery proposal for Dragon Blade" }
 *               description: { type: string, example: "I propose a holiday special, extra marketing, and guest artist support." }
 *     responses:
 *       201: { description: Recovery proposal created }
 *
 * /api/mangaka/series/{seriesId}/recovery-proposals/{proposalId}:
 *   get:
 *     tags: [Mangaka]
 *     summary: Get a specific recovery proposal
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Recovery proposal detail }
 *
 *               task_type: { type: string, example: "coloring" }
 *               assistant_id: { type: string, format: uuid }
 *               deadline: { type: string, format: date-time }
 *               description: { type: string }
 *     responses:
 *       201: { description: Task created }
 *
 * /api/mangaka/notifications:
 *   get:
 *     tags: [Mangaka]
 *     summary: My notifications
 *     parameters:
 *       - in: query
 *         name: is_read
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Notifications list }
 *
 * /api/mangaka/dashboard/series/{seriesId}/progress:
 *   get:
 *     tags: [Mangaka]
 *     summary: Series progress dashboard
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Progress stats }
 *
 * /api/mangaka/export/series/{seriesId}:
 *   get:
 *     tags: [Mangaka]
 *     summary: Export full series data as JSON
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Export payload }
 */

/**
 * =====================
 * ASSISTANT
 * =====================
 *
 * @swagger
 * /api/assistant/page-tasks:
 *   get:
 *     tags: [Assistant]
 *     summary: List my assigned tasks
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [assigned, in_progress, submitted, needs_revision, completed, cancelled, rejected] }
 *       - in: query
 *         name: overdue
 *         schema: { type: boolean }
 *       - in: query
 *         name: deadline_before
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: My tasks }
 *
 * /api/assistant/page-tasks/{taskId}/start:
 *   patch:
 *     tags: [Assistant]
 *     summary: Start task (assigned → in_progress)
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Task started }
 *
 * /api/assistant/page-tasks/{taskId}/submit:
 *   patch:
 *     tags: [Assistant]
 *     summary: Submit task (in_progress → submitted)
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string, example: "Đã hoàn thành, vui lòng review." }
 *     responses:
 *       200: { description: Task submitted }
 *
 * /api/assistant/dashboard/overview:
 *   get:
 *     tags: [Assistant]
 *     summary: My task overview / stats
 *     responses:
 *       200: { description: Overview stats }
 *
 * /api/assistant/performance/by-series:
 *   get:
 *     tags: [Assistant]
 *     summary: My performance grouped by series
 *     responses:
 *       200: { description: Performance by series }
 */

/**
 * =====================
 * EDITOR
 * =====================
 *
 * @swagger
 * /api/editor/review/page-tasks:
 *   get:
 *     tags: [Editor]
 *     summary: List tasks to review
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [submitted, in_review, approved, rejected] }
 *       - in: query
 *         name: assistant_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: series_id
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Tasks for review }
 *
 * /api/editor/page-tasks/{taskId}/approve:
 *   patch:
 *     tags: [Editor]
 *     summary: Approve task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Task approved }
 *
 * /api/editor/page-tasks/{taskId}/request-revision:
 *   patch:
 *     tags: [Editor]
 *     summary: Request revision (creates feedback + notifies assistant)
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: "Cần chỉnh lại tone màu." }
 *     responses:
 *       200: { description: Revision requested }
 *
 * /api/editor/page-tasks/bulk/approve:
 *   patch:
 *     tags: [Editor]
 *     summary: Bulk approve tasks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task_ids]
 *             properties:
 *               task_ids:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *               note: { type: string }
 *     responses:
 *       200: { description: Tasks approved }
 *
 * /api/editor/review-sessions:
 *   post:
 *     tags: [Editor]
 *     summary: Create review session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               series_id: { type: string, format: uuid }
 *               chapter_id: { type: string, format: uuid }
 *               name: { type: string, example: "Review Dragon Blade Ch.3" }
 *               description: { type: string }
 *     responses:
 *       201: { description: Review session created }
 *
 * /api/editor/dashboard/overview:
 *   get:
 *     tags: [Editor]
 *     summary: Editor dashboard overview
 *     responses:
 *       200: { description: Overview stats }
 */

/**
 * =====================
 * BOARD
 * =====================
 *
 * @swagger
 * /api/board/proposals/pending:
 *   get:
 *     tags: [Board]
 *     summary: List pending proposals (review sessions)
 *     responses:
 *       200: { description: Pending proposals }
 *
 * /api/board/review-sessions/{sessionId}/votes:
 *   get:
 *     tags: [Board]
 *     summary: List votes in session
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Votes list }
 *   post:
 *     tags: [Board]
 *     summary: Submit vote
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               decision: { type: string, enum: [approve, reject, hold], example: "approve" }
 *               score: { type: number, minimum: 1, maximum: 10, example: 8 }
 *               note: { type: string }
 *               status: { type: string, enum: [submitted, verified], default: "submitted" }
 *     responses:
 *       201: { description: Vote submitted }
 *
 * /api/board/review-sessions/{sessionId}/process-result:
 *   post:
 *     tags: [Board]
 *     summary: Process voting result (calculates avg score, dominant decision)
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Result processed }
 *
 * /api/board/series/{seriesId}/approve:
 *   patch:
 *     tags: [Board]
 *     summary: Approve series
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Series approved }
 *
 * /api/board/series/{seriesId}/publish:
 *   patch:
 *     tags: [Board]
 *     summary: Publish series
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Series published }
 */

/**
 * =====================
 * RANKINGS
 * =====================
 *
 * @swagger
 * /api/rankings/series/top:
 *   get:
 *     tags: [Rankings]
 *     summary: Top series ranking board
 *     parameters:
 *       - in: query
 *         name: period_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: genre
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Top series }
 *
 * /api/rankings/periods/{periodId}/calculate:
 *   post:
 *     tags: [Rankings]
 *     summary: Calculate rankings for a period
 *     parameters:
 *       - in: path
 *         name: periodId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Rankings calculated }
 *
 * /api/rankings/series/{seriesId}/trend:
 *   get:
 *     tags: [Rankings]
 *     summary: Series ranking trend across periods
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Trend data }
 *
 * /api/rankings/series/{seriesId}/risk-analysis:
 *   get:
 *     tags: [Rankings]
 *     summary: Risk analysis — is series at risk of cancellation?
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Risk analysis result }
 */

/**
 * =====================
 * ADMIN
 * =====================
 *
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *     responses:
 *       200: { description: Users list }
 *   post:
 *     tags: [Admin]
 *     summary: Create user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, role]
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [mangaka, assistant, editor, board, admin] }
 *     responses:
 *       201: { description: User created }
 *
 * /api/admin/users/{userId}/role:
 *   patch:
 *     tags: [Admin]
 *     summary: Change user role
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [mangaka, assistant, editor, board, admin] }
 *     responses:
 *       200: { description: Role updated }
 *
 * /api/admin/dashboard/overview:
 *   get:
 *     tags: [Admin]
 *     summary: Full system overview stats
 *     responses:
 *       200: { description: System overview }
 *
 * /api/admin/export/full-system:
 *   get:
 *     tags: [Admin]
 *     summary: Export full system data as JSON
 *     responses:
 *       200: { description: Full system export }
 *
 * /api/internal/notifications:
 *   post:
 *     tags: [Internal]
 *     summary: Send notification to a user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, title]
 *             properties:
 *               user_id: { type: string, format: uuid }
 *               title: { type: string }
 *               content: { type: string }
 *               type: { type: string, example: "task_assigned" }
 *     responses:
 *       201: { description: Notification sent }
 *
 * /api/uploads/single:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload a single image to Cloudinary
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folder:
 *                 type: string
 *                 example: "covers"
 *     responses:
 *       200:
 *         description: Upload successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url: { type: string }
 *                 public_id: { type: string }
 */

module.exports = {};
