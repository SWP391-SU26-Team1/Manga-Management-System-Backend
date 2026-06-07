const service = require('./chapterRankings.service');
const { sendSuccess } = require('../../utils/response');

const listRankings = async (req, res, next) => {
  try {
    const periodId = req.params.periodId;
    const seriesId = req.params.seriesId;
    const chapterId = req.params.chapterId;
    const data = await service.listRankings({ periodId, seriesId, chapterId });
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getRankingById = async (req, res, next) => {
  try {
    const data = await service.getRankingById(req.params.chapterRankingId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const createRanking = async (req, res, next) => {
  try {
    const data = await service.createRanking(req.body);
    return sendSuccess(res, 201, data, 'Chapter ranking created');
  } catch (error) { next(error); }
};

const updateRanking = async (req, res, next) => {
  try {
    const data = await service.updateRanking(req.params.chapterRankingId, req.body);
    return sendSuccess(res, 200, data, 'Chapter ranking updated');
  } catch (error) { next(error); }
};

const deleteRanking = async (req, res, next) => {
  try {
    await service.deleteRanking(req.params.chapterRankingId);
    return sendSuccess(res, 200, null, 'Chapter ranking deleted');
  } catch (error) { next(error); }
};

module.exports = { listRankings, getRankingById, createRanking, updateRanking, deleteRanking };
