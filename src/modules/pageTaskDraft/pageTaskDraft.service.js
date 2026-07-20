const pageTaskDraftRepo = require('./pageTaskDraft.repository');
const pageTasksRepo = require('../pageTasks/pageTasks.repository');
const AppError = require('../../utils/appError');

const formatDraftResponse = (draft) => {
  if (!draft) return null;
  return {
    draftId: draft.draft_id,
    taskId: draft.task_id,
    imageUrl: draft.image_url,
    canvasState: draft.canvas_state,
  };
};

const getDraft = async (taskId, userId) => {
  const task = await pageTasksRepo.findById(taskId);
  if (!task) {
    throw new AppError('Page task not found', 404);
  }

  // Authorization: only the assigned assistant can retrieve their draft
  if (task.assistant_id !== userId) {
    throw new AppError('Forbidden: you are not assigned to this task', 403);
  }

  const draft = await pageTaskDraftRepo.findByTaskAndUser(taskId, userId);
  return formatDraftResponse(draft);
};

const saveDraft = async (taskId, userId, { imageUrl, canvasState }) => {
  const task = await pageTasksRepo.findById(taskId);
  if (!task) {
    throw new AppError('Page task not found', 404);
  }

  // Authorization: only the assigned assistant can save draft
  if (task.assistant_id !== userId) {
    throw new AppError('Forbidden: you are not assigned to this task', 403);
  }

  const draft = await pageTaskDraftRepo.upsertDraft(taskId, userId, { imageUrl, canvasState });
  return formatDraftResponse(draft);
};

const deleteDraft = async (taskId, userId) => {
  const task = await pageTasksRepo.findById(taskId);
  if (!task) {
    throw new AppError('Page task not found', 404);
  }

  // Authorization: only the assigned assistant can delete draft
  if (task.assistant_id !== userId) {
    throw new AppError('Forbidden: you are not assigned to this task', 403);
  }

  await pageTaskDraftRepo.deleteDraft(taskId, userId);
};

module.exports = {
  getDraft,
  saveDraft,
  deleteDraft,
};
