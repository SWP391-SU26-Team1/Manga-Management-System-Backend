const rankingsRepo = require('./chapterRankings.repository');
const periodsRepo = require('../rankingPeriods/rankingPeriods.repository');
const seriesRepo = require('../series/series.repository');
const chaptersRepo = require('../chapters/chapters.repository');
const AppError = require('../../utils/appError');

const listRankings = async (filters) => rankingsRepo.findAll(filters);

const getRankingById = async (id) => {
  const r = await rankingsRepo.findById(id);
  if (!r) throw new AppError('Chapter ranking not found', 404);
  return r;
};

const createRanking = async (payload) => {
  const periodExists = await periodsRepo.existsById(payload.period_id);
  if (!periodExists) throw new AppError('Ranking period not found', 404);
  const seriesExists = await seriesRepo.existsById(payload.series_id);
  if (!seriesExists) throw new AppError('Series not found', 404);
  const chapterExists = await chaptersRepo.existsBySeriesId(payload.chapter_id, payload.series_id);
  if (!chapterExists) throw new AppError('Chapter not found in this series', 404);
  return rankingsRepo.create(payload);
};

const updateRanking = async (id, payload) => {
  const r = await rankingsRepo.findById(id);
  if (!r) throw new AppError('Chapter ranking not found', 404);
  return rankingsRepo.update(id, payload);
};

const deleteRanking = async (id) => {
  const r = await rankingsRepo.findById(id);
  if (!r) throw new AppError('Chapter ranking not found', 404);
  await rankingsRepo.deleteById(id);
};

module.exports = { listRankings, getRankingById, createRanking, updateRanking, deleteRanking };
