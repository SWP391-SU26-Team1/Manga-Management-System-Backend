const service = require('./reviewSessions.service');
const { sendSuccess } = require('../../utils/response');

const listSessions = async (req, res, next) => {
  try {
    const seriesId = req.params.seriesId;
    const chapterId = req.params.chapterId;
    const data = await service.listSessions({ seriesId, chapterId });
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getSessionById = async (req, res, next) => {
  try {
    const data = await service.getSessionById(req.params.sessionId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const createSession = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      created_by_user_id: req.user.user_id,
    };
    const data = await service.createSession(payload);
    return sendSuccess(res, 201, data, 'Review session created');
  } catch (error) { next(error); }
};

const updateSession = async (req, res, next) => {
  try {
    const data = await service.updateSession(req.params.sessionId, req.body);
    return sendSuccess(res, 200, data, 'Session updated');
  } catch (error) { next(error); }
};

const updateSessionStatus = async (req, res, next) => {
  try {
    const data = await service.updateSessionStatus(req.params.sessionId, req.body.status);
    return sendSuccess(res, 200, data, 'Status updated');
  } catch (error) { next(error); }
};

const workflowAction = (action) => async (req, res, next) => {
  try {
    const data = await service.performWorkflow(req.params.sessionId, action);
    return sendSuccess(res, 200, data, `Session ${action} successful`);
  } catch (error) { next(error); }
};

const deleteSession = async (req, res, next) => {
  try {
    await service.deleteSession(req.params.sessionId);
    return sendSuccess(res, 200, null, 'Session deleted');
  } catch (error) { next(error); }
};

module.exports = { listSessions, getSessionById, createSession, updateSession, updateSessionStatus, workflowAction, deleteSession };
