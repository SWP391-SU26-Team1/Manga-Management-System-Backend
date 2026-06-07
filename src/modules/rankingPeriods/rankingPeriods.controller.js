const service = require('./rankingPeriods.service');
const { sendSuccess } = require('../../utils/response');

const listPeriods = async (req, res, next) => {
  try {
    const data = await service.listPeriods();
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getPeriodById = async (req, res, next) => {
  try {
    const data = await service.getPeriodById(req.params.periodId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const createPeriod = async (req, res, next) => {
  try {
    const data = await service.createPeriod(req.body);
    return sendSuccess(res, 201, data, 'Ranking period created');
  } catch (error) { next(error); }
};

const updatePeriod = async (req, res, next) => {
  try {
    const data = await service.updatePeriod(req.params.periodId, req.body);
    return sendSuccess(res, 200, data, 'Period updated');
  } catch (error) { next(error); }
};

const updatePeriodStatus = async (req, res, next) => {
  try {
    const data = await service.updatePeriodStatus(req.params.periodId, req.body.status);
    return sendSuccess(res, 200, data, 'Status updated');
  } catch (error) { next(error); }
};

const calculateRanking = async (req, res, next) => {
  try {
    const data = await service.calculateRanking(req.params.periodId);
    return sendSuccess(res, 200, data, 'Ranking calculated');
  } catch (error) { next(error); }
};

const deletePeriod = async (req, res, next) => {
  try {
    await service.deletePeriod(req.params.periodId);
    return sendSuccess(res, 200, null, 'Period deleted');
  } catch (error) { next(error); }
};

module.exports = { listPeriods, getPeriodById, createPeriod, updatePeriod, updatePeriodStatus, calculateRanking, deletePeriod };
