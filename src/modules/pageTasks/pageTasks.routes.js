const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./pageTasks.validation');
const controller = require('./pageTasks.controller');

/**
 * @swagger
 * /api/page-tasks:
 *   get:
 *     tags: [Page Tasks]
 *     summary: List page tasks (also nested under /api/pages/:pageId/tasks)
 *     parameters:
 *       - in: query
 *         name: pageId
 *         schema: { type: string }
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
 *       200: { description: List of tasks }
 *   post:
 *     tags: [Page Tasks]
 *     summary: Create a task (editor, mangaka, admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pageId, taskType, title]
 *             properties:
 *               pageId: { type: string }
 *               taskType: { type: string, enum: [inking, coloring, lettering, cleaning, sfx], example: "inking" }
 *               title: { type: string, example: "Ink page 5" }
 *               description: { type: string }
 *               deadline: { type: string, format: date }
 *               assigneeId: { type: string }
 *     responses:
 *       201: { description: Task created }
 */
router.get('/', authenticateToken, validate(v.listTasksSchema), controller.listTasks);

/**
 * @swagger
 * /api/page-tasks/{taskId}:
 *   get:
 *     tags: [Page Tasks]
 *     summary: Get task by ID
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task data }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Page Tasks]
 *     summary: Update task (editor, mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               deadline: { type: string, format: date }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Page Tasks]
 *     summary: Delete task (editor, admin)
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.get('/:taskId', authenticateToken, validate(v.taskIdParamSchema), controller.getTaskById);
router.post('/:taskId/submissions', authenticateToken, requireRole(['admin', 'assistant']), validate(v.createSubmissionSchema), controller.createSubmission);
router.post('/', authenticateToken, requireRole(['admin', 'editor', 'mangaka']), validate(v.createTaskSchema), controller.createTask);
router.patch('/:taskId', authenticateToken, requireRole(['admin', 'editor', 'mangaka']), validate(v.updateTaskSchema), controller.updateTask);
router.patch('/:taskId/status', authenticateToken, requireRole(['admin', 'editor']), validate(v.updateTaskStatusSchema), controller.updateTaskStatus);
router.delete('/:taskId', authenticateToken, requireRole(['admin', 'editor']), validate(v.taskIdParamSchema), controller.deleteTask);

/**
 * @swagger
 * /api/page-tasks/{taskId}/status:
 *   patch:
 *     tags: [Page Tasks]
 *     summary: Update task status directly (editor, admin)
 *     parameters:
 *       - in: path
 *         name: taskId
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
 *               status: { type: string }
 *     responses:
 *       200: { description: Status updated }
 *
 * /api/page-tasks/{taskId}/assign:
 *   patch:
 *     tags: [Page Tasks]
 *     summary: Assign task to assistant (editor, mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task assigned }
 *
 * /api/page-tasks/{taskId}/start:
 *   patch:
 *     tags: [Page Tasks]
 *     summary: Start working on task (assistant, admin)
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task started }
 *
 * /api/page-tasks/{taskId}/submit:
 *   patch:
 *     tags: [Page Tasks]
 *     summary: Submit task for review (assistant, admin)
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task submitted }
 *
 * /api/page-tasks/{taskId}/approve:
 *   patch:
 *     tags: [Page Tasks]
 *     summary: Approve task (editor, mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task approved }
 *
 * /api/page-tasks/{taskId}/request-revision:
 *   patch:
 *     tags: [Page Tasks]
 *     summary: Request revision on task (editor, mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Revision requested }
 *
 * /api/page-tasks/{taskId}/reject:
 *   patch:
 *     tags: [Page Tasks]
 *     summary: Reject task (editor, mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task rejected }
 *
 * /api/page-tasks/{taskId}/cancel:
 *   patch:
 *     tags: [Page Tasks]
 *     summary: Cancel task (editor, mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task cancelled }
 *
 * /api/page-tasks/{taskId}/hold:
 *   patch:
 *     tags: [Page Tasks]
 *     summary: Put task on hold (editor, mangaka, admin)
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task on hold }
 */
router.patch('/:taskId/assign', authenticateToken, requireRole(['admin', 'editor', 'mangaka']), validate(v.taskIdParamSchema), controller.workflowAction('assign'));
router.patch('/:taskId/start', authenticateToken, requireRole(['admin', 'assistant']), validate(v.taskIdParamSchema), controller.workflowAction('start'));
router.patch('/:taskId/submit', authenticateToken, requireRole(['admin', 'assistant']), validate(v.taskIdParamSchema), controller.workflowAction('submit'));
router.patch('/:taskId/approve', authenticateToken, requireRole(['admin', 'editor', 'mangaka']), validate(v.taskIdParamSchema), controller.workflowAction('approve'));
router.patch('/:taskId/request-revision', authenticateToken, requireRole(['admin', 'editor', 'mangaka']), validate(v.taskIdParamSchema), controller.workflowAction('request-revision'));
router.patch('/:taskId/reject', authenticateToken, requireRole(['admin', 'editor', 'mangaka']), validate(v.taskIdParamSchema), controller.workflowAction('reject'));
router.patch('/:taskId/cancel', authenticateToken, requireRole(['admin', 'editor', 'mangaka']), validate(v.taskIdParamSchema), controller.workflowAction('cancel'));
router.patch('/:taskId/hold', authenticateToken, requireRole(['admin', 'editor', 'mangaka']), validate(v.taskIdParamSchema), controller.workflowAction('hold'));

module.exports = router;
