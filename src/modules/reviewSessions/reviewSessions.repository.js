const supabase = require('../../config/supabase');

const SELECT = `*,
  series:series_id(series_id, title),
  chapter:chapter_id(chapter_id, chapter_number, title),
  created_by:users!fk_review_created_by(user_id, username, name)`;

const findAll = async ({ seriesId, chapterId } = {}) => {
  let query = supabase.from('review_session').select(SELECT);
  if (seriesId) query = query.eq('series_id', seriesId);
  if (chapterId) query = query.eq('chapter_id', chapterId);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const findById = async (sessionId) => {
  const { data, error } = await supabase.from('review_session').select(SELECT).eq('session_id', sessionId).maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('review_session').insert(payload).select(SELECT).single();
  if (error) throw error;
  return data;
};

const update = async (sessionId, payload) => {
  const { data, error } = await supabase.from('review_session').update(payload).eq('session_id', sessionId).select(SELECT).single();
  if (error) throw error;
  return data;
};

const deleteById = async (sessionId) => {
  const { error } = await supabase.from('review_session').delete().eq('session_id', sessionId);
  if (error) throw error;
};

module.exports = { findAll, findById, create, update, deleteById };
