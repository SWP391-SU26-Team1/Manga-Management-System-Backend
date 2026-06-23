const { z } = require('zod');
const { CHAPTER_STATUS } = require('../../constants/status');

const uuidParam = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  { message: 'Invalid UUID' },
);

const createChapterSchema = z.object({
  body: z.object({
    series_id: uuidParam,
    chapter_number: z.number().int().positive(),
    title: z.string().max(255).optional(),
    thumbnail_image_url: z.string().url().optional(),
    status: z.enum(CHAPTER_STATUS).default('draft'),
  }),
});

const updateChapterSchema = z.object({
  params: z.object({ chapterId: uuidParam }),
  body: z.object({
    chapter_number: z.number().int().positive().optional(),
    title: z.string().max(255).optional(),
    thumbnail_image_url: z.string().url().optional(),
  }),
});

const updateChapterStatusSchema = z.object({
  params: z.object({ chapterId: uuidParam }),
  body: z.object({ status: z.enum(CHAPTER_STATUS) }),
});

const chapterIdParamSchema = z.object({
  params: z.object({ chapterId: uuidParam }),
});

const listChaptersSchema = z.object({
  query: z.object({
    status: z.enum(CHAPTER_STATUS).optional(),
    keyword: z.string().optional(),
    series_id: uuidParam.optional(),
    seriesId: uuidParam.optional(),
    series: uuidParam.optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

const seriesIdParamSchema = z.object({
  params: z.object({ seriesId: uuidParam }),
});

module.exports = {
  createChapterSchema,
  updateChapterSchema,
  updateChapterStatusSchema,
  chapterIdParamSchema,
  listChaptersSchema,
  seriesIdParamSchema,
};
