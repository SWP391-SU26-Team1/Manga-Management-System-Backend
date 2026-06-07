const supabase = require('../../config/supabase');
const pageTasksRepo = require('../pageTasks/pageTasks.repository');
const pageTaskFeedbacksRepo = require('../pageTaskFeedbacks/pageTaskFeedbacks.repository');
const { createNotification } = require('../../utils/notification.helper');
const AppError = require('../../utils/appError');

const TASK_SELECT = `*,
  page:page_id(page_id, page_number, image_url, chapter:chapter_id(chapter_id, title, series:series_id(series_id, title))),
  users!fk_page_task_assigned_by(user_id, username, email)`;

const listMyTasks = async (userId, filters) => {
  let query = supabase
    .from('page_task')
    .select(TASK_SELECT, { count: 'exact' })
    .eq('assistant_id', userId);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.taskType) query = query.eq('task_type', filters.taskType);
  if (filters.deadlineBefore) query = query.lte('deadline', filters.deadlineBefore);
  if (filters.overdue === 'true') {
    query = query.lt('deadline', new Date().toISOString()).not('status', 'in', '("completed","cancelled","rejected")');
  }

  query = query.order('created_at', { ascending: false }).range(filters.offset, filters.offset + filters.limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const getMyTaskById = async (userId, taskId) => {
  const { data, error } = await supabase
    .from('page_task')
    .select(TASK_SELECT)
    .eq('task_id', taskId)
    .eq('assistant_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('Task not found or not assigned to you', 404);
  return data;
};

const getMyTaskDetail = async (userId, taskId) => {
  const task = await getMyTaskById(userId, taskId);
  const pageId = task.page_id;

  const [{ data: regions }, { data: annotations }, { data: feedbacks }] = await Promise.all([
    supabase.from('page_region').select('*').eq('page_id', pageId),
    supabase.from('annotation').select('*').eq('page_id', pageId),
    supabase.from('page_task_feedback').select('*').eq('task_id', taskId).order('created_at', { ascending: true }),
  ]);

  return { ...task, regions: regions || [], annotations: annotations || [], feedbacks: feedbacks || [] };
};

const WORKFLOW = {
  start: { from: ['assigned'], to: 'in_progress' },
  submit: { from: ['in_progress', 'needs_revision'], to: 'submitted' },
  resubmit: { from: ['in_progress', 'needs_revision', 'rejected'], to: 'submitted' },
  hold: { from: ['in_progress'], to: 'needs_revision' },
};

const performWorkflow = async (userId, taskId, action, content) => {
  const task = await getMyTaskById(userId, taskId);
  const rule = WORKFLOW[action];
  if (!rule) throw new AppError('Unknown workflow action', 400);
  if (!rule.from.includes(task.status))
    throw new AppError(`Cannot perform '${action}' from status '${task.status}'`, 400);

  const updated = await pageTasksRepo.update(taskId, { status: rule.to, updated_at: new Date().toISOString() });

  if ((action === 'submit' || action === 'resubmit') && task.assigned_by) {
    if (content) {
      await pageTaskFeedbacksRepo.create({
        task_id: taskId,
        mangaka_id: task.assigned_by,
        assistant_id: userId,
        feedback_content: content,
        feedback_type: 'submission_note',
        status: 'pending',
      });
    }
    await createNotification(task.assigned_by, 'Task submitted', `A task has been submitted for review.`, 'task_submitted');
  }

  return updated;
};

module.exports = { listMyTasks, getMyTaskById, getMyTaskDetail, performWorkflow };
