const recoveryProposalsRepo = require("./mangakaRecoveryProposals.repository");
const seriesRepo = require("../series/series.repository");
const seriesMembersRepo = require("../seriesMembers/seriesMembers.repository");
const AppError = require("../../utils/appError");

const ensureSeriesMembership = async (seriesId, userId) => {
  const member = await seriesMembersRepo.findBySeriesAndUser(seriesId, userId);
  if (!member)
    throw new AppError(
      "Access denied: you are not a member of this series",
      403,
    );
  return member;
};

const createProposal = async (userId, seriesId, payload) => {
  const series = await seriesRepo.findById(seriesId);
  if (!series) throw new AppError("Series not found", 404);

  await ensureSeriesMembership(seriesId, userId);

  return recoveryProposalsRepo.create({
    ...payload,
    series_id: seriesId,
    created_by_user_id: userId,
    status: "pending",
  });
};

const listMyProposals = async (userId, seriesId) => {
  if (seriesId) {
    await ensureSeriesMembership(seriesId, userId);
  }
  return recoveryProposalsRepo.findAll({ userId, seriesId });
};

const getMyProposalById = async (userId, proposalId, seriesId) => {
  const proposal = await recoveryProposalsRepo.findById(proposalId);
  if (!proposal) throw new AppError("Recovery proposal not found", 404);
  if (proposal.created_by_user_id !== userId)
    throw new AppError("Access denied", 403);
  if (seriesId && proposal.series_id !== seriesId)
    throw new AppError("Recovery proposal not found", 404);
  return proposal;
};

module.exports = {
  createProposal,
  listMyProposals,
  getMyProposalById,
};
