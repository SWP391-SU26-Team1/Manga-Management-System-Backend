const { z } = require("zod");

const toggleChapterLikeSchema = z.object({
  body: z.object({
    chapter_id: z.string().uuid(),
  }),
});

module.exports = { toggleChapterLikeSchema };
