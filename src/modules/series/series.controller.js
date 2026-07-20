const seriesService = require('./series.service');
const commentsService = require('../comments/comments.service');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const listSeries = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, genre, keyword, user_id, sort, order } = req.query;
    const { data, total } = await seriesService.listSeries({ status, genre, keyword, user_id, page, limit, offset, sort, order });
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, total) });
  } catch (error) {
    next(error);
  }
};

const getSeriesById = async (req, res, next) => {
  try {
    const data = await seriesService.getSeriesById(req.params.seriesId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) {
    next(error);
  }
};

const getSeriesDetail = async (req, res, next) => {
  try {
    const data = await seriesService.getSeriesDetail(req.params.seriesId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) {
    next(error);
  }
};

const createSeries = async (req, res, next) => {
  try {
    const data = await seriesService.createSeries(req.body);
    return sendSuccess(res, 201, data, 'Series created');
  } catch (error) {
    next(error);
  }
};

const updateSeries = async (req, res, next) => {
  try {
    const data = await seriesService.updateSeries(req.params.seriesId, req.body);
    return sendSuccess(res, 200, data, 'Series updated');
  } catch (error) {
    next(error);
  }
};

const updateSeriesStatus = async (req, res, next) => {
  try {
    const data = await seriesService.updateSeriesStatus(req.params.seriesId, req.body.status);
    return sendSuccess(res, 200, data, 'Status updated');
  } catch (error) {
    next(error);
  }
};

const listSeriesComments = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await commentsService.listCommentsBySeries({
      seriesId: req.params.seriesId,
      page,
      limit,
      offset,
    });
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, total) });
  } catch (error) {
    next(error);
  }
};

const deleteSeries = async (req, res, next) => {
  try {
    await seriesService.deleteSeries(req.params.seriesId);
    return sendSuccess(res, 200, null, 'Series deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSeries,
  getSeriesById,
  getSeriesDetail,
  createSeries,
  updateSeries,
  updateSeriesStatus,
  deleteSeries,
  listSeriesComments,
};
