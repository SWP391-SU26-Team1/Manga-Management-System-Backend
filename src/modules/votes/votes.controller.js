const service = require('./votes.service');
const { sendSuccess } = require('../../utils/response');
const AppError = require('../../utils/appError');

const listVotes = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.params.userId;
    const data = await service.listVotes({ sessionId, userId });
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getVoteById = async (req, res, next) => {
  try {
    const data = await service.getVoteById(req.params.voteId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const createVote = async (req, res, next) => {
  try {
    const payload = req.params.sessionId
      ? { ...req.body, session_id: req.params.sessionId }
      : req.body;
    // Bind the authenticated user as the voter
    const data = await service.createVote({ ...payload, voter_id: req.user.user_id });
    return sendSuccess(res, 201, data, 'Vote created');
  } catch (error) { next(error); }
};

const updateVote = async (req, res, next) => {
  try {
    const vote = await service.getVoteById(req.params.voteId);
    if (req.user.role !== 'admin' && vote.voter_id !== req.user.user_id) {
      return next(new AppError('Forbidden: not your vote', 403));
    }
    const data = await service.updateVote(req.params.voteId, req.body);
    return sendSuccess(res, 200, data, 'Vote updated');
  } catch (error) { next(error); }
};

const updateVoteStatus = async (req, res, next) => {
  try {
    const data = await service.updateVoteStatus(req.params.voteId, req.body.status);
    return sendSuccess(res, 200, data, 'Status updated');
  } catch (error) { next(error); }
};

const deleteVote = async (req, res, next) => {
  try {
    await service.deleteVote(req.params.voteId);
    return sendSuccess(res, 200, null, 'Vote deleted');
  } catch (error) { next(error); }
};

module.exports = { listVotes, getVoteById, createVote, updateVote, updateVoteStatus, deleteVote };
