const votesSvc = require('./boardVotes.service');
const decisionsSvc = require('./boardDecisions.service');
const reviewSessionsRepo = require('../reviewSessions/reviewSessions.repository');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const supabase = require('../../config/supabase');
const AppError = require('../../utils/appError');

// --- Proposals / Review Sessions ---
const listProposals = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data: rawSessions, error, count } = await supabase
      .from('review_session')
      .select('*, series:series_id(*, series_member(*, users:user_id(*))), chapter:chapter_id(*, series:series_id(*, series_member(*, users:user_id(*))))', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    const data = (rawSessions || []).map(session => {
      const s = session.series || (session.chapter ? session.chapter.series : null) || {};
      const ownerMember = (s.series_member || []).find(m => m.role_in_series === 'owner');
      const authorName = ownerMember?.users?.name || ownerMember?.users?.username || 'N/A';
      return {
        ...session,
        series: {
          ...s,
          author: authorName,
          title: s.title || 'Unknown Title',
          cover_image_url: s.cover_image_url || 'https://images.unsplash.com/photo-1578632292335-df3f3e8f4c64?w=200&h=300&fit=crop'
        }
      };
    });

    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, count) });
  } catch (e) { next(e); }
}

const listPendingProposals = async (req, res, next) => {
  try {
    const { data: rawSessions, error } = await supabase
      .from('review_session')
      .select('*, series:series_id(*, series_member(*, users:user_id(*))), chapter:chapter_id(*, series:series_id(*, series_member(*, users:user_id(*))))')
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false });
    if (error) throw error;

    const data = (rawSessions || []).map(session => {
      const s = session.series || (session.chapter ? session.chapter.series : null) || {};
      const ownerMember = (s.series_member || []).find(m => m.role_in_series === 'owner');
      const authorName = ownerMember?.users?.name || ownerMember?.users?.username || 'N/A';
      return {
        ...session,
        series: {
          ...s,
          author: authorName,
          title: s.title || 'Unknown Title',
          cover_image_url: s.cover_image_url || 'https://images.unsplash.com/photo-1578632292335-df3f3e8f4c64?w=200&h=300&fit=crop'
        }
      };
    });

    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
}

