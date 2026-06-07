const { z } = require('zod');

const uuidParam = z.string().uuid({ message: 'Invalid UUID' });

const createMemberSchema = z.object({
  body: z.object({
    series_id: uuidParam,
    user_id: uuidParam,
    role_in_series: z.string().min(1).max(50),
  }),
});

const updateMemberSchema = z.object({
  params: z.object({ seriesMemberId: uuidParam }),
  body: z.object({ role_in_series: z.string().min(1).max(50) }),
});

const memberIdParamSchema = z.object({
  params: z.object({ seriesMemberId: uuidParam }),
});

const seriesIdParamSchema = z.object({
  params: z.object({ seriesId: uuidParam }),
});

const addMemberBySeriesSchema = z.object({
  params: z.object({ seriesId: uuidParam }),
  body: z.object({
    user_id: uuidParam,
    role_in_series: z.string().min(1).max(50),
  }),
});

const removeMemberBySeriesSchema = z.object({
  params: z.object({ seriesId: uuidParam, userId: uuidParam }),
});

module.exports = {
  createMemberSchema,
  updateMemberSchema,
  memberIdParamSchema,
  seriesIdParamSchema,
  addMemberBySeriesSchema,
  removeMemberBySeriesSchema,
};
