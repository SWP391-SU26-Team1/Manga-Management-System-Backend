const service = require('./manuscriptFiles.service');
const { sendSuccess } = require('../../utils/response');

const listFiles = async (req, res, next) => {
  try {
    const manuscriptId = req.params.manuscriptId;
    const data = await service.listFiles({ manuscriptId });
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getFileById = async (req, res, next) => {
  try {
    const data = await service.getFileById(req.params.fileId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const createFile = async (req, res, next) => {
  try {
    const payload = req.params.manuscriptId
      ? { ...req.body, manuscript_id: req.params.manuscriptId }
      : req.body;
    const data = await service.createFile(payload);
    return sendSuccess(res, 201, data, 'File created');
  } catch (error) { next(error); }
};

const updateFile = async (req, res, next) => {
  try {
    const data = await service.updateFile(req.params.fileId, req.body);
    return sendSuccess(res, 200, data, 'File updated');
  } catch (error) { next(error); }
};

const updateFileStatus = async (req, res, next) => {
  try {
    const data = await service.updateFileStatus(req.params.fileId, req.body.status);
    return sendSuccess(res, 200, data, 'Status updated');
  } catch (error) { next(error); }
};

const deleteFile = async (req, res, next) => {
  try {
    await service.deleteFile(req.params.fileId);
    return sendSuccess(res, 200, null, 'File deleted');
  } catch (error) { next(error); }
};

module.exports = { listFiles, getFileById, createFile, updateFile, updateFileStatus, deleteFile };
