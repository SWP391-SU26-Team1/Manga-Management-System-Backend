const pagesRepo = require('./pages.repository');
const chaptersRepo = require('../chapters/chapters.repository');
const AppError = require('../../utils/appError');

const listPages = async (filters) => pagesRepo.findAll(filters);

const getPageById = async (pageId) => {
  const page = await pagesRepo.findById(pageId);
  if (!page) throw new AppError('Page not found', 404);
  return page;
};

const getPageDetail = async (pageId) => {
  const page = await pagesRepo.findByIdWithDetail(pageId);
  if (!page) throw new AppError('Page not found', 404);
  return page;
};

const createPage = async (payload) => {
  const chapterExists = await chaptersRepo.existsById(payload.chapter_id);
  if (!chapterExists) throw new AppError('Chapter not found', 404);

  const duplicate = await pagesRepo.findByChapterAndNumber(payload.chapter_id, payload.page_number);
  if (duplicate) throw new AppError('Page number already exists in this chapter', 409);

  return pagesRepo.create(payload);
};

const updatePage = async (pageId, payload) => {
  const page = await pagesRepo.findById(pageId);
  if (!page) throw new AppError('Page not found', 404);

  if (payload.page_number && payload.page_number !== page.page_number) {
    const duplicate = await pagesRepo.findByChapterAndNumber(page.chapter_id, payload.page_number);
    if (duplicate) throw new AppError('Page number already exists in this chapter', 409);
  }

  return pagesRepo.update(pageId, { ...payload, updated_at: new Date().toISOString() });
};

const updatePageStatus = async (pageId, status) => {
  const page = await pagesRepo.findById(pageId);
  if (!page) throw new AppError('Page not found', 404);
  return pagesRepo.update(pageId, { status, updated_at: new Date().toISOString() });
};

const deletePage = async (pageId) => {
  const page = await pagesRepo.findById(pageId);
  if (!page) throw new AppError('Page not found', 404);
  await pagesRepo.deleteById(pageId);
};

module.exports = { listPages, getPageById, getPageDetail, createPage, updatePage, updatePageStatus, deletePage };
