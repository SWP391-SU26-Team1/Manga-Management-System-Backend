const { z } = require('zod');
const uuidParam = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  { message: 'Invalid UUID' },
);

const createSeriesRankingSchema = z.object({
  body: z.object({
    period_id: uuidParam,
    series_id: uuidParam,
    rank_position: z.number().int().positive().optional(),
    score: z.number().optional(),
    total_vote: z.number().int().min(0).optional(),
  }),
});

const updateSeriesRankingSchema = z.object({
  params: z.object({ seriesRankingId: uuidParam }),
  body: z.object({
    rank_position: z.number().int().positive().optional(),
    score: z.number().optional(),
    total_vote: z.number().int().min(0).optional(),
  }),
});

const seriesRankingIdParamSchema = z.object({ params: z.object({ seriesRankingId: uuidParam }) });

module.exports = { createSeriesRankingSchema, updateSeriesRankingSchema, seriesRankingIdParamSchema };
