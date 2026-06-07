const service = require('./mangakaChapters.service');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const listChapters = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status } = req.query;
    const { data, total } = await service.listChapters(req.params.seriesId, { status, offset, limit });
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, total) });
  } catch (e) { next(e); }
};

const getChapterById = async (req, res, next) => {
  try {
    const data = await service.getChapterById(req.params.chapterId, req.params.seriesId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getChapterDetail = async (req, res, next) => {
  try {
    const data = await service.getChapterDetail(req.params.chapterId, req.params.seriesId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const createChapter = async (req, res, next) => {
  try {
    const data = await service.createChapter(req.params.seriesId, req.body);
    return sendSuccess(res, 201, data, 'Chapter created');
  } catch (e) { next(e); }
};

const updateChapter = async (req, res, next) => {
  try {
    const data = await service.updateChapter(req.params.chapterId, req.params.seriesId, req.body);
    return sendSuccess(res, 200, data, 'Chapter updated');
  } catch (e) { next(e); }
};

const reorderChapter = async (req, res, next) => {
  try {
    const data = await service.reorderChapter(req.params.chapterId, req.params.seriesId, req.body.chapter_number);
    return sendSuccess(res, 200, data, 'Chapter reordered');
  } catch (e) { next(e); }
};

const workflow = (action) => async (req, res, next) => {
  try {
    const data = await service.performWorkflow(req.params.chapterId, req.params.seriesId, action);
    return sendSuccess(res, 200, data, `Chapter ${action} successful`);
  } catch (e) { next(e); }
};

const copyFromChapter = async (req, res, next) => {
  try {
    const data = await service.copyFromChapter(req.params.seriesId, req.body.source_chapter_id, req.body);
    return sendSuccess(res, 201, data, 'Chapter copied');
  } catch (e) { next(e); }
};

const deleteChapter = async (req, res, next) => {
  try {
    const data = await service.deleteChapter(req.params.chapterId, req.params.seriesId);
    return sendSuccess(res, 200, data, 'Chapter deleted');
  } catch (e) { next(e); }
};

module.exports = { listChapters, getChapterById, getChapterDetail, createChapter, updateChapter, reorderChapter, workflow, copyFromChapter, deleteChapter };
