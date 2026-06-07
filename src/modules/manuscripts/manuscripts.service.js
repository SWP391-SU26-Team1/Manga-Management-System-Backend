const manuscriptsRepo = require('./manuscripts.repository');
const usersRepo = require('../users/users.repository');
const seriesRepo = require('../series/series.repository');
const chaptersRepo = require('../chapters/chapters.repository');
const AppError = require('../../utils/appError');

const WORKFLOW = {
  submit: { from: ['draft', 'needs_revision'], to: 'submitted' },
  'start-review': { from: ['submitted'], to: 'in_review' },
  approve: { from: ['in_review'], to: 'approved' },
  'request-revision': { from: ['in_review'], to: 'needs_revision' },
  reject: { from: ['in_review', 'submitted'], to: 'rejected' },
  publish: { from: ['approved'], to: 'published' },
  archive: { from: ['published', 'approved'], to: 'archived' },
  hide: { from: ['published'], to: 'hidden' },
};

const listManuscripts = async (filters) => manuscriptsRepo.findAll(filters);

const getManuscriptById = async (manuscriptId) => {
  const m = await manuscriptsRepo.findById(manuscriptId);
  if (!m) throw new AppError('Manuscript not found', 404);
  return m;
};

const createManuscript = async (payload) => {
  const mangaka = await usersRepo.findById(payload.mangaka_id);
  if (!mangaka) throw new AppError('Mangaka user not found', 404);

  const seriesExists = await seriesRepo.existsById(payload.series_id);
  if (!seriesExists) throw new AppError('Series not found', 404);

  if (payload.chapter_id) {
    const belongs = await chaptersRepo.existsBySeriesId(payload.chapter_id, payload.series_id);
    if (!belongs) throw new AppError('Chapter does not belong to this series', 400);
  }

  return manuscriptsRepo.create(payload);
};

const updateManuscript = async (manuscriptId, payload) => {
  const m = await manuscriptsRepo.findById(manuscriptId);
  if (!m) throw new AppError('Manuscript not found', 404);
  return manuscriptsRepo.update(manuscriptId, { ...payload, updated_at: new Date().toISOString() });
};

const updateManuscriptStatus = async (manuscriptId, status) => {
  const m = await manuscriptsRepo.findById(manuscriptId);
  if (!m) throw new AppError('Manuscript not found', 404);
  return manuscriptsRepo.update(manuscriptId, { status, updated_at: new Date().toISOString() });
};

const performWorkflow = async (manuscriptId, action) => {
  const m = await manuscriptsRepo.findById(manuscriptId);
  if (!m) throw new AppError('Manuscript not found', 404);
  const rule = WORKFLOW[action];
  if (!rule) throw new AppError('Unknown workflow action', 400);
  if (!rule.from.includes(m.status)) {
    throw new AppError(`Cannot perform '${action}' from status '${m.status}'`, 400);
  }
  return manuscriptsRepo.update(manuscriptId, { status: rule.to, updated_at: new Date().toISOString() });
};

const deleteManuscript = async (manuscriptId) => {
  const m = await manuscriptsRepo.findById(manuscriptId);
  if (!m) throw new AppError('Manuscript not found', 404);
  await manuscriptsRepo.deleteById(manuscriptId);
};

module.exports = { listManuscripts, getManuscriptById, createManuscript, updateManuscript, updateManuscriptStatus, performWorkflow, deleteManuscript };
