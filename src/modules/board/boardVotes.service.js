const supabase = require('../../config/supabase');
const votesRepo = require('../votes/votes.repository');
const AppError = require('../../utils/appError');

const listVotes = async (sessionId) => {
  const { data, error } = await supabase.from('vote').select('*, users:voter_id(user_id, username, email)').eq('session_id', sessionId).order('created_at');
  if (error) throw error;
  return data;
};

const createVote = async (sessionId, voterId, payload) => {
  const existing = await supabase.from('vote').select('vote_id').eq('session_id', sessionId).eq('voter_id', voterId).maybeSingle();
  if (existing.data) throw new AppError('You have already voted in this session', 409);
  if (payload.score !== undefined && (payload.score < 1 || payload.score > 10))
    throw new AppError('Score must be between 1 and 10', 400);
  return votesRepo.create({ ...payload, session_id: sessionId, voter_id: voterId });
};

const getVoteById = async (voteId) => {
  const vote = await votesRepo.findById(voteId);
  if (!vote) throw new AppError('Vote not found', 404);
  return vote;
};

const updateVote = async (voteId, payload) => {
  if (payload.score !== undefined && (payload.score < 1 || payload.score > 10))
    throw new AppError('Score must be between 1 and 10', 400);
  return votesRepo.update(voteId, { ...payload, updated_at: new Date().toISOString() });
};

const updateVoteStatus = async (voteId, status) => {
  return votesRepo.update(voteId, { status, updated_at: new Date().toISOString() });
};

const deleteVote = async (voteId) => {
  await votesRepo.deleteById(voteId);
};

module.exports = { listVotes, createVote, getVoteById, updateVote, updateVoteStatus, deleteVote };
