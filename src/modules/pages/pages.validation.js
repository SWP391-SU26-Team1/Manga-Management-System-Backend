const { z } = require('zod');
const { PAGE_STATUS } = require('../../constants/status');

const uuidParam = z.string().uuid({ message: 'Invalid UUID' });

const createPageSchema = z.object({
  body: z.object({
    chapter_id: uuidParam,
    page_number: z.number().int().positive(),
    image_url: z.string().url().optional(),
    status: z.enum(PAGE_STATUS).default('draft'),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }),
});

const updatePageSchema = z.object({
  params: z.object({ pageId: uuidParam }),
  body: z.object({
    page_number: z.number().int().positive().optional(),
    image_url: z.string().url().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }),
});

const updatePageStatusSchema = z.object({
  params: z.object({ pageId: uuidParam }),
  body: z.object({ status: z.enum(PAGE_STATUS) }),
});

const pageIdParamSchema = z.object({ params: z.object({ pageId: uuidParam }) });
const chapterIdParamSchema = z.object({ params: z.object({ chapterId: uuidParam }) });

const listPagesSchema = z.object({
  query: z.object({
    status: z.enum(PAGE_STATUS).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

module.exports = { createPageSchema, updatePageSchema, updatePageStatusSchema, pageIdParamSchema, chapterIdParamSchema, listPagesSchema };
