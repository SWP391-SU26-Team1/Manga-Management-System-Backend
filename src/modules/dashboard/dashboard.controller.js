const service = require('./dashboard.service');
const { sendSuccess } = require('../../utils/response');

const getOverview = async (req, res, next) => {
  try {
    const data = await service.getOverview();
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getTaskSummary = async (req, res, next) => {
  try {
    const data = await service.getTaskSummary();
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getReviewSummary = async (req, res, next) => {
  try {
    const data = await service.getReviewSummary();
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getRankingSummary = async (req, res, next) => {
  try {
    const data = await service.getRankingSummary();
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getUserSummary = async (req, res, next) => {
  try {
    const data = await service.getUserSummary();
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

module.exports = { getOverview, getTaskSummary, getReviewSummary, getRankingSummary, getUserSummary };
