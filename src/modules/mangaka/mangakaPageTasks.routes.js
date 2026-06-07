const express = require('express');
const router = express.Router({ mergeParams: true });
const { validate } = require('../../middlewares/validate.middleware');
const { z } = require('zod');
const ctrl = require('./mangakaPageTasks.controller');
const { requireSeriesMembership } = require('./mangaka.middleware');

const uuid = z.string().uuid();
const pageP = z.object({ seriesId: uuid, chapterId: uuid, pageId: uuid });
const taskP = z.object({ seriesId: uuid, chapterId: uuid, pageId: uuid, taskId: uuid });

const taskBody = z.object({
  task_type: z.string().min(1).max(50).optional(),
  assistant_id: uuid.optional(),
  deadline: z.string().datetime().optional(),
  description: z.string().optional(),
});

const createSchema = z.object({ params: pageP, body: taskBody });
const bulkSchema = z.object({ params: pageP, body: z.object({ tasks: z.array(taskBody).min(1) }) });
const updateSchema = z.object({ params: taskP, body: taskBody.partial() });
const reassignSchema = z.object({ params: taskP, body: z.object({ assistant_id: uuid }) });
const revisionSchema = z.object({ params: taskP, body: z.object({ feedback_content: z.string().min(1), feedback_type: z.string().optional() }) });
const groupAllocateSchema = z.object({ params: z.object({ seriesId: uuid }), body: z.object({ task_ids: z.array(uuid).min(1), assistant_ids: z.array(uuid).min(1) }) });

router.use(requireSeriesMembership);

router.get('/', ctrl.listTasks);
router.get('/:taskId', validate(z.object({ params: taskP })), ctrl.getTaskById);
router.post('/', validate(createSchema), ctrl.createTask);
router.post('/bulk', validate(bulkSchema), ctrl.bulkCreateTasks);
router.patch('/:taskId', validate(updateSchema), ctrl.updateTask);
router.patch('/:taskId/assign', validate(z.object({ params: taskP })), ctrl.workflow('assign'));
router.patch('/:taskId/start', validate(z.object({ params: taskP })), ctrl.workflow('start'));
router.patch('/:taskId/submit', validate(z.object({ params: taskP })), ctrl.workflow('submit'));
router.patch('/:taskId/approve', validate(z.object({ params: taskP })), ctrl.workflow('approve'));
router.patch('/:taskId/reject', validate(z.object({ params: taskP })), ctrl.workflow('reject'));
router.patch('/:taskId/cancel', validate(z.object({ params: taskP })), ctrl.workflow('cancel'));
router.patch('/:taskId/reopen', validate(z.object({ params: taskP })), ctrl.workflow('reopen'));
router.patch('/:taskId/complete', validate(z.object({ params: taskP })), ctrl.completeTask);
router.patch('/:taskId/reassign', validate(reassignSchema), ctrl.reassignTask);
router.patch('/:taskId/transfer', validate(reassignSchema), ctrl.transferTask);
router.post('/:taskId/request-revision', validate(revisionSchema), ctrl.requestRevision);
router.delete('/:taskId', validate(z.object({ params: taskP })), ctrl.deleteTask);

module.exports = router;

// Series-level task routes (mounted separately)
const seriesTaskRouter = express.Router({ mergeParams: true });
seriesTaskRouter.use(requireSeriesMembership);
seriesTaskRouter.get('/', ctrl.listAllSeriesTasks);
seriesTaskRouter.post('/group-allocate', validate(groupAllocateSchema), ctrl.groupAllocate);
seriesTaskRouter.post('/auto-allocate', ctrl.autoAllocate);

module.exports.seriesTaskRouter = seriesTaskRouter;
