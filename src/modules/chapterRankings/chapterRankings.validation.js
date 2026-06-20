const { z } = require('zod');
const uuidParam = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  { message: 'Invalid UUID' },
);

const createChapterRankingSchema = z.object({
  body: z.object({
    period_id: uuidParam,
    series_id: uuidParam,
    chapter_id: uuidParam,
    rank_position: z.number().int().positive().optional(),
    score: z.number().optional(),
    total_vote: z.number().int().min(0).optional(),
  }),
});

const updateChapterRankingSchema = z.object({
  params: z.object({ chapterRankingId: uuidParam }),
  body: z.object({
    rank_position: z.number().int().positive().optional(),
    score: z.number().optional(),
    total_vote: z.number().int().min(0).optional(),
  }),
});

const chapterRankingIdParamSchema = z.object({ params: z.object({ chapterRankingId: uuidParam }) });

module.exports = { createChapterRankingSchema, updateChapterRankingSchema, chapterRankingIdParamSchema };
