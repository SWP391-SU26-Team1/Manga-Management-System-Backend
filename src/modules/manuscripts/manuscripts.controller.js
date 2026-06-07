const service = require('./manuscripts.service');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const listManuscripts = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const userId = req.params.userId;
    const seriesId = req.params.seriesId;
    const chapterId = req.params.chapterId;
    const { data, total } = await service.listManuscripts({ userId, seriesId, chapterId, offset, limit });
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, total) });
  } catch (error) { next(error); }
};

const getManuscriptById = async (req, res, next) => {
  try {
    const data = await service.getManuscriptById(req.params.manuscriptId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const createManuscript = async (req, res, next) => {
  try {
    const data = await service.createManuscript(req.body);
    return sendSuccess(res, 201, data, 'Manuscript created');
  } catch (error) { next(error); }
};

const updateManuscript = async (req, res, next) => {
  try {
    const data = await service.updateManuscript(req.params.manuscriptId, req.body);
    return sendSuccess(res, 200, data, 'Manuscript updated');
  } catch (error) { next(error); }
};

const updateManuscriptStatus = async (req, res, next) => {
  try {
    const data = await service.updateManuscriptStatus(req.params.manuscriptId, req.body.status);
    return sendSuccess(res, 200, data, 'Status updated');
  } catch (error) { next(error); }
};

const workflowAction = (action) => async (req, res, next) => {
  try {
    const data = await service.performWorkflow(req.params.manuscriptId, action);
    return sendSuccess(res, 200, data, `Manuscript ${action} successful`);
  } catch (error) { next(error); }
};

const deleteManuscript = async (req, res, next) => {
  try {
    await service.deleteManuscript(req.params.manuscriptId);
    return sendSuccess(res, 200, null, 'Manuscript deleted');
  } catch (error) { next(error); }
};

module.exports = { listManuscripts, getManuscriptById, createManuscript, updateManuscript, updateManuscriptStatus, workflowAction, deleteManuscript };
