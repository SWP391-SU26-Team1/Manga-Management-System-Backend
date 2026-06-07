const supabase = require('../../config/supabase');

const SELECT = `*,
  user:user_id(user_id, username, name, avatar_url),
  page:page_id(page_id, page_number),
  region:region_id(region_id, x, y, width, height)`;

const findAll = async ({ pageId, taskId } = {}) => {
  let query = supabase.from('annotation').select(SELECT);
  if (pageId) query = query.eq('page_id', pageId);
  if (taskId) query = query.eq('task_id', taskId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const findById = async (annotationId) => {
  const { data, error } = await supabase.from('annotation').select(SELECT).eq('annotation_id', annotationId).maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('annotation').insert(payload).select(SELECT).single();
  if (error) throw error;
  return data;
};

const update = async (annotationId, payload) => {
  const { data, error } = await supabase.from('annotation').update(payload).eq('annotation_id', annotationId).select(SELECT).single();
  if (error) throw error;
  return data;
};

const deleteById = async (annotationId) => {
  const { error } = await supabase.from('annotation').delete().eq('annotation_id', annotationId);
  if (error) throw error;
};

module.exports = { findAll, findById, create, update, deleteById };
