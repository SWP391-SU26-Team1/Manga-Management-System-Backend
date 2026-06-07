const supabase = require('../../config/supabase');

const SELECT = `*,
  page:page_id(*),
  region:region_id(*),
  assistant:users!fk_page_task_assistant(user_id, username, name, avatar_url),
  assigned_by:users!fk_page_task_assigned_by(user_id, username, name, avatar_url)`;

const ALLOWED_SORT = ['status', 'deadline', 'created_at', 'updated_at'];

const findAll = async ({ pageId, assistantId, status, offset, limit, sort, order }) => {
  let query = supabase.from('page_task').select(SELECT, { count: 'exact' });

  if (pageId) query = query.eq('page_id', pageId);
  if (assistantId) query = query.eq('assistant_id', assistantId);
  if (status) query = query.eq('status', status);

  const sortCol = ALLOWED_SORT.includes(sort) ? sort : 'created_at';
  query = query.order(sortCol, { ascending: order !== 'desc' });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const findById = async (taskId) => {
  const { data, error } = await supabase.from('page_task').select(SELECT).eq('task_id', taskId).maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('page_task').insert(payload).select(SELECT).single();
  if (error) throw error;
  return data;
};

const update = async (taskId, payload) => {
  const { data, error } = await supabase.from('page_task').update(payload).eq('task_id', taskId).select(SELECT).single();
  if (error) throw error;
  return data;
};

const deleteById = async (taskId) => {
  const { error } = await supabase.from('page_task').delete().eq('task_id', taskId);
  if (error) throw error;
};

module.exports = { findAll, findById, create, update, deleteById };
