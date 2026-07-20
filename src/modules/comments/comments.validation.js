const { z } = require("zod");

const createCommentSchema = z.object({
  body: z.object({
    chapter_id: z.string().uuid(),
    parent_comment_id: z.string().uuid().optional(),
    content: z.string().min(1).max(5000),
    status: z.enum(["active", "hidden", "deleted", "flagged"]).optional(),
  }),
});

const listCommentsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

module.exports = { createCommentSchema, listCommentsSchema };
