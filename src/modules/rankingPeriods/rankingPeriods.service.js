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

  const { data: votes, error } = await supabase
    .from('vote')
    .select('session_id, score, review_session!fk_vote_session(series_id, chapter_id)')
    .eq('status', 'verified');

  if (error) throw error;

  const seriesScores = {};
  const chapterScores = {};

  for (const vote of votes || []) {
    const session = vote.review_session || vote['review_session!fk_vote_session'];
    if (!session) continue;
    const score = vote.score || 0;

    if (session.series_id) {
      if (!seriesScores[session.series_id]) seriesScores[session.series_id] = { total: 0, count: 0 };
      seriesScores[session.series_id].total += score;
      seriesScores[session.series_id].count += 1;
    }
    if (session.chapter_id) {
      if (!chapterScores[session.chapter_id]) chapterScores[session.chapter_id] = { total: 0, count: 0, series_id: session.series_id };
      chapterScores[session.chapter_id].total += score;
      chapterScores[session.chapter_id].count += 1;
    }
  }

  const seriesRankings = Object.entries(seriesScores)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([series_id, s], i) => ({
      period_id: periodId,
      series_id,
      rank_position: i + 1,
      score: s.count > 0 ? s.total / s.count : 0,
      total_vote: s.count,
    }));

  const chapterRankings = Object.entries(chapterScores)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([chapter_id, c], i) => ({
      period_id: periodId,
      series_id: c.series_id,
      chapter_id,
      rank_position: i + 1,
      score: c.count > 0 ? c.total / c.count : 0,
      total_vote: c.count,
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
