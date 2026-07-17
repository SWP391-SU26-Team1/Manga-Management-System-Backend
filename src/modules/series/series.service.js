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
  const unique_users = new Set();

  if (series.chapter && Array.isArray(series.chapter)) {
    series.chapter.forEach(ch => {
      total_views += (ch.view_count || 0);

      // Lọc 1 user = 1 like cho toàn bộ Series
      if (ch.chapter_like && Array.isArray(ch.chapter_like)) {
        // Gom user_id vào unique_users để tính tổng Like cho Series
        ch.chapter_like.forEach(like => {
          if (like.user_id) unique_users.add(like.user_id);
        });

        // THAY ĐỔI: Thay vì delete, hãy map nó thành 1 mảng user_id đơn giản
        // để Frontend biết được user nào đã like chapter này
        ch.chapter_like = ch.chapter_like.map(like => like.user_id).filter(Boolean);
      }
    });
  }

  const total_likes = unique_users.size;

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
