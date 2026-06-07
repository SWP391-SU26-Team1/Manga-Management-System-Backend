const filesRepo = require('./manuscriptFiles.repository');
const manuscriptsRepo = require('../manuscripts/manuscripts.repository');
const AppError = require('../../utils/appError');

const listFiles = async (filters) => filesRepo.findAll(filters);

const getFileById = async (fileId) => {
  const file = await filesRepo.findById(fileId);
  if (!file) throw new AppError('Manuscript file not found', 404);
  return file;
};

const getFilesByManuscript = async (manuscriptId) => {
  const m = await manuscriptsRepo.findById(manuscriptId);
  if (!m) throw new AppError('Manuscript not found', 404);
  return filesRepo.findAll({ manuscriptId });
};

const createFile = async (payload) => {
  const m = await manuscriptsRepo.findById(payload.manuscript_id);
  if (!m) throw new AppError('Manuscript not found', 404);
  return filesRepo.create(payload);
};

const updateFile = async (fileId, payload) => {
  const file = await filesRepo.findById(fileId);
  if (!file) throw new AppError('Manuscript file not found', 404);
  return filesRepo.update(fileId, payload);
};

const updateFileStatus = async (fileId, status) => {
  const file = await filesRepo.findById(fileId);
  if (!file) throw new AppError('Manuscript file not found', 404);
  return filesRepo.update(fileId, { status });
};

const deleteFile = async (fileId) => {
  const file = await filesRepo.findById(fileId);
  if (!file) throw new AppError('Manuscript file not found', 404);
  await filesRepo.deleteById(fileId);
};

module.exports = { listFiles, getFileById, getFilesByManuscript, createFile, updateFile, updateFileStatus, deleteFile };
