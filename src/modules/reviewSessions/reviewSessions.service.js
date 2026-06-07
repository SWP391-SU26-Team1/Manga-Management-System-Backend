const sessionsRepo = require('./reviewSessions.repository');
const seriesRepo = require('../series/series.repository');
const chaptersRepo = require('../chapters/chapters.repository');
const usersRepo = require('../users/users.repository');
const AppError = require('../../utils/appError');

const WORKFLOW = {
  start: { from: ['pending', 'paused'], to: 'in_progress', setStartedAt: true },
  pause: { from: ['in_progress'], to: 'paused' },
  complete: { from: ['in_progress'], to: 'completed' },
  finish: { from: ['completed'], to: 'finished', setEndedAt: true },
  cancel: { from: ['pending', 'in_progress', 'paused'], to: 'cancelled', setEndedAt: true },
};

const listSessions = async (filters) => sessionsRepo.findAll(filters);

const getSessionById = async (sessionId) => {
  const session = await sessionsRepo.findById(sessionId);
  if (!session) throw new AppError('Review session not found', 404);
  return session;
};

const createSession = async (payload) => {
  const seriesExists = await seriesRepo.existsById(payload.series_id);
  if (!seriesExists) throw new AppError('Series not found', 404);

  if (payload.chapter_id) {
    const belongs = await chaptersRepo.existsBySeriesId(payload.chapter_id, payload.series_id);
    if (!belongs) throw new AppError('Chapter does not belong to this series', 400);
  }

  if (payload.created_by_user_id) {
    const userExists = await usersRepo.existsById(payload.created_by_user_id);
    if (!userExists) throw new AppError('User not found', 404);
  }

  return sessionsRepo.create(payload);
};

const updateSession = async (sessionId, payload) => {
  const session = await sessionsRepo.findById(sessionId);
  if (!session) throw new AppError('Review session not found', 404);
  return sessionsRepo.update(sessionId, payload);
};

const updateSessionStatus = async (sessionId, status) => {
  const session = await sessionsRepo.findById(sessionId);
  if (!session) throw new AppError('Review session not found', 404);
  return sessionsRepo.update(sessionId, { status });
};

const performWorkflow = async (sessionId, action) => {
  const session = await sessionsRepo.findById(sessionId);
  if (!session) throw new AppError('Review session not found', 404);
  const rule = WORKFLOW[action];
  if (!rule) throw new AppError('Unknown workflow action', 400);
  if (!rule.from.includes(session.status)) {
    throw new AppError(`Cannot perform '${action}' from status '${session.status}'`, 400);
  }
  const update = { status: rule.to };
  if (rule.setStartedAt) update.started_at = new Date().toISOString();
  if (rule.setEndedAt) update.ended_at = new Date().toISOString();
  return sessionsRepo.update(sessionId, update);
};

const deleteSession = async (sessionId) => {
  const session = await sessionsRepo.findById(sessionId);
  if (!session) throw new AppError('Review session not found', 404);
  await sessionsRepo.deleteById(sessionId);
};

module.exports = { listSessions, getSessionById, createSession, updateSession, updateSessionStatus, performWorkflow, deleteSession };
