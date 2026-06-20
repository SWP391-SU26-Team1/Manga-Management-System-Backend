const { z } = require('zod');
const { REVIEW_SESSION_STATUS } = require('../../constants/status');

// PostgreSQL accepts UUID-shaped values even when they do not encode an RFC version.
const uuidParam = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  { message: 'Invalid UUID' },
);

const createSessionSchema = z.object({
  body: z.object({
    series_id: uuidParam,
    chapter_id: uuidParam.optional(),
    created_by_user_id: uuidParam.optional(),
    name: z.string().max(255).optional(),
    description: z.string().optional(),
    status: z.enum(REVIEW_SESSION_STATUS).default('pending'),
  }),
});

const updateSessionSchema = z.object({
  params: z.object({ sessionId: uuidParam }),
  body: z.object({
    name: z.string().max(255).optional(),
    description: z.string().optional(),
  }),
});

const updateSessionStatusSchema = z.object({
  params: z.object({ sessionId: uuidParam }),
  body: z.object({ status: z.enum(REVIEW_SESSION_STATUS) }),
});

const sessionIdParamSchema = z.object({ params: z.object({ sessionId: uuidParam }) });

module.exports = { createSessionSchema, updateSessionSchema, updateSessionStatusSchema, sessionIdParamSchema };
