const { z } = require('zod');
const uuidParam = z.string().uuid({ message: 'Invalid UUID' });

const createRegionSchema = z.object({
  body: z.object({
    page_id: uuidParam,
    x: z.number().int(),
    y: z.number().int(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    suggestion_id: uuidParam.optional(),
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

const bulkCreateRegionSchema = z.object({
  params: z.object({ pageId: uuidParam }),
  body: z.object({
    regions: z.array(z.object({
      x: z.number(),
      y: z.number(),
      width: z.number().positive(),
      height: z.number().positive(),
    }).passthrough()).min(1),
    suggestion_id: uuidParam.optional(),
  }),
});

module.exports = { 
  createRegionSchema, 
  updateRegionSchema, 
  regionIdParamSchema, 
  pageIdParamSchema, 
  deleteByPageSchema,
  bulkCreateRegionSchema
};
