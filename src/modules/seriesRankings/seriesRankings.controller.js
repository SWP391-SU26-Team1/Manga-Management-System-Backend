const service = require('./seriesRankings.service');
const { sendSuccess } = require('../../utils/response');

const listRankings = async (req, res, next) => {
  try {
    const periodId = req.params.periodId;
    const seriesId = req.params.seriesId;
    const data = await service.listRankings({ periodId, seriesId });
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getRankingById = async (req, res, next) => {
  try {
    const data = await service.getRankingById(req.params.seriesRankingId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const createRanking = async (req, res, next) => {
  try {
    const data = await service.createRanking(req.body);
    return sendSuccess(res, 201, data, 'Series ranking created');
  } catch (error) { next(error); }
};

const updateRanking = async (req, res, next) => {
  try {
    const data = await service.updateRanking(req.params.seriesRankingId, req.body);
    return sendSuccess(res, 200, data, 'Series ranking updated');
  } catch (error) { next(error); }
};

const deleteRanking = async (req, res, next) => {
  try {
    await service.deleteRanking(req.params.seriesRankingId);
    return sendSuccess(res, 200, null, 'Series ranking deleted');
  } catch (error) { next(error); }
};

module.exports = { listRankings, getRankingById, createRanking, updateRanking, deleteRanking };
