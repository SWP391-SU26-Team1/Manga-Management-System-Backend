const supabase = require('../../config/supabase');

const SELECT = `*,
  mangaka:users!fk_manuscript_mangaka(user_id, username, name),
  series:series_id(series_id, title),
  chapter:chapter_id(chapter_id, chapter_number, title)`;

const findAll = async ({ userId, seriesId, chapterId, offset = 0, limit = 10, requestingUser } = {}) => {
  let query = supabase.from('manuscript').select(SELECT, { count: 'exact' });
  if (requestingUser && requestingUser.role === 'editor') {
    const { data: memberships } = await supabase
      .from('series_member')
      .select('series_id')
      .eq('user_id', requestingUser.user_id)
      .in('role_in_series', ['editor', 'pending_editor']);
      
    const seriesIds = (memberships || []).map(m => m.series_id);
    if (seriesIds.length === 0) {
      return { data: [], total: 0 };
    }
    query = query.in('series_id', seriesIds);
  }
  if (userId) query = query.eq('mangaka_id', userId);
  if (seriesId) query = query.eq('series_id', seriesId);
  if (chapterId) query = query.eq('chapter_id', chapterId);
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const findById = async (manuscriptId) => {
  const { data, error } = await supabase.from('manuscript').select(SELECT).eq('manuscript_id', manuscriptId).maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('manuscript').insert(payload).select(SELECT).single();
  if (error) throw error;
  return data;
};

const update = async (manuscriptId, payload) => {
  const { data, error } = await supabase.from('manuscript').update(payload).eq('manuscript_id', manuscriptId).select(SELECT).single();
  if (error) throw error;
  return data;
};

const deleteById = async (manuscriptId) => {
  const { error } = await supabase.from('manuscript').delete().eq('manuscript_id', manuscriptId);
  if (error) throw error;
};

module.exports = { findAll, findById, create, update, deleteById };
