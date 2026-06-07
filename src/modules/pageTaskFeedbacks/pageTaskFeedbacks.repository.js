const supabase = require('../../config/supabase');

const SELECT = `*,
  task:task_id(task_id, task_type, status),
  mangaka:users!fk_feedback_mangaka(user_id, username, name),
  assistant:users!fk_feedback_assistant(user_id, username, name)`;

const findAll = async () => {
  const { data, error } = await supabase.from('page_task_feedback').select(SELECT);
  if (error) throw error;
  return data;
};

const findById = async (feedbackId) => {
  const { data, error } = await supabase.from('page_task_feedback').select(SELECT).eq('feedback_id', feedbackId).maybeSingle();
  if (error) throw error;
  return data;
};

const findByTaskId = async (taskId) => {
  const { data, error } = await supabase.from('page_task_feedback').select(SELECT).eq('task_id', taskId);
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('page_task_feedback').insert(payload).select(SELECT).single();
  if (error) throw error;
  return data;
};

const update = async (feedbackId, payload) => {
  const { data, error } = await supabase.from('page_task_feedback').update(payload).eq('feedback_id', feedbackId).select(SELECT).single();
  if (error) throw error;
  return data;
};

const deleteById = async (feedbackId) => {
  const { error } = await supabase.from('page_task_feedback').delete().eq('feedback_id', feedbackId);
  if (error) throw error;
};

module.exports = { findAll, findById, findByTaskId, create, update, deleteById };
