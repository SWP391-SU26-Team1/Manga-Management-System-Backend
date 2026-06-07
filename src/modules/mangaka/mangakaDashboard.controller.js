const service = require('./mangakaDashboard.service');
const { sendSuccess } = require('../../utils/response');
const AppError = require('../../utils/appError');
const seriesMembersRepo = require('../seriesMembers/seriesMembers.repository');

const assertMemberMiddleware = async (req, res, next) => {
  const member = await seriesMembersRepo.findBySeriesAndUser(req.params.seriesId, req.user.user_id);
  if (!member) return next(new AppError('Access denied: not a series member', 403));
  next();
};

const getProgress = async (req, res, next) => {
  try {
    const data = await service.getSeriesProgress(req.user.user_id, req.params.seriesId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getWorkload = async (req, res, next) => {
  try {
    const data = await service.getWorkload(req.user.user_id, req.params.seriesId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getPerformance = async (req, res, next) => {
  try {
    const data = await service.getPerformance(req.user.user_id, req.params.seriesId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

module.exports = { assertMemberMiddleware, getProgress, getWorkload, getPerformance };
