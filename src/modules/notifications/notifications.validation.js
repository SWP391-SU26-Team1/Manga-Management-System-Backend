const { z } = require('zod');
const uuidParam = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  { message: 'Invalid UUID' },
);

const createNotificationSchema = z.object({
  body: z.object({
    user_id: uuidParam,
    title: z.string().min(1).max(255),
    content: z.string().optional(),
    type: z.string().max(50).optional(),
    is_read: z.boolean().default(false),
  }),
});

const updateNotificationSchema = z.object({
  params: z.object({ notificationId: uuidParam }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    content: z.string().optional(),
  }),
});

const notificationIdParamSchema = z.object({ params: z.object({ notificationId: uuidParam }) });
const userIdParamSchema = z.object({ params: z.object({ userId: uuidParam }) });

module.exports = { createNotificationSchema, updateNotificationSchema, notificationIdParamSchema, userIdParamSchema };
