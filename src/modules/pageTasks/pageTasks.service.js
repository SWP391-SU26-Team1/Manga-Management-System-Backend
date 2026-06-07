const tasksRepo = require('./pageTasks.repository');
const pagesRepo = require('../pages/pages.repository');
const regionsRepo = require('../pageRegions/pageRegions.repository');
const usersRepo = require('../users/users.repository');
const AppError = require('../../utils/appError');

const WORKFLOW = {
  assign: { from: ['pending'], to: 'assigned' },
  start: { from: ['assigned'], to: 'in_progress' },
  submit: { from: ['in_progress', 'needs_revision'], to: 'submitted' },
  approve: { from: ['submitted', 'review'], to: 'approved' },
  'request-revision': { from: ['submitted', 'review'], to: 'needs_revision' },
  reject: { from: ['submitted', 'review', 'in_progress'], to: 'rejected' },
  cancel: { from: ['pending', 'assigned', 'in_progress', 'on_hold'], to: 'cancelled' },
  hold: { from: ['assigned', 'in_progress'], to: 'on_hold' },
};

const listTasks = async (filters) => tasksRepo.findAll(filters);

const getTaskById = async (taskId) => {
  const task = await tasksRepo.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);
  return task;
};

const createTask = async (payload) => {
  const pageExists = await pagesRepo.existsById(payload.page_id);
  if (!pageExists) throw new AppError('Page not found', 404);

  if (payload.region_id) {
    const belongs = await regionsRepo.existsByIdAndPageId(payload.region_id, payload.page_id);
    if (!belongs) throw new AppError('Region does not belong to this page', 400);
  }

  if (payload.assistant_id) {
    const assistant = await usersRepo.findById(payload.assistant_id);
    if (!assistant) throw new AppError('Assistant not found', 404);
    if (assistant.role !== 'assistant') throw new AppError('Assigned user is not an assistant', 400);
  }

  if (payload.assigned_by_id) {
    const assignedBy = await usersRepo.existsById(payload.assigned_by_id);
    if (!assignedBy) throw new AppError('Assigned by user not found', 404);
  }

  return tasksRepo.create({ ...payload, status: 'pending' });
};

const updateTask = async (taskId, payload) => {
  const task = await tasksRepo.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);

  if (payload.region_id) {
    const belongs = await regionsRepo.existsByIdAndPageId(payload.region_id, task.page_id);
    if (!belongs) throw new AppError('Region does not belong to this task page', 400);
  }

  if (payload.assistant_id) {
    const assistant = await usersRepo.findById(payload.assistant_id);
    if (!assistant || assistant.role !== 'assistant') throw new AppError('User is not an assistant', 400);
  }

  return tasksRepo.update(taskId, { ...payload, updated_at: new Date().toISOString() });
};

const updateTaskStatus = async (taskId, status) => {
  const task = await tasksRepo.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);
  return tasksRepo.update(taskId, { status, updated_at: new Date().toISOString() });
};

const performWorkflow = async (taskId, action) => {
  const task = await tasksRepo.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);

  const rule = WORKFLOW[action];
  if (!rule) throw new AppError('Unknown workflow action', 400);
  if (!rule.from.includes(task.status)) {
    throw new AppError(`Cannot perform '${action}' from status '${task.status}'`, 400);
  }

  return tasksRepo.update(taskId, { status: rule.to, updated_at: new Date().toISOString() });
};

const deleteTask = async (taskId) => {
  const task = await tasksRepo.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);
  await tasksRepo.deleteById(taskId);
};

module.exports = { listTasks, getTaskById, createTask, updateTask, updateTaskStatus, performWorkflow, deleteTask };
