const manuscriptsRepo = require('../manuscripts/manuscripts.repository');
const manuscriptFilesRepo = require('../manuscriptFiles/manuscriptFiles.repository');
const { createNotification } = require('../../utils/notification.helper');
const supabase = require('../../config/supabase');
const AppError = require('../../utils/appError');

const MANUSCRIPT_WORKFLOW = {
  submit: { from: ['draft'], to: 'submitted' },
  approve: { from: ['submitted'], to: 'approved' },
  reject: { from: ['submitted'], to: 'rejected' },
  publish: { from: ['approved'], to: 'published' },
  archive: { from: ['published'], to: 'archived' },
  revise: { from: ['rejected'], to: 'draft' },
  withdraw: { from: ['submitted', 'approved'], to: 'draft' },
};

const listManuscripts = async (seriesId, filters) => {
  let query = supabase.from('manuscript').select('*', { count: 'exact' }).eq('series_id', seriesId);
  if (filters.status) query = query.eq('status', filters.status);
  query = query.order('created_at', { ascending: false }).range(filters.offset, filters.offset + filters.limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const getManuscriptById = async (manuscriptId, seriesId) => {
  const m = await manuscriptsRepo.findById(manuscriptId);
  if (!m || m.series_id !== seriesId) throw new AppError('Manuscript not found', 404);
  return m;
};

const createManuscript = async (seriesId, userId, payload) => {
  return manuscriptsRepo.create({ ...payload, series_id: seriesId, created_by: userId, status: 'draft' });
};

const updateManuscript = async (manuscriptId, seriesId, payload) => {
  await getManuscriptById(manuscriptId, seriesId);
  return manuscriptsRepo.update(manuscriptId, { ...payload, updated_at: new Date().toISOString() });
};

const performWorkflow = async (manuscriptId, seriesId, action, userId) => {
  const m = await getManuscriptById(manuscriptId, seriesId);
  const rule = MANUSCRIPT_WORKFLOW[action];
  if (!rule) throw new AppError('Unknown workflow action', 400);
  if (!rule.from.includes(m.status))
    throw new AppError(`Cannot perform '${action}' from status '${m.status}'`, 400);
  const updated = await manuscriptsRepo.update(manuscriptId, { status: rule.to, updated_at: new Date().toISOString() });

  if (action === 'submit') {
    await createNotification(userId, 'Manuscript submitted', `Manuscript "${m.title}" has been submitted for review.`, 'manuscript_submitted');
  }
  return updated;
};

const deleteManuscript = async (manuscriptId, seriesId) => {
  await getManuscriptById(manuscriptId, seriesId);
  return manuscriptsRepo.update(manuscriptId, { status: 'deleted', updated_at: new Date().toISOString() });
};

// --- Manuscript Files ---
const listFiles = async (manuscriptId, seriesId) => {
  await getManuscriptById(manuscriptId, seriesId);
  const { data, error } = await supabase.from('manuscript_file').select('*').eq('manuscript_id', manuscriptId).order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

const addFile = async (manuscriptId, seriesId, payload) => {
  await getManuscriptById(manuscriptId, seriesId);
  return manuscriptFilesRepo.create({ ...payload, manuscript_id: manuscriptId });
};

const bulkAddFiles = async (manuscriptId, seriesId, files) => {
  await getManuscriptById(manuscriptId, seriesId);
  const rows = files.map((f) => ({ ...f, manuscript_id: manuscriptId }));
  const { data, error } = await supabase.from('manuscript_file').insert(rows).select();
  if (error) throw error;
  return data;
};

const updateFile = async (manuscriptId, seriesId, fileId, payload) => {
  await getManuscriptById(manuscriptId, seriesId);
  const file = await manuscriptFilesRepo.findById(fileId);
  if (!file || file.manuscript_id !== manuscriptId) throw new AppError('File not found', 404);
  return manuscriptFilesRepo.update(fileId, { ...payload, updated_at: new Date().toISOString() });
};

const deleteFile = async (manuscriptId, seriesId, fileId) => {
  await getManuscriptById(manuscriptId, seriesId);
  const file = await manuscriptFilesRepo.findById(fileId);
  if (!file || file.manuscript_id !== manuscriptId) throw new AppError('File not found', 404);
  await manuscriptFilesRepo.deleteById(fileId);
};

module.exports = {
  listManuscripts, getManuscriptById, createManuscript, updateManuscript, performWorkflow, deleteManuscript,
  listFiles, addFile, bulkAddFiles, updateFile, deleteFile,
};
