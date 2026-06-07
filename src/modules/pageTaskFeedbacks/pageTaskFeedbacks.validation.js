const { z } = require('zod');
const { PAGE_TASK_FEEDBACK_STATUS } = require('../../constants/status');

const uuidParam = z.string().uuid({ message: 'Invalid UUID' });

const createFeedbackSchema = z.object({
  body: z.object({
    task_id: uuidParam,
    mangaka_id: uuidParam.optional(),
    assistant_id: uuidParam.optional(),
    content: z.string().optional(),
    status: z.enum(PAGE_TASK_FEEDBACK_STATUS).default('pending'),
  }),
});

const updateFeedbackSchema = z.object({
  params: z.object({ feedbackId: uuidParam }),
  body: z.object({ content: z.string().optional() }),
});

const updateFeedbackStatusSchema = z.object({
  params: z.object({ feedbackId: uuidParam }),
  body: z.object({ status: z.enum(PAGE_TASK_FEEDBACK_STATUS) }),
});

const feedbackIdParamSchema = z.object({ params: z.object({ feedbackId: uuidParam }) });
const taskIdParamSchema = z.object({ params: z.object({ taskId: uuidParam }) });

module.exports = { createFeedbackSchema, updateFeedbackSchema, updateFeedbackStatusSchema, feedbackIdParamSchema, taskIdParamSchema };
