const express = require('express');
const router = express.Router();
const { validate } = require('../../middlewares/validate.middleware');
const { z } = require('zod');
const ctrl = require('./internal.controller');

const uuid = z.string().uuid();
const baseBody = z.object({ user_id: uuid, title: z.string().min(1).max(255), content: z.string().optional(), type: z.string().max(50).optional() });
const typedBody = z.object({ user_id: uuid, title: z.string().optional(), content: z.string().optional() });

router.post('/notifications', validate(z.object({ body: baseBody })), ctrl.sendNotification);
router.post('/notifications/bulk', validate(z.object({ body: z.object({ notifications: z.array(z.object({ userId: uuid, title: z.string().min(1) })).min(1) }) })), ctrl.sendBulkNotifications);

router.post('/notifications/task-assigned', validate(z.object({ body: typedBody })), ctrl.sendTaskAssigned);
router.post('/notifications/task-submitted', validate(z.object({ body: typedBody })), ctrl.sendTaskSubmitted);
router.post('/notifications/task-updated', validate(z.object({ body: typedBody })), ctrl.sendTaskUpdated);
router.post('/notifications/task-overdue', validate(z.object({ body: typedBody })), ctrl.sendTaskOverdue);
router.post('/notifications/feedback-created', validate(z.object({ body: typedBody })), ctrl.sendFeedbackCreated);
router.post('/notifications/user-mentioned', validate(z.object({ body: typedBody })), ctrl.sendUserMentioned);
router.post('/notifications/chapter-published', validate(z.object({ body: typedBody })), ctrl.sendChapterPublished);
router.post('/notifications/manuscript-submitted', validate(z.object({ body: typedBody })), ctrl.sendManuscriptSubmitted);
router.post('/notifications/decision-result', validate(z.object({ body: typedBody })), ctrl.sendDecisionResult);
router.post('/notifications/ranking-warning', validate(z.object({ body: z.object({ user_ids: z.array(uuid).min(1), series_id: uuid.optional(), message: z.string().optional() }) })), ctrl.sendRankingWarning);

module.exports = router;
