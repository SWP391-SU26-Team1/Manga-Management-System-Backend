const { z } = require('zod');

const uuid = z.string().uuid();

const panelDetectionSchema = z.object({
  params: z.object({
    pageId: uuid,
  }),
  body: z.object({
    prompt: z.string().optional(),
    ai_model: z.string().max(100).optional(),
  }).optional(),
});

const smartColoringSchema = z.object({
  params: z.object({
    taskId: uuid,
  }),
  body: z.object({
    prompt: z.string().optional(),
    ai_model: z.string().max(100).optional(),
    reference_image_url: z.string().url().optional(),
  }).optional(),
});

const suggestionIdParamSchema = z.object({
  params: z.object({
    suggestionId: uuid,
  }),
});

module.exports = {
  panelDetectionSchema,
  smartColoringSchema,
  suggestionIdParamSchema,
};
