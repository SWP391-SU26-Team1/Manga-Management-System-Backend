const periodsRepo = require('./rankingPeriods.repository');
const AppError = require('../../utils/appError');
const supabase = require('../../config/supabase');

const listPeriods = async () => periodsRepo.findAll();

const getPeriodById = async (periodId) => {
  const period = await periodsRepo.findById(periodId);
  if (!period) throw new AppError('Ranking period not found', 404);
  return period;
};

const createPeriod = async (payload) => {
  if (new Date(payload.end_date) < new Date(payload.start_date)) {
    throw new AppError('end_date must be on or after start_date', 400);
  }
  return periodsRepo.create(payload);
};

const updatePeriod = async (periodId, payload) => {
  const period = await periodsRepo.findById(periodId);
  if (!period) throw new AppError('Ranking period not found', 404);
  const start = payload.start_date || period.start_date;
  const end = payload.end_date || period.end_date;
  if (new Date(end) < new Date(start)) throw new AppError('end_date must be on or after start_date', 400);
  return periodsRepo.update(periodId, payload);
};

const updatePeriodStatus = async (periodId, status) => {
  const period = await periodsRepo.findById(periodId);
  if (!period) throw new AppError('Ranking period not found', 404);
  return periodsRepo.update(periodId, { status });
};

const calculateRanking = async (periodId) => {
  const period = await periodsRepo.findById(periodId);
  if (!period) throw new AppError('Ranking period not found', 404);

  await periodsRepo.update(periodId, { status: 'calculating' });

  // Fetch all chapters with view_count and likes
  const { data: chapters, error } = await supabase
    .from('chapter')
    .select('chapter_id, series_id, view_count, chapter_like(like_id)');

  if (error) throw error;

  const seriesScores = {};
  const chapterScores = {};

  const VIEW_WEIGHT = 1;
  const LIKE_WEIGHT = 2;

  for (const ch of chapters || []) {
    if (!ch.series_id) continue;
    
    const views = ch.view_count || 0;
    const likes = ch.chapter_like ? ch.chapter_like.length : 0;
    const score = (views * VIEW_WEIGHT) + (likes * LIKE_WEIGHT);

    // Chapter score
    chapterScores[ch.chapter_id] = {
      series_id: ch.series_id,
      score: score,
      views: views,
      likes: likes
    };

    // Aggregate for series
    if (!seriesScores[ch.series_id]) {
      seriesScores[ch.series_id] = { score: 0, views: 0, likes: 0 };
    }
    seriesScores[ch.series_id].score += score;
    seriesScores[ch.series_id].views += views;
    seriesScores[ch.series_id].likes += likes;
  }

  const seriesRankings = Object.entries(seriesScores)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([series_id, s], i) => ({
      period_id: periodId,
      series_id,
      rank_position: i + 1,
      score: s.score,
      total_vote: s.likes,
    }));

  const chapterRankings = Object.entries(chapterScores)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([chapter_id, c], i) => ({
      period_id: periodId,
      series_id: c.series_id,
      chapter_id,
      rank_position: i + 1,
      score: c.score,
      total_vote: c.likes,
    }));

  if (seriesRankings.length > 0) {
    await supabase.from('series_ranking').upsert(seriesRankings, { onConflict: 'period_id,series_id' });
  }
  if (chapterRankings.length > 0) {
    await supabase.from('chapter_ranking').upsert(chapterRankings, { onConflict: 'period_id,chapter_id' });
  }

  return periodsRepo.update(periodId, { status: 'completed', calculated_at: new Date().toISOString() });
};

const deletePeriod = async (periodId) => {
  const period = await periodsRepo.findById(periodId);
  if (!period) throw new AppError('Ranking period not found', 404);
  await periodsRepo.deleteById(periodId);
};

module.exports = { listPeriods, getPeriodById, createPeriod, updatePeriod, updatePeriodStatus, calculateRanking, deletePeriod };
