const { z } = require('zod');
const uuidParam = z.string().uuid({ message: 'Invalid UUID' });

const createRegionSchema = z.object({
  body: z.object({
    page_id: uuidParam,
    x: z.number().int(),
    y: z.number().int(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
});

const updateRegionSchema = z.object({
  params: z.object({ regionId: uuidParam }),
  body: z.object({
    x: z.number().int().optional(),
    y: z.number().int().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }),
});

const regionIdParamSchema = z.object({ params: z.object({ regionId: uuidParam }) });
const pageIdParamSchema = z.object({ params: z.object({ pageId: uuidParam }) });

const deleteByPageSchema = z.object({
  params: z.object({ pageId: uuidParam, regionId: uuidParam }),
});

module.exports = { createRegionSchema, updateRegionSchema, regionIdParamSchema, pageIdParamSchema, deleteByPageSchema };
