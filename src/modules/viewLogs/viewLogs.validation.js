const { z } = require("zod");

const createViewLogSchema = z.object({
  body: z.object({
    chapter_id: z.string().uuid(),
  }),
});

module.exports = { createViewLogSchema };
