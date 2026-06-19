const { z } = require("zod");

const uuid = z.string().uuid({ message: "Invalid UUID" });

const createRecoveryProposalSchema = z.object({
  params: z.object({ seriesId: uuid }),
  body: z.object({
    title: z.string().min(1).max(255),
    description: z.string().min(1),
  }),
});

const seriesIdParamSchema = z.object({ params: z.object({ seriesId: uuid }) });
const proposalIdParamSchema = z.object({
  params: z.object({ seriesId: uuid, proposalId: uuid }),
});

module.exports = {
  createRecoveryProposalSchema,
  seriesIdParamSchema,
  proposalIdParamSchema,
};
