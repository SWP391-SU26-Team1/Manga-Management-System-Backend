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
  return series;
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
