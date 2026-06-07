const supabase = require('../../config/supabase');

const ALLOWED_SORT = ['chapter_number', 'title', 'status', 'view_count', 'created_at'];

const findAll = async ({ status, keyword, seriesId, offset, limit, sort, order }) => {
  let query = supabase.from('chapter').select('*', { count: 'exact' });

  if (seriesId) query = query.eq('series_id', seriesId);
  if (status) query = query.eq('status', status);
  if (keyword) query = query.ilike('title', `%${keyword}%`);

  const sortCol = ALLOWED_SORT.includes(sort) ? sort : 'chapter_number';
  query = query.order(sortCol, { ascending: order !== 'desc' });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const findById = async (chapterId) => {
  const { data, error } = await supabase.from('chapter').select('*').eq('chapter_id', chapterId).maybeSingle();
  if (error) throw error;
  return data;
};

const findByIdWithDetail = async (chapterId) => {
  const { data, error } = await supabase.from('chapter').select('*, page(*)').eq('chapter_id', chapterId).maybeSingle();
  if (error) throw error;
  return data;
};

const findBySeriesAndNumber = async (seriesId, chapterNumber) => {
  const { data, error } = await supabase
    .from('chapter')
    .select('chapter_id')
    .eq('series_id', seriesId)
    .eq('chapter_number', chapterNumber)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('chapter').insert(payload).select('*').single();
  if (error) throw error;
  return data;
};

const update = async (chapterId, payload) => {
  const { data, error } = await supabase.from('chapter').update(payload).eq('chapter_id', chapterId).select('*').single();
  if (error) throw error;
  return data;
};

const deleteById = async (chapterId) => {
  const { error } = await supabase.from('chapter').delete().eq('chapter_id', chapterId);
  if (error) throw error;
};

const existsById = async (chapterId) => {
  const { data, error } = await supabase.from('chapter').select('chapter_id').eq('chapter_id', chapterId).maybeSingle();
  if (error) throw error;
  return !!data;
};

const existsBySeriesId = async (chapterId, seriesId) => {
  const { data, error } = await supabase
    .from('chapter')
    .select('chapter_id')
    .eq('chapter_id', chapterId)
    .eq('series_id', seriesId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
};

module.exports = { findAll, findById, findByIdWithDetail, findBySeriesAndNumber, create, update, deleteById, existsById, existsBySeriesId };
