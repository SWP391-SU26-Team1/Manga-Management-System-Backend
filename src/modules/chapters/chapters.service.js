const chaptersRepo = require('./chapters.repository');
const seriesRepo = require('../series/series.repository');
const AppError = require('../../utils/appError');

const listChapters = async (filters) => chaptersRepo.findAll(filters);

const getChapterById = async (chapterId) => {
  const chapter = await chaptersRepo.findById(chapterId);
  if (!chapter) throw new AppError('Chapter not found', 404);
  return chapter;
};

const getChapterDetail = async (chapterId) => {
  const chapter = await chaptersRepo.findByIdWithDetail(chapterId);
  if (!chapter) throw new AppError('Chapter not found', 404);
  return chapter;
};

const createChapter = async (payload) => {
  const seriesExists = await seriesRepo.existsById(payload.series_id);
  if (!seriesExists) throw new AppError('Series not found', 404);

  const duplicate = await chaptersRepo.findBySeriesAndNumber(payload.series_id, payload.chapter_number);
  if (duplicate) throw new AppError('Chapter number already exists in this series', 409);

  return chaptersRepo.create({ ...payload, view_count: 0 });
};

const updateChapter = async (chapterId, payload) => {
  const chapter = await chaptersRepo.findById(chapterId);
  if (!chapter) throw new AppError('Chapter not found', 404);

  if (payload.chapter_number && payload.chapter_number !== chapter.chapter_number) {
    const duplicate = await chaptersRepo.findBySeriesAndNumber(chapter.series_id, payload.chapter_number);
    if (duplicate) throw new AppError('Chapter number already exists in this series', 409);
  }

  return chaptersRepo.update(chapterId, { ...payload, updated_at: new Date().toISOString() });
};

const updateChapterStatus = async (chapterId, status) => {
  const chapter = await chaptersRepo.findById(chapterId);
  if (!chapter) throw new AppError('Chapter not found', 404);

  if (status === 'published') {
    const series = await seriesRepo.findById(chapter.series_id);
    if (!series || series.status !== 'published') {
      throw new AppError('Cannot publish chapter: series is not published', 400);
    }
  }

  return chaptersRepo.update(chapterId, { status, updated_at: new Date().toISOString() });
};

const deleteChapter = async (chapterId) => {
  const chapter = await chaptersRepo.findById(chapterId);
  if (!chapter) throw new AppError('Chapter not found', 404);
  await chaptersRepo.deleteById(chapterId);
};

module.exports = { listChapters, getChapterById, getChapterDetail, createChapter, updateChapter, updateChapterStatus, deleteChapter };
