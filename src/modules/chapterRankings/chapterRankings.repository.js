const supabase = require('../../config/supabase');

const SELECT = `*,
  period:period_id(period_id, name),
  series:series_id(series_id, title),
  chapter:chapter_id(chapter_id, chapter_number, title)`;

const findAll = async ({ periodId, seriesId, chapterId } = {}) => {
  let query = supabase.from('chapter_ranking').select(SELECT);
  if (periodId) query = query.eq('period_id', periodId);
  if (seriesId) query = query.eq('series_id', seriesId);
  if (chapterId) query = query.eq('chapter_id', chapterId);
  query = query.order('rank_position', { ascending: true });
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const findById = async (chapterRankingId) => {
  const { data, error } = await supabase.from('chapter_ranking').select(SELECT).eq('chapter_ranking_id', chapterRankingId).maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('chapter_ranking').insert(payload).select(SELECT).single();
  if (error) throw error;
  return data;
};

const update = async (chapterRankingId, payload) => {
  const { data, error } = await supabase.from('chapter_ranking').update(payload).eq('chapter_ranking_id', chapterRankingId).select(SELECT).single();
  if (error) throw error;
  return data;
};

const deleteById = async (chapterRankingId) => {
  const { error } = await supabase.from('chapter_ranking').delete().eq('chapter_ranking_id', chapterRankingId);
  if (error) throw error;
};

module.exports = { findAll, findById, create, update, deleteById };
