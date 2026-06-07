const { z } = require('zod');
const { MANUSCRIPT_STATUS } = require('../../constants/status');

const uuidParam = z.string().uuid({ message: 'Invalid UUID' });

const createManuscriptSchema = z.object({
  body: z.object({
    mangaka_id: uuidParam,
    series_id: uuidParam,
    chapter_id: uuidParam.optional(),
    title: z.string().max(255).optional(),
    content: z.string().optional(),
    file_url: z.string().url().optional(),
    status: z.enum(MANUSCRIPT_STATUS).default('draft'),
  }),
});

const updateManuscriptSchema = z.object({
  params: z.object({ manuscriptId: uuidParam }),
  body: z.object({
    title: z.string().max(255).optional(),
    content: z.string().optional(),
    file_url: z.string().url().optional(),
  }),
});

const updateManuscriptStatusSchema = z.object({
  params: z.object({ manuscriptId: uuidParam }),
  body: z.object({ status: z.enum(MANUSCRIPT_STATUS) }),
});

const manuscriptIdParamSchema = z.object({ params: z.object({ manuscriptId: uuidParam }) });

module.exports = {
  createManuscriptSchema,
  updateManuscriptSchema,
  updateManuscriptStatusSchema,
  manuscriptIdParamSchema,
};
