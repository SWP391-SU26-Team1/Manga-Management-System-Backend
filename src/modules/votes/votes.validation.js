const { z } = require('zod');
const { VOTE_STATUS } = require('../../constants/status');

const uuidParam = z.string().uuid({ message: 'Invalid UUID' });

const createVoteSchema = z.object({
  body: z.object({
    session_id: uuidParam.optional(),
    decision: z.string().max(50).optional(),
    score: z.number().int().min(1).max(10).nullable().optional(),
    note: z.string().optional(),
    status: z.enum(VOTE_STATUS).default('submitted'),
  }),
});

const updateVoteSchema = z.object({
  params: z.object({ voteId: uuidParam }),
  body: z.object({
    decision: z.string().max(50).optional(),
    score: z.number().int().min(1).max(10).nullable().optional(),
    note: z.string().optional(),
  }),
});

const updateVoteStatusSchema = z.object({
  params: z.object({ voteId: uuidParam }),
  body: z.object({ status: z.enum(VOTE_STATUS) }),
});

const voteIdParamSchema = z.object({ params: z.object({ voteId: uuidParam }) });
const sessionIdParamSchema = z.object({ params: z.object({ sessionId: uuidParam }) });
const userIdParamSchema = z.object({ params: z.object({ userId: uuidParam }) });

module.exports = { createVoteSchema, updateVoteSchema, updateVoteStatusSchema, voteIdParamSchema, sessionIdParamSchema, userIdParamSchema };
