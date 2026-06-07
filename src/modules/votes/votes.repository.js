const supabase = require('../../config/supabase');

const SELECT = `*,
  voter:users!fk_vote_user(user_id, username, name),
  session:review_session!fk_vote_session(session_id, name, status)`;

const findAll = async ({ sessionId, userId } = {}) => {
  let query = supabase.from('vote').select(SELECT);
  if (sessionId) query = query.eq('session_id', sessionId);
  if (userId) query = query.eq('voter_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const findById = async (voteId) => {
  const { data, error } = await supabase.from('vote').select(SELECT).eq('vote_id', voteId).maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('vote').insert(payload).select(SELECT).single();
  if (error) throw error;
  return data;
};

const update = async (voteId, payload) => {
  const { data, error } = await supabase.from('vote').update(payload).eq('vote_id', voteId).select(SELECT).single();
  if (error) throw error;
  return data;
};

const deleteById = async (voteId) => {
  const { error } = await supabase.from('vote').delete().eq('vote_id', voteId);
  if (error) throw error;
};

module.exports = { findAll, findById, create, update, deleteById };
