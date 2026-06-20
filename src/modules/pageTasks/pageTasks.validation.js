const { z } = require('zod');
const { PAGE_TASK_STATUS } = require('../../constants/status');

const uuidParam = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  { message: 'Invalid UUID' },
);

const createTaskSchema = z.object({
  body: z.object({
    page_id: uuidParam,
    assigned_by_id: uuidParam.optional(),
    region_id: uuidParam.optional(),
    assistant_id: uuidParam.optional(),
    task_type: z.string().min(1).max(100),
    deadline: z.string().datetime().optional(),
    content: z.string().optional(),
  }),
});

const updateTaskSchema = z.object({
  params: z.object({ taskId: uuidParam }),
  body: z.object({
    region_id: uuidParam.optional(),
    assistant_id: uuidParam.optional(),
    task_type: z.string().min(1).max(100).optional(),
    deadline: z.string().datetime().optional(),
    content: z.string().optional(),
  }),
});

const updateTaskStatusSchema = z.object({
  params: z.object({ taskId: uuidParam }),
  body: z.object({ status: z.enum(PAGE_TASK_STATUS) }),
});

const taskIdParamSchema = z.object({ params: z.object({ taskId: uuidParam }) });
const pageIdParamSchema = z.object({ params: z.object({ pageId: uuidParam }) });

const listTasksSchema = z.object({
  query: z.object({
    status: z.enum(PAGE_TASK_STATUS).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

const assistantTasksSchema = z.object({
  params: z.object({ assistantId: uuidParam }),
  query: z.object({
    status: z.enum(PAGE_TASK_STATUS).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  taskIdParamSchema,
  pageIdParamSchema,
  listTasksSchema,
  assistantTasksSchema,
};
