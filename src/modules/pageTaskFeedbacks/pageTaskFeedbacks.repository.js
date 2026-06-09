const supabase = require('../../config/supabase');

const SELECT = `*,
  submission:submission_id(submission_id, submission_status, version_number),
  mangaka:users!fk_feedback_mangaka(user_id, username, name),
  assistant:users!fk_feedback_assistant(user_id, username, name)`;

const findAll = async () => {
  const { data, error } = await supabase.from('page_task_feedback').select(SELECT).order('created_at');
  if (error) throw error;
  return data;
};

const findById = async (feedbackId) => {
  const { data, error } = await supabase
    .from('page_task_feedback')
    .select(SELECT)
    .eq('feedback_id', feedbackId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const findBySubmissionId = async (submissionId) => {
  const { data, error } = await supabase
    .from('page_task_feedback')
    .select(SELECT)
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase
    .from('page_task_feedback')
    .insert(payload)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
};

const update = async (feedbackId, payload) => {
  const { data, error } = await supabase
    .from('page_task_feedback')
    .update(payload)
    .eq('feedback_id', feedbackId)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
};

const deleteById = async (feedbackId) => {
  const { error } = await supabase.from('page_task_feedback').delete().eq('feedback_id', feedbackId);
  if (error) throw error;
};

module.exports = { findAll, findById, findBySubmissionId, create, update, deleteById };
