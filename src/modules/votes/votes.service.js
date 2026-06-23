const votesRepo = require('./votes.repository');
const sessionsRepo = require('../reviewSessions/reviewSessions.repository');
const usersRepo = require('../users/users.repository');
const AppError = require('../../utils/appError');

const listVotes = async (filters) => votesRepo.findAll(filters);

const getVoteById = async (voteId) => {
  const vote = await votesRepo.findById(voteId);
  if (!vote) throw new AppError('Vote not found', 404);
  return vote;
};

const createVote = async (payload) => {
  const voterExists = await usersRepo.existsById(payload.voter_id);
  if (!voterExists) throw new AppError('Voter not found', 404);

  if (payload.session_id) {
    const session = await sessionsRepo.findById(payload.session_id);
    if (!session) throw new AppError('Review session not found', 404);
    if (session.status !== 'in_progress') throw new AppError('Can only vote on sessions that are in progress', 400);
  }

  if (payload.score !== null && payload.score !== undefined) {
    if (payload.score < 1 || payload.score > 10) throw new AppError('Score must be between 1 and 10', 400);
  }

  return votesRepo.create(payload);
};

const updateVote = async (voteId, payload) => {
  const vote = await votesRepo.findById(voteId);
  if (!vote) throw new AppError('Vote not found', 404);

  if (payload.score !== null && payload.score !== undefined) {
    if (payload.score < 1 || payload.score > 10) {
      throw new AppError('Score must be between 1 and 10', 400);
    }
  }

  return votesRepo.update(voteId, {
    ...payload,
    updated_at: new Date().toISOString(),
  });
};

const updateVoteStatus = async (voteId, status) => {
  const vote = await votesRepo.findById(voteId);
  if (!vote) throw new AppError('Vote not found', 404);
  return votesRepo.update(voteId, {
    status,
    updated_at: new Date().toISOString(),
  });
};

const deleteVote = async (voteId) => {
  const vote = await votesRepo.findById(voteId);
  if (!vote) throw new AppError('Vote not found', 404);
  await votesRepo.deleteById(voteId);
};

module.exports = { listVotes, getVoteById, createVote, updateVote, updateVoteStatus, deleteVote };
