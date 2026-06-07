const supabase = require('../../config/supabase');

const SELECT = `*,
  period:period_id(period_id, name),
  series:series_id(series_id, title, cover_image_url)`;

const findAll = async ({ periodId, seriesId } = {}) => {
  let query = supabase.from('series_ranking').select(SELECT);
  if (periodId) query = query.eq('period_id', periodId);
  if (seriesId) query = query.eq('series_id', seriesId);
  query = query.order('rank_position', { ascending: true });
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const findById = async (seriesRankingId) => {
  const { data, error } = await supabase.from('series_ranking').select(SELECT).eq('series_ranking_id', seriesRankingId).maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('series_ranking').insert(payload).select(SELECT).single();
  if (error) throw error;
  return data;
};

const update = async (seriesRankingId, payload) => {
  const { data, error } = await supabase.from('series_ranking').update(payload).eq('series_ranking_id', seriesRankingId).select(SELECT).single();
  if (error) throw error;
  return data;
};

const deleteById = async (seriesRankingId) => {
  const { error } = await supabase.from('series_ranking').delete().eq('series_ranking_id', seriesRankingId);
  if (error) throw error;
};

module.exports = { findAll, findById, create, update, deleteById };
