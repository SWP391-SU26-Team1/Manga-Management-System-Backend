const feedbackRepo = require('./pageTaskFeedbacks.repository');
const tasksRepo = require('../pageTasks/pageTasks.repository');
const usersRepo = require('../users/users.repository');
const AppError = require('../../utils/appError');

const listFeedbacks = async () => feedbackRepo.findAll();

const getFeedbackById = async (feedbackId) => {
  const feedback = await feedbackRepo.findById(feedbackId);
  if (!feedback) throw new AppError('Feedback not found', 404);
  return feedback;
};

const getFeedbacksByTask = async (taskId) => {
  const task = await tasksRepo.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);
  return feedbackRepo.findByTaskId(taskId);
};

const createFeedback = async (payload) => {
  const task = await tasksRepo.findById(payload.task_id);
  if (!task) throw new AppError('Task not found', 404);

  if (payload.mangaka_id) {
    const exists = await usersRepo.existsById(payload.mangaka_id);
    if (!exists) throw new AppError('Mangaka user not found', 404);
  }
  if (payload.assistant_id) {
    const exists = await usersRepo.existsById(payload.assistant_id);
    if (!exists) throw new AppError('Assistant user not found', 404);
  }

  return feedbackRepo.create(payload);
};

const updateFeedback = async (feedbackId, payload) => {
  const feedback = await feedbackRepo.findById(feedbackId);
  if (!feedback) throw new AppError('Feedback not found', 404);
  return feedbackRepo.update(feedbackId, payload);
};

const updateFeedbackStatus = async (feedbackId, status) => {
  const feedback = await feedbackRepo.findById(feedbackId);
  if (!feedback) throw new AppError('Feedback not found', 404);
  return feedbackRepo.update(feedbackId, { status });
};

const deleteFeedback = async (feedbackId) => {
  const feedback = await feedbackRepo.findById(feedbackId);
  if (!feedback) throw new AppError('Feedback not found', 404);
  await feedbackRepo.deleteById(feedbackId);
};

module.exports = { listFeedbacks, getFeedbackById, getFeedbacksByTask, createFeedback, updateFeedback, updateFeedbackStatus, deleteFeedback };
