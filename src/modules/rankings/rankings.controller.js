const svc = require('./rankings.service');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const listPeriods = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await svc.listPeriods({ status: req.query.status, offset, limit });
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, total) });
  } catch (e) { next(e); }
};

const getPeriodById = async (req, res, next) => {
  try { return sendSuccess(res, 200, await svc.getPeriodById(req.params.periodId), 'Success'); } catch (e) { next(e); }
};

const createPeriod = async (req, res, next) => {
  try { return sendSuccess(res, 201, await svc.createPeriod(req.body), 'Period created'); } catch (e) { next(e); }
};

const updatePeriod = async (req, res, next) => {
  try { return sendSuccess(res, 200, await svc.updatePeriod(req.params.periodId, req.body), 'Period updated'); } catch (e) { next(e); }
};

const updatePeriodStatus = async (req, res, next) => {
  try { return sendSuccess(res, 200, await svc.updatePeriodStatus(req.params.periodId, req.body.status), 'Status updated'); } catch (e) { next(e); }
};

const deletePeriod = async (req, res, next) => {
  try { await svc.deletePeriod(req.params.periodId); return sendSuccess(res, 200, null, 'Period deleted'); } catch (e) { next(e); }
};

const calculateRankings = async (req, res, next) => {
  try { return sendSuccess(res, 200, await svc.calculateRankings(req.params.periodId), 'Rankings calculated'); } catch (e) { next(e); }
};

const recalculate = async (req, res, next) => {
  try { return sendSuccess(res, 200, await svc.calculateRankings(req.params.periodId), 'Rankings recalculated'); } catch (e) { next(e); }
};

const getPeriodSummary = async (req, res, next) => {
  try { return sendSuccess(res, 200, await svc.getPeriodSummary(req.params.periodId), 'Success'); } catch (e) { next(e); }
};

const getTopSeries = async (req, res, next) => {
  try {
    console.log("DEBUG getTopSeries req.user:", req.user);
    const editorId = req.user && req.user.role === 'editor' ? req.user.user_id : null;
    console.log("DEBUG getTopSeries editorId:", editorId);
    const data = await svc.getTopSeries({ 
      periodId: req.query.period_id, 
      status: req.query.status, 
      genre: req.query.genre, 
      limit: Number(req.query.limit) || 20,
      editorId 
    });
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getTopChapters = async (req, res, next) => {
  try {
    const data = await svc.getTopChapters({ periodId: req.query.period_id, limit: Number(req.query.limit) || 20 });
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getSeriesHistory = async (req, res, next) => {
  try { return sendSuccess(res, 200, await svc.getSeriesHistory(req.params.seriesId), 'Success'); } catch (e) { next(e); }
};

const getChapterHistory = async (req, res, next) => {
  try { return sendSuccess(res, 200, await svc.getChapterHistory(req.params.chapterId), 'Success'); } catch (e) { next(e); }
};

const getSeriesTrend = async (req, res, next) => {
  try { return sendSuccess(res, 200, await svc.getSeriesTrend(req.params.seriesId), 'Success'); } catch (e) { next(e); }
};

const checkSeriesRisk = async (req, res, next) => {
  try { return sendSuccess(res, 200, await svc.checkSeriesRisk(req.params.seriesId), 'Success'); } catch (e) { next(e); }
};

const sendRiskWarning = async (req, res, next) => {
  try { return sendSuccess(res, 200, await svc.sendRiskWarning(req.params.seriesId), 'Warning sent'); } catch (e) { next(e); }
};

const checkRiskAll = async (req, res, next) => {
  try { return sendSuccess(res, 200, await svc.checkRiskAll(), 'Risk check complete'); } catch (e) { next(e); }
};

const exportPeriod = async (req, res, next) => {
  try {
    const summary = await svc.getPeriodSummary(req.params.periodId);
    const period = await svc.getPeriodById(req.params.periodId);
    return sendSuccess(res, 200, { period, ...summary }, 'Export ready');
  } catch (e) { next(e); }
};

module.exports = {
  listPeriods, getPeriodById, createPeriod, updatePeriod, updatePeriodStatus, deletePeriod,
  calculateRankings, recalculate, getPeriodSummary,
  getTopSeries, getTopChapters,
  getSeriesHistory, getChapterHistory,
  getSeriesTrend, checkSeriesRisk, sendRiskWarning, checkRiskAll,
  exportPeriod,
};
