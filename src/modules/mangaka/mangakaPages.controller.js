const service = require('./mangakaPages.service');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const listPages = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await service.listPages(req.params.chapterId, { status: req.query.status, offset, limit });
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, total) });
  } catch (e) { next(e); }
};

const getPageById = async (req, res, next) => {
  try {
    const data = await service.getPageById(req.params.pageId, req.params.chapterId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getPageDetail = async (req, res, next) => {
  try {
    const data = await service.getPageDetail(req.params.pageId, req.params.chapterId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const createPage = async (req, res, next) => {
  try {
    const data = await service.createPage(req.params.chapterId, req.body);
    return sendSuccess(res, 201, data, 'Page created');
  } catch (e) { next(e); }
};

const bulkCreatePages = async (req, res, next) => {
  try {
    const data = await service.bulkCreatePages(req.params.chapterId, req.body.pages);
    return sendSuccess(res, 201, data, 'Pages created');
  } catch (e) { next(e); }
};

const updatePage = async (req, res, next) => {
  try {
    const data = await service.updatePage(req.params.pageId, req.params.chapterId, req.body);
    return sendSuccess(res, 200, data, 'Page updated');
  } catch (e) { next(e); }
};

const reorderPage = async (req, res, next) => {
  try {
    const data = await service.reorderPage(req.params.pageId, req.params.chapterId, req.body.page_number);
    return sendSuccess(res, 200, data, 'Page reordered');
  } catch (e) { next(e); }
};

const workflow = (action) => async (req, res, next) => {
  try {
    const data = await service.performWorkflow(req.params.pageId, req.params.chapterId, action);
    return sendSuccess(res, 200, data, `Page ${action} successful`);
  } catch (e) { next(e); }
};

const deletePage = async (req, res, next) => {
  try {
    const data = await service.deletePage(req.params.pageId, req.params.chapterId);
    return sendSuccess(res, 200, data, 'Page deleted');
  } catch (e) { next(e); }
};

module.exports = { listPages, getPageById, getPageDetail, createPage, bulkCreatePages, updatePage, reorderPage, workflow, deletePage };
