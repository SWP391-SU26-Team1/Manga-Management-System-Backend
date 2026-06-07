const { z } = require('zod');
const { ANNOTATION_STATUS } = require('../../constants/status');

const uuidParam = z.string().uuid({ message: 'Invalid UUID' });

const createAnnotationSchema = z.object({
  body: z.object({
    page_id: uuidParam,
    user_id: uuidParam,
    region_id: uuidParam.optional(),
    task_id: uuidParam.optional(),
    x: z.number().int().optional(),
    y: z.number().int().optional(),
    content: z.string().optional(),
    status: z.enum(ANNOTATION_STATUS).default('active'),
  }),
});

const updateAnnotationSchema = z.object({
  params: z.object({ annotationId: uuidParam }),
  body: z.object({
    x: z.number().int().optional(),
    y: z.number().int().optional(),
    content: z.string().optional(),
  }),
});

const updateAnnotationStatusSchema = z.object({
  params: z.object({ annotationId: uuidParam }),
  body: z.object({ status: z.enum(ANNOTATION_STATUS) }),
});

const annotationIdParamSchema = z.object({ params: z.object({ annotationId: uuidParam }) });
const pageIdParamSchema = z.object({ params: z.object({ pageId: uuidParam }) });
const taskIdParamSchema = z.object({ params: z.object({ taskId: uuidParam }) });

module.exports = {
  createAnnotationSchema,
  updateAnnotationSchema,
  updateAnnotationStatusSchema,
  annotationIdParamSchema,
  pageIdParamSchema,
  taskIdParamSchema,
};
