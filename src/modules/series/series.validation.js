const { z } = require('zod');
const { SERIES_STATUS } = require('../../constants/status');

const uuidParam = z.string().uuid({ message: 'Invalid UUID' });

const createSeriesSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    cover_image_url: z.string().url().optional(),
    genre: z.string().max(100).optional(),
    status: z.enum(SERIES_STATUS).default('draft'),
  }),
});

const updateSeriesSchema = z.object({
  params: z.object({ seriesId: uuidParam }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    cover_image_url: z.string().url().optional(),
    genre: z.string().max(100).optional(),
  }),
});

const updateSeriesStatusSchema = z.object({
  params: z.object({ seriesId: uuidParam }),
  body: z.object({ status: z.enum(SERIES_STATUS) }),
});

const seriesIdParamSchema = z.object({
  params: z.object({ seriesId: uuidParam }),
});

const listSeriesSchema = z.object({
  query: z.object({
    status: z.enum(SERIES_STATUS).optional(),
    genre: z.string().optional(),
    keyword: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

module.exports = { createSeriesSchema, updateSeriesSchema, updateSeriesStatusSchema, seriesIdParamSchema, listSeriesSchema };
