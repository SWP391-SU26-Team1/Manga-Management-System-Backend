const supabase = require('../../config/supabase');

const SELECT = `*,
  page:page_id(page_id, page_number, chapter_id),
  task:task_id(task_id, task_type, status),
  assistant:users!fk_page_submission_assistant(user_id, username, name, avatar_url)`;

const findAll = async ({ taskId, assistantId, submissionStatus, offset = 0, limit = 20 }) => {
  let query = supabase.from('page_submission').select(SELECT, { count: 'exact' });
  if (taskId) query = query.eq('task_id', taskId);
  if (assistantId) query = query.eq('assistant_id', assistantId);
  if (submissionStatus) query = query.eq('submission_status', submissionStatus);
  query = query.order('submitted_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const findById = async (submissionId) => {
  const { data, error } = await supabase
    .from('page_submission')
    .select(SELECT)
    .eq('submission_id', submissionId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase
    .from('page_submission')
    .insert(payload)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
};

const update = async (submissionId, payload) => {
  const { data, error } = await supabase
    .from('page_submission')
    .update(payload)
    .eq('submission_id', submissionId)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
};

module.exports = { findAll, findById, create, update };
