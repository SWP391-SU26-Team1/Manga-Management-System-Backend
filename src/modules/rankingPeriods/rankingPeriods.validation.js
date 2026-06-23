const { z } = require('zod');
const { RANKING_PERIOD_STATUS } = require('../../constants/status');

const uuidParam = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  { message: 'Invalid UUID' },
);

const createPeriodSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    period_type: z.string().max(50).optional(),
    start_date: z.string(),
    end_date: z.string(),
    status: z.enum(RANKING_PERIOD_STATUS).default('pending'),
  }),
});

const updatePeriodSchema = z.object({
  params: z.object({ periodId: uuidParam }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    period_type: z.string().max(50).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }),
});

const updatePeriodStatusSchema = z.object({
  params: z.object({ periodId: uuidParam }),
  body: z.object({ status: z.enum(RANKING_PERIOD_STATUS) }),
});

const periodIdParamSchema = z.object({ params: z.object({ periodId: uuidParam }) });

module.exports = { createPeriodSchema, updatePeriodSchema, updatePeriodStatusSchema, periodIdParamSchema };
