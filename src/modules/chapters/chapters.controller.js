const service = require('./chapters.service');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const listChapters = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, keyword, sort, order } = req.query;
    const seriesId = req.params.seriesId;
    const { data, total } = await service.listChapters({ status, keyword, seriesId, offset, limit, sort, order });
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, total) });
  } catch (error) { next(error); }
};

const getChapterById = async (req, res, next) => {
  try {
    const data = await service.getChapterById(req.params.chapterId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getChapterDetail = async (req, res, next) => {
  try {
    const data = await service.getChapterDetail(req.params.chapterId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const createChapter = async (req, res, next) => {
  try {
    const payload = req.params.seriesId
      ? { ...req.body, series_id: req.params.seriesId }
      : req.body;
    const data = await service.createChapter(payload);
    return sendSuccess(res, 201, data, 'Chapter created');
  } catch (error) { next(error); }
};

const updateChapter = async (req, res, next) => {
  try {
    const data = await service.updateChapter(req.params.chapterId, req.body);
    return sendSuccess(res, 200, data, 'Chapter updated');
  } catch (error) { next(error); }
};

const updateChapterStatus = async (req, res, next) => {
  try {
    const data = await service.updateChapterStatus(req.params.chapterId, req.body.status);
    return sendSuccess(res, 200, data, 'Status updated');
  } catch (error) { next(error); }
};

const deleteChapter = async (req, res, next) => {
  try {
    await service.deleteChapter(req.params.chapterId);
    return sendSuccess(res, 200, null, 'Chapter deleted');
  } catch (error) { next(error); }
};

module.exports = { listChapters, getChapterById, getChapterDetail, createChapter, updateChapter, updateChapterStatus, deleteChapter };
