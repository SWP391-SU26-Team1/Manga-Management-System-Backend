const supabase = require('../../config/supabase');

const create = async (payload) => {
  const { data, error } = await supabase
    .from('page_ai_suggestion')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

const findById = async (suggestionId) => {
  const { data, error } = await supabase
    .from('page_ai_suggestion')
    .select('*')
    .eq('suggestion_id', suggestionId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const findByIdWithDetail = async (suggestionId) => {
  const { data, error } = await supabase
    .from('page_ai_suggestion')
    .select(`
      *,
      page:page_id (*),
      region:region_id (*),
      task:task_id (*),
      requested_by:requested_by_id (user_id, username, email, role)
    `)
    .eq('suggestion_id', suggestionId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const countAttemptsByPage = async (pageId) => {
  const { count, error } = await supabase
    .from('page_ai_suggestion')
    .select('*', { count: 'exact', head: true })
    .eq('page_id', pageId)
    .is('task_id', null);
  if (error) throw error;
  return count || 0;
};

const countAttemptsByTask = async (taskId) => {
  const { count, error } = await supabase
    .from('page_ai_suggestion')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', taskId);
  if (error) throw error;
  return count || 0;
};

const update = async (suggestionId, payload) => {
  const { data, error } = await supabase
    .from('page_ai_suggestion')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('suggestion_id', suggestionId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

const updateCompleted = async (suggestionId, { resultData, processingTimeMs, aiModel }) => {
  const payload = {
    status: 'completed',
    result_data: resultData,
    processing_time_ms: processingTimeMs,
  };
  if (aiModel) {
    payload.ai_model = aiModel;
  }
  return update(suggestionId, payload);
};

const updateFailed = async (suggestionId, { errorMessage, processingTimeMs }) => {
  return update(suggestionId, {
    status: 'failed',
    result_data: { error: errorMessage },
    processing_time_ms: processingTimeMs,
  });
};

const markApplied = async (suggestionId) => {
  return update(suggestionId, {
    status: 'applied',
  });
};

const reject = async (suggestionId) => {
  return update(suggestionId, {
    status: 'rejected',
  });
};

const findOldFailedOrRejected = async (daysOld = 7) => {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('page_ai_suggestion')
    .select('*')
    .in('status', ['rejected', 'failed', 'cancelled'])
    .lt('created_at', cutoffDate);
  if (error) throw error;
  return data || [];
};

module.exports = {
  create,
  findById,
  findByIdWithDetail,
  countAttemptsByPage,
  countAttemptsByTask,
  update,
  updateCompleted,
  updateFailed,
  markApplied,
  reject,
  findOldFailedOrRejected,
};
