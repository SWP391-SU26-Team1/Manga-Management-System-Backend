const { z } = require('zod');
const { MANUSCRIPT_FILE_STATUS } = require('../../constants/status');

const uuidParam = z.string().uuid({ message: 'Invalid UUID' });

const createFileSchema = z.object({
  body: z.object({
    manuscript_id: uuidParam,
    file_url: z.string().url(),
    file_type: z.string().max(50).optional(),
    file_name: z.string().max(255).optional(),
    description: z.string().optional(),
    status: z.enum(MANUSCRIPT_FILE_STATUS).default('uploaded'),
  }),
});

const updateFileSchema = z.object({
  params: z.object({ fileId: uuidParam }),
  body: z.object({
    file_name: z.string().max(255).optional(),
    description: z.string().optional(),
  }),
});

const updateFileStatusSchema = z.object({
  params: z.object({ fileId: uuidParam }),
  body: z.object({ status: z.enum(MANUSCRIPT_FILE_STATUS) }),
});

const fileIdParamSchema = z.object({ params: z.object({ fileId: uuidParam }) });
const manuscriptIdParamSchema = z.object({ params: z.object({ manuscriptId: uuidParam }) });

module.exports = { createFileSchema, updateFileSchema, updateFileStatusSchema, fileIdParamSchema, manuscriptIdParamSchema };
