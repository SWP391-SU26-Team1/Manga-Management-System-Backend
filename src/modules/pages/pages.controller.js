const service = require('./pages.service');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const listPages = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, sort, order } = req.query;
    const chapterId = req.params.chapterId;
    const { data, total } = await service.listPages({ chapterId, status, offset, limit, sort, order });
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, total) });
  } catch (error) { next(error); }
};

const getPageById = async (req, res, next) => {
  try {
    const data = await service.getPageById(req.params.pageId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getPageDetail = async (req, res, next) => {
  try {
    const data = await service.getPageDetail(req.params.pageId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const createPage = async (req, res, next) => {
  try {
    const payload = req.params.chapterId
      ? { ...req.body, chapter_id: req.params.chapterId }
      : req.body;
    const data = await service.createPage(payload);
    return sendSuccess(res, 201, data, 'Page created');
  } catch (error) { next(error); }
};

const updatePage = async (req, res, next) => {
  try {
    const data = await service.updatePage(req.params.pageId, req.body);
    return sendSuccess(res, 200, data, 'Page updated');
  } catch (error) { next(error); }
};

const updatePageStatus = async (req, res, next) => {
  try {
    const data = await service.updatePageStatus(req.params.pageId, req.body.status);
    return sendSuccess(res, 200, data, 'Status updated');
  } catch (error) { next(error); }
};

const deletePage = async (req, res, next) => {
  try {
    await service.deletePage(req.params.pageId);
    return sendSuccess(res, 200, null, 'Page deleted');
  } catch (error) { next(error); }
};

module.exports = { listPages, getPageById, getPageDetail, createPage, updatePage, updatePageStatus, deletePage };
