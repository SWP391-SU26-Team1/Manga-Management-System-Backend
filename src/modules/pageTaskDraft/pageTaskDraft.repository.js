const supabase = require('../../config/supabase');

const findByTaskAndUser = async (taskId, userId) => {
  const { data, error } = await supabase
    .from('page_task_draft')
    .select('*')
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const upsertDraft = async (taskId, userId, { imageUrl, canvasState }) => {
  const payload = {
    task_id: taskId,
    user_id: userId,
    image_url: imageUrl || null,
    canvas_state: canvasState || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('page_task_draft')
    .upsert(payload, { onConflict: 'task_id,user_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

const deleteDraft = async (taskId, userId) => {
  const { error } = await supabase
    .from('page_task_draft')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId);
  if (error) throw error;
};

module.exports = {
  findByTaskAndUser,
  upsertDraft,
  deleteDraft,
};
