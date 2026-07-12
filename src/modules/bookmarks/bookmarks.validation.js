const { z } = require("zod");

const createBookmarkSchema = z.object({
  body: z.object({
    series_id: z.string().uuid(),
    last_read_chapter_id: z.string().uuid().optional(),
    page_id: z.string().uuid().optional(),
  }),
});

const listBookmarksSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

module.exports = { createBookmarkSchema, listBookmarksSchema };
