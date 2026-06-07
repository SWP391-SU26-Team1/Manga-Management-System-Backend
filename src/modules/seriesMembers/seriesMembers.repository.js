const supabase = require('../../config/supabase');

const SELECT = `*, series:series_id(series_id, title), users:user_id(user_id, username, name, avatar_url, role)`;

const findAll = async () => {
  const { data, error } = await supabase.from('series_member').select(SELECT);
  if (error) throw error;
  return data;
};

const findById = async (seriesMemberId) => {
  const { data, error } = await supabase.from('series_member').select(SELECT).eq('series_member_id', seriesMemberId).maybeSingle();
  if (error) throw error;
  return data;
};

const findBySeriesId = async (seriesId) => {
  const { data, error } = await supabase.from('series_member').select(SELECT).eq('series_id', seriesId);
  if (error) throw error;
  return data;
};

const findBySeriesAndUser = async (seriesId, userId) => {
  const { data, error } = await supabase
    .from('series_member')
    .select('series_member_id')
    .eq('series_id', seriesId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('series_member').insert(payload).select(SELECT).single();
  if (error) throw error;
  return data;
};

const update = async (seriesMemberId, payload) => {
  const { data, error } = await supabase.from('series_member').update(payload).eq('series_member_id', seriesMemberId).select(SELECT).single();
  if (error) throw error;
  return data;
};

const deleteById = async (seriesMemberId) => {
  const { error } = await supabase.from('series_member').delete().eq('series_member_id', seriesMemberId);
  if (error) throw error;
};

const deleteBySeriesAndUser = async (seriesId, userId) => {
  const { error } = await supabase.from('series_member').delete().eq('series_id', seriesId).eq('user_id', userId);
  if (error) throw error;
};

module.exports = { findAll, findById, findBySeriesId, findBySeriesAndUser, create, update, deleteById, deleteBySeriesAndUser };
