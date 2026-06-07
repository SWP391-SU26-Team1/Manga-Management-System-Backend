const supabase = require('../../config/supabase');
const seriesRepo = require('../series/series.repository');
const chaptersRepo = require('../chapters/chapters.repository');
const manuscriptsRepo = require('../manuscripts/manuscripts.repository');
const reviewSessionsRepo = require('../reviewSessions/reviewSessions.repository');
const { createNotifications } = require('../../utils/notification.helper');
const AppError = require('../../utils/appError');

const processSessionResult = async (sessionId) => {
  const { data: votes, error } = await supabase.from('vote').select('score, decision, status').eq('session_id', sessionId);
  if (error) throw error;
  if (!votes || votes.length === 0) throw new AppError('No votes found for this session', 400);

  const submitted = votes.filter((v) => ['submitted', 'verified'].includes(v.status));
  const avgScore = submitted.length > 0 ? submitted.reduce((s, v) => s + (v.score || 0), 0) / submitted.length : 0;

  const decisionCount = submitted.reduce((acc, v) => { if (v.decision) acc[v.decision] = (acc[v.decision] ?? 0) + 1; return acc; }, {});
  const dominantDecision = Object.entries(decisionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'pending';

  await reviewSessionsRepo.update(sessionId, { status: 'completed', ended_at: new Date().toISOString() });

  return { session_id: sessionId, total_votes: submitted.length, avg_score: Math.round(avgScore * 10) / 10, decision_count: decisionCount, dominant_decision: dominantDecision };
};

const applyDecisionToSeries = async (seriesId, status, note) => {
  const series = await seriesRepo.findById(seriesId);
  if (!series) throw new AppError('Series not found', 404);
  const updated = await seriesRepo.update(seriesId, { status, updated_at: new Date().toISOString() });

  const { data: members } = await supabase.from('series_member').select('user_id').eq('series_id', seriesId);
  if (members?.length) {
    await createNotifications(members.map((m) => ({ userId: m.user_id, title: `Series ${status}`, content: note || `Series decision: ${status}`, type: 'decision_result' })));
  }
  return updated;
};

const applyDecisionToChapter = async (chapterId, status, note) => {
  const chapter = await chaptersRepo.findById(chapterId);
  if (!chapter) throw new AppError('Chapter not found', 404);
  return chaptersRepo.update(chapterId, { status, updated_at: new Date().toISOString() });
};

const applyDecisionToManuscript = async (manuscriptId, status, note) => {
  const m = await manuscriptsRepo.findById(manuscriptId);
  if (!m) throw new AppError('Manuscript not found', 404);
  return manuscriptsRepo.update(manuscriptId, { status, updated_at: new Date().toISOString() });
};

const getDecisionHistory = async (entityType, entityId) => {
  // Build decision history from review_sessions and votes
  const table = entityType === 'series' ? 'series_id' : entityType === 'chapter' ? 'chapter_id' : null;
  if (!table) throw new AppError('Invalid entity type', 400);

  const { data: sessions, error } = await supabase.from('review_session').select('*, votes:vote(*)').eq(table, entityId).order('created_at');
  if (error) throw error;
  return sessions || [];
};

module.exports = { processSessionResult, applyDecisionToSeries, applyDecisionToChapter, applyDecisionToManuscript, getDecisionHistory };
