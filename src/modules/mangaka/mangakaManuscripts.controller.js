const service = require('./mangakaManuscripts.service');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const listManuscripts = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await service.listManuscripts(req.params.seriesId, { status: req.query.status, offset, limit });
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, total) });
  } catch (e) { next(e); }
};

const getManuscriptById = async (req, res, next) => {
  try {
    const data = await service.getManuscriptById(req.params.manuscriptId, req.params.seriesId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const createManuscript = async (req, res, next) => {
  try {
    const data = await service.createManuscript(req.params.seriesId, req.user.user_id, req.body);
    return sendSuccess(res, 201, data, 'Manuscript created');
  } catch (e) { next(e); }
};

const updateManuscript = async (req, res, next) => {
  try {
    const data = await service.updateManuscript(req.params.manuscriptId, req.params.seriesId, req.body);
    return sendSuccess(res, 200, data, 'Manuscript updated');
  } catch (e) { next(e); }
};

const workflow = (action) => async (req, res, next) => {
  try {
    const data = await service.performWorkflow(req.params.manuscriptId, req.params.seriesId, action, req.user.user_id);
    return sendSuccess(res, 200, data, `Manuscript ${action} successful`);
  } catch (e) { next(e); }
};

const deleteManuscript = async (req, res, next) => {
  try {
    const data = await service.deleteManuscript(req.params.manuscriptId, req.params.seriesId);
    return sendSuccess(res, 200, data, 'Manuscript deleted');
  } catch (e) { next(e); }
};

// Files
const listFiles = async (req, res, next) => {
  try {
    const data = await service.listFiles(req.params.manuscriptId, req.params.seriesId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const addFile = async (req, res, next) => {
  try {
    const data = await service.addFile(req.params.manuscriptId, req.params.seriesId, req.body);
    return sendSuccess(res, 201, data, 'File added');
  } catch (e) { next(e); }
};

const bulkAddFiles = async (req, res, next) => {
  try {
    const data = await service.bulkAddFiles(req.params.manuscriptId, req.params.seriesId, req.body.files);
    return sendSuccess(res, 201, data, 'Files added');
  } catch (e) { next(e); }
};

const updateFile = async (req, res, next) => {
  try {
    const data = await service.updateFile(req.params.manuscriptId, req.params.seriesId, req.params.fileId, req.body);
    return sendSuccess(res, 200, data, 'File updated');
  } catch (e) { next(e); }
};

const deleteFile = async (req, res, next) => {
  try {
    await service.deleteFile(req.params.manuscriptId, req.params.seriesId, req.params.fileId);
    return sendSuccess(res, 200, null, 'File deleted');
  } catch (e) { next(e); }
};

module.exports = { listManuscripts, getManuscriptById, createManuscript, updateManuscript, workflow, deleteManuscript, listFiles, addFile, bulkAddFiles, updateFile, deleteFile };
