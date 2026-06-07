const service = require('./mangakaSeries.service');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const listMySeries = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, keyword } = req.query;
    const { data, total } = await service.listMySeries(req.user.user_id, { status, keyword, offset, limit });
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, total) });
  } catch (e) { next(e); }
};

const getSeriesById = async (req, res, next) => {
  try {
    const data = await service.getMySeriesById(req.user.user_id, req.params.seriesId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getSeriesDetail = async (req, res, next) => {
  try {
    const data = await service.getMySeriesDetail(req.user.user_id, req.params.seriesId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const createSeries = async (req, res, next) => {
  try {
    const data = await service.createSeries(req.user.user_id, req.body);
    return sendSuccess(res, 201, data, 'Series created');
  } catch (e) { next(e); }
};

const updateSeries = async (req, res, next) => {
  try {
    const data = await service.updateSeries(req.user.user_id, req.params.seriesId, req.body);
    return sendSuccess(res, 200, data, 'Series updated');
  } catch (e) { next(e); }
};

const updateSeriesStatus = async (req, res, next) => {
  try {
    const data = await service.updateSeriesStatus(req.user.user_id, req.params.seriesId, req.body.status);
    return sendSuccess(res, 200, data, 'Status updated');
  } catch (e) { next(e); }
};

const workflow = (action) => async (req, res, next) => {
  try {
    const data = await service.performWorkflow(req.user.user_id, req.params.seriesId, action);
    return sendSuccess(res, 200, data, `Series ${action} successful`);
  } catch (e) { next(e); }
};

const deleteSeries = async (req, res, next) => {
  try {
    const data = await service.deleteSeries(req.user.user_id, req.params.seriesId);
    return sendSuccess(res, 200, data, 'Series deleted');
  } catch (e) { next(e); }
};

// Members
const listMembers = async (req, res, next) => {
  try {
    const data = await service.listMembers(req.user.user_id, req.params.seriesId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const addMember = async (req, res, next) => {
  try {
    const data = await service.addMember(req.user.user_id, req.params.seriesId, req.body);
    return sendSuccess(res, 201, data, 'Member added');
  } catch (e) { next(e); }
};

const updateMember = async (req, res, next) => {
  try {
    const data = await service.updateMember(req.user.user_id, req.params.seriesId, req.params.seriesMemberId, req.body);
    return sendSuccess(res, 200, data, 'Member updated');
  } catch (e) { next(e); }
};

const removeMember = async (req, res, next) => {
  try {
    await service.removeMember(req.user.user_id, req.params.seriesId, req.params.seriesMemberId);
    return sendSuccess(res, 200, null, 'Member removed');
  } catch (e) { next(e); }
};

module.exports = {
  listMySeries, getSeriesById, getSeriesDetail,
  createSeries, updateSeries, updateSeriesStatus, workflow, deleteSeries,
  listMembers, addMember, updateMember, removeMember,
};
