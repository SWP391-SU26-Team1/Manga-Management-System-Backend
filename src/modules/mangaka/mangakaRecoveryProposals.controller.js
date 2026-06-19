const recoveryProposalsService = require("./mangakaRecoveryProposals.service");
const { sendSuccess } = require("../../utils/response");

const listMyProposals = async (req, res, next) => {
  try {
    const data = await recoveryProposalsService.listMyProposals(
      req.user.user_id,
      req.params.seriesId,
    );
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const getProposalById = async (req, res, next) => {
  try {
    const data = await recoveryProposalsService.getMyProposalById(
      req.user.user_id,
      req.params.proposalId,
      req.params.seriesId,
    );
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const createProposal = async (req, res, next) => {
  try {
    const data = await recoveryProposalsService.createProposal(
      req.user.user_id,
      req.params.seriesId,
      req.body,
    );
    return sendSuccess(res, 201, data, "Recovery proposal created");
  } catch (e) {
    next(e);
  }
};

module.exports = {
  listMyProposals,
  getProposalById,
  createProposal,
};
