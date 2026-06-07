const supabase = require('../../config/supabase');

const ALLOWED_SORT = ['page_number', 'status', 'created_at'];

const findAll = async ({ chapterId, status, offset, limit, sort, order }) => {
  let query = supabase.from('page').select('*', { count: 'exact' });

  if (chapterId) query = query.eq('chapter_id', chapterId);
  if (status) query = query.eq('status', status);

  const sortCol = ALLOWED_SORT.includes(sort) ? sort : 'page_number';
  query = query.order(sortCol, { ascending: order !== 'desc' });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const findById = async (pageId) => {
  const { data, error } = await supabase.from('page').select('*').eq('page_id', pageId).maybeSingle();
  if (error) throw error;
  return data;
};

const findByIdWithDetail = async (pageId) => {
  const { data, error } = await supabase
    .from('page')
    .select('*, page_region(*), page_task(*), annotation(*)')
    .eq('page_id', pageId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const findByChapterAndNumber = async (chapterId, pageNumber) => {
  const { data, error } = await supabase
    .from('page')
    .select('page_id')
    .eq('chapter_id', chapterId)
    .eq('page_number', pageNumber)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('page').insert(payload).select('*').single();
  if (error) throw error;
  return data;
};

const update = async (pageId, payload) => {
  const { data, error } = await supabase.from('page').update(payload).eq('page_id', pageId).select('*').single();
  if (error) throw error;
  return data;
};

const deleteById = async (pageId) => {
  const { error } = await supabase.from('page').delete().eq('page_id', pageId);
  if (error) throw error;
};

const existsById = async (pageId) => {
  const { data, error } = await supabase.from('page').select('page_id').eq('page_id', pageId).maybeSingle();
  if (error) throw error;
  return !!data;
};

module.exports = { findAll, findById, findByIdWithDetail, findByChapterAndNumber, create, update, deleteById, existsById };
