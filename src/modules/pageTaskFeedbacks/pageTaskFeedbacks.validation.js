const { z } = require("zod");

const uuidParam = z.string().uuid({ message: "Invalid UUID" });

const createFeedbackSchema = z.object({
  body: z.object({
    submission_id: uuidParam,
    mangaka_id: uuidParam.optional(),
    assistant_id: uuidParam.optional(),
    content: z.string().min(1, "Content is required"),
  }),
});

const updateFeedbackSchema = z.object({
  params: z.object({ feedbackId: uuidParam }),
  body: z.object({
    content: z.string().min(1, "Content is required").optional(),
  }),
});

const updateFeedbackStatusSchema = z.object({
  params: z.object({ feedbackId: uuidParam }),
  body: z.object({ status: z.string().min(1) }),
});

const feedbackIdParamSchema = z.object({
  params: z.object({ feedbackId: uuidParam }),
});
const submissionIdParamSchema = z.object({
  params: z.object({ submissionId: uuidParam }),
});
const listFeedbacksSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.string().optional(),
  }),
});

module.exports = {
  createFeedbackSchema,
  updateFeedbackSchema,
  updateFeedbackStatusSchema,
  feedbackIdParamSchema,
  submissionIdParamSchema,
  listFeedbacksSchema,
};
