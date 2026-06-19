const express = require("express");
const router = express.Router({ mergeParams: true });
const { validate } = require("../../middlewares/validate.middleware");
const { requireSeriesMembership } = require("./mangaka.middleware");
const validation = require("./mangakaRecoveryProposals.validation");
const ctrl = require("./mangakaRecoveryProposals.controller");

router.get("/", validate(validation.seriesIdParamSchema), ctrl.listMyProposals);
router.get(
  "/:proposalId",
  validate(validation.proposalIdParamSchema),
  ctrl.getProposalById,
);
router.post(
  "/",
  requireSeriesMembership,
  validate(validation.createRecoveryProposalSchema),
  ctrl.createProposal,
);

module.exports = router;