const getProposalById = async (req, res, next) => {
  try {
    const data = await reviewSessionsRepo.findById(req.params.sessionId);
    if (!data) return next(new AppError('Session not found', 404));
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getProposalDetail = async (req, res, next) => {
  try {
    const session = await reviewSessionsRepo.findById(req.params.sessionId);
    if (!session) return next(new AppError('Session not found', 404));
    const { data: votes } = await supabase.from('vote').select('*, users:voter_id(user_id, username)').eq('session_id', req.params.sessionId);
    return sendSuccess(res, 200, { ...session, votes: votes || [] }, 'Success');
  } catch (e) { next(e); }
};

const listPendingSeries = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('series').select('*').in('status', ['pending_review', 'approved']).order('updated_at', { ascending: false });
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const listPendingChapters = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('chapter').select('*').in('status', ['pending_review', 'approved']).order('updated_at', { ascending: false });
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const listPendingManuscripts = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('manuscript').select('*').in('status', ['submitted', 'in_review']).order('updated_at', { ascending: false });
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

// --- Proposal Documents ---
const getProposalManuscripts = async (req, res, next) => {
  try {
    const session = await reviewSessionsRepo.findById(req.params.sessionId);
    if (!session) return next(new AppError('Session not found', 404));
    const filter = session.series_id ? { series_id: session.series_id } : session.chapter_id ? { chapter_id: session.chapter_id } : {};
    let query = supabase.from('manuscript').select('*');
    if (filter.series_id) query = query.eq('series_id', filter.series_id);
    else if (filter.chapter_id) query = query.eq('chapter_id', filter.chapter_id);
    const { data, error } = await query.order('created_at');
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getProposalFiles = async (req, res, next) => {
  try {
    const session = await reviewSessionsRepo.findById(req.params.sessionId);
    if (!session) return next(new AppError('Session not found', 404));
    const filter = session.series_id ? { series_id: session.series_id } : {};
    const { data: manuscripts } = filter.series_id
      ? await supabase.from('manuscript').select('manuscript_id').eq('series_id', filter.series_id)
      : { data: [] };
    const ids = (manuscripts || []).map((m) => m.manuscript_id);
    const { data, error } = ids.length ? await supabase.from('manuscript_file').select('*').in('manuscript_id', ids).order('uploaded_at') : { data: [] };
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getSeriesManuscripts = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('manuscript').select('*').eq('series_id', req.params.seriesId).order('created_at');
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getChapterManuscripts = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('manuscript').select('*').eq('chapter_id', req.params.chapterId).order('created_at');
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getManuscriptFiles = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('manuscript_file').select('*').eq('manuscript_id', req.params.manuscriptId).order('uploaded_at');
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

// --- Votes ---
const listVotes = async (req, res, next) => {
  try {
    const data = await votesSvc.listVotes(req.params.sessionId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const createVote = async (req, res, next) => {
  try {
    const data = await votesSvc.createVote(req.params.sessionId, req.user.user_id, req.body);
    return sendSuccess(res, 201, data, 'Vote submitted');
  } catch (e) { next(e); }
};

const getVoteById = async (req, res, next) => {
  try {
    const data = await votesSvc.getVoteById(req.params.voteId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const updateVote = async (req, res, next) => {
  try {
    const data = await votesSvc.updateVote(req.params.voteId, req.body);
    return sendSuccess(res, 200, data, 'Vote updated');
  } catch (e) { next(e); }
};

const updateVoteStatus = async (req, res, next) => {
  try {
    const data = await votesSvc.updateVoteStatus(req.params.voteId, req.body.status);
    return sendSuccess(res, 200, data, 'Vote status updated');
  } catch (e) { next(e); }
};

const deleteVote = async (req, res, next) => {
  try {
    await votesSvc.deleteVote(req.params.voteId);
    return sendSuccess(res, 200, null, 'Vote deleted');
  } catch (e) { next(e); }
};

// --- Decision Processing ---
const processResult = async (req, res, next) => {
  try {
    const data = await decisionsSvc.processSessionResult(req.params.sessionId);
    return sendSuccess(res, 200, data, 'Result processed');
  } catch (e) { next(e); }
};

const applyDecisionToSeries = async (req, res, next) => {
  try {
    const data = await decisionsSvc.applyDecisionToSeries(req.params.seriesId, req.body.status, req.body.note);
    return sendSuccess(res, 200, data, 'Decision applied');
  } catch (e) { next(e); }
};

const applyDecisionToChapter = async (req, res, next) => {
  try {
    const data = await decisionsSvc.applyDecisionToChapter(req.params.chapterId, req.body.status, req.body.note);
    return sendSuccess(res, 200, data, 'Decision applied');
  } catch (e) { next(e); }
};

const applyDecisionToManuscript = async (req, res, next) => {
  try {
    const data = await decisionsSvc.applyDecisionToManuscript(req.params.manuscriptId, req.body.status, req.body.note);
    return sendSuccess(res, 200, data, 'Decision applied');
  } catch (e) { next(e); }
};

const seriesDecision = (status) => async (req, res, next) => {
  try {
    const data = await decisionsSvc.applyDecisionToSeries(req.params.seriesId, status);
    return sendSuccess(res, 200, data, `Series ${status}`);
  } catch (e) { next(e); }
};

const chapterDecision = (status) => async (req, res, next) => {
  try {
    const data = await decisionsSvc.applyDecisionToChapter(req.params.chapterId, status);
    return sendSuccess(res, 200, data, `Chapter ${status}`);
  } catch (e) { next(e); }
};

// --- Decision History ---
const seriesDecisionHistory = async (req, res, next) => {
  try {
    const data = await decisionsSvc.getDecisionHistory('series', req.params.seriesId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const chapterDecisionHistory = async (req, res, next) => {
  try {
    const data = await decisionsSvc.getDecisionHistory('chapter', req.params.chapterId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const sessionHistory = async (req, res, next) => {
  try {
    const session = await reviewSessionsRepo.findById(req.params.sessionId);
    const { data: votes } = await supabase.from('vote').select('*').eq('session_id', req.params.sessionId).order('created_at');
    return sendSuccess(res, 200, { session, votes: votes || [] }, 'Success');
  } catch (e) { next(e); }
};

// --- Rankings ---
const listRankingPeriods = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('ranking_period').select('*').order('start_date', { ascending: false });
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getRankingPeriodById = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('ranking_period').select('*').eq('period_id', req.params.periodId).maybeSingle();
    if (error) throw error;
    if (!data) return next(new AppError('Period not found', 404));
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const listSeriesRankings = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('series_ranking').select('*, series:series_id(title), ranking_period:period_id(name)').order('rank_position');
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const listChapterRankings = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('chapter_ranking').select('*, chapter:chapter_id(title), ranking_period:period_id(name)').order('rank_position');
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const seriesRankingHistory = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('series_ranking').select('*, ranking_period:period_id(name, start_date, end_date)').eq('series_id', req.params.seriesId).order('rank_position');
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const chapterRankingHistory = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('chapter_ranking').select('*, ranking_period:period_id(name, start_date, end_date)').eq('chapter_id', req.params.chapterId).order('rank_position');
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

// --- Notifications ---
const listNotifications = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    let query = supabase.from('notification').select('*', { count: 'exact' }).eq('user_id', req.user.user_id);
    if (req.query.is_read !== undefined) query = query.eq('is_read', req.query.is_read === 'true');
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, count) });
  } catch (e) { next(e); }
};

const getUnreadNotifications = async (req, res, next) => {
  try {
    const { data, error, count } = await supabase.from('notification').select('*', { count: 'exact' }).eq('user_id', req.user.user_id).eq('is_read', false).order('created_at', { ascending: false });
    if (error) throw error;
    return sendSuccess(res, 200, { count, items: data }, 'Success');
  } catch (e) { next(e); }
};

const markNotificationRead = async (req, res, next) => {
  try {
    await supabase.from('notification').update({ is_read: true }).eq('notification_id', req.params.notificationId).eq('user_id', req.user.user_id);
    return sendSuccess(res, 200, null, 'Marked as read');
  } catch (e) { next(e); }
};

const markAllRead = async (req, res, next) => {
  try {
    await supabase.from('notification').update({ is_read: true }).eq('user_id', req.user.user_id).eq('is_read', false);
    return sendSuccess(res, 200, null, 'All marked as read');
  } catch (e) { next(e); }
};

const deleteNotification = async (req, res, next) => {
  try {
    await supabase.from('notification').delete().eq('notification_id', req.params.notificationId).eq('user_id', req.user.user_id);
    return sendSuccess(res, 200, null, 'Deleted');
  } catch (e) { next(e); }
};

const sendDecisionNotification = async (req, res, next) => {
  try {
    const { createNotification } = require('../../utils/notification.helper');
    await createNotification(req.body.user_id, req.body.title, req.body.content, req.body.type || 'decision_result');
    return sendSuccess(res, 201, null, 'Notification sent');
  } catch (e) { next(e); }
};

module.exports = {
  listProposals, listPendingProposals, getProposalById, getProposalDetail,
  listPendingSeries, listPendingChapters, listPendingManuscripts,
  getProposalManuscripts, getProposalFiles, getSeriesManuscripts, getChapterManuscripts, getManuscriptFiles,
  listVotes, createVote, getVoteById, updateVote, updateVoteStatus, deleteVote,
  processResult, applyDecisionToSeries, applyDecisionToChapter, applyDecisionToManuscript, seriesDecision, chapterDecision,
  seriesDecisionHistory, chapterDecisionHistory, sessionHistory,
  listRankingPeriods, getRankingPeriodById, listSeriesRankings, listChapterRankings, seriesRankingHistory, chapterRankingHistory,
  listNotifications, getUnreadNotifications, markNotificationRead, markAllRead, deleteNotification, sendDecisionNotification,
};
