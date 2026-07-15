const seriesRepo = require('./series.repository');
const AppError = require('../../utils/appError');

const listSeries = async (filters) => seriesRepo.findAll(filters);

const getSeriesById = async (seriesId) => {
  const series = await seriesRepo.findById(seriesId);
  if (!series) throw new AppError('Series not found', 404);
  return series;
};

const getSeriesDetail = async (seriesId) => {
  const series = await seriesRepo.findByIdWithDetail(seriesId);
  if (!series) throw new AppError('Series not found', 404);
  
  let total_views = 0;
  let total_likes = 0;

  if (series.chapter && Array.isArray(series.chapter)) {
    series.chapter.forEach(ch => {
      total_views += (ch.view_count || 0);
      total_likes += (ch.chapter_like ? ch.chapter_like.length : 0);
      delete ch.chapter_like;
    });
  }

  return { ...series, total_views, total_likes };
};

const createSeries = async (payload) => {
  return seriesRepo.create({ ...payload, view_count: 0 });
};

const updateSeries = async (seriesId, payload) => {
  const series = await seriesRepo.findById(seriesId);
  if (!series) throw new AppError('Series not found', 404);
  return seriesRepo.update(seriesId, { ...payload, updated_at: new Date().toISOString() });
};

const updateSeriesStatus = async (seriesId, status) => {
  const series = await seriesRepo.findById(seriesId);
  if (!series) throw new AppError('Series not found', 404);
  return seriesRepo.update(seriesId, { status, updated_at: new Date().toISOString() });
};

const deleteSeries = async (seriesId) => {
  const series = await seriesRepo.findById(seriesId);
  if (!series) throw new AppError('Series not found', 404);
  await seriesRepo.deleteById(seriesId);
};

module.exports = { listSeries, getSeriesById, getSeriesDetail, createSeries, updateSeries, updateSeriesStatus, deleteSeries };
