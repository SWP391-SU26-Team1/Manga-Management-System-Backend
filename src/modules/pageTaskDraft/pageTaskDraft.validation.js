const { z } = require('zod');

const uuid = z.string().uuid('Invalid UUID format');

const getDraftSchema = z.object({
  params: z.object({
    taskId: uuid,
  }),
});

const saveDraftSchema = z.object({
  params: z.object({
    taskId: uuid,
  }),
  body: z.object({
    imageUrl: z.string().optional().nullable(),
    canvasState: z.any().optional().nullable(),
  }),
});

const deleteDraftSchema = z.object({
  params: z.object({
    taskId: uuid,
  }),
});

module.exports = {
  getDraftSchema,
  saveDraftSchema,
  deleteDraftSchema,
};
