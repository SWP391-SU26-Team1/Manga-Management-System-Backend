const dashboardSvc = require('./adminDashboard.service');
const importExportSvc = require('./adminImportExport.service');
const usersRepo = require('../users/users.repository');
const seriesRepo = require('../series/series.repository');
const chaptersRepo = require('../chapters/chapters.repository');
const pagesRepo = require('../pages/pages.repository');
const pageTasksRepo = require('../pageTasks/pageTasks.repository');
const pageTaskFeedbacksRepo = require('../pageTaskFeedbacks/pageTaskFeedbacks.repository');
const annotationsRepo = require('../annotations/annotations.repository');
const reviewSessionsRepo = require('../reviewSessions/reviewSessions.repository');
const reviewSessionsSvc = require('../reviewSessions/reviewSessions.service');
const votesRepo = require('../votes/votes.repository');
const votesSvc = require('../votes/votes.service');
const rankingPeriodsRepo = require('../rankingPeriods/rankingPeriods.repository');
const pageRegionsRepo = require('../pageRegions/pageRegions.repository');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const supabase = require('../../config/supabase');
const bcrypt = require('bcryptjs');
const AppError = require('../../utils/appError');

// --- Users ---
const listUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { role, status, keyword } = req.query;
    let query = supabase.from('users').select('user_id,username,email,role,status,created_at', { count: 'exact' });
    if (role) query = query.eq('role', role);
    if (status) query = query.eq('status', status);
    if (keyword) query = query.or(`username.ilike.%${keyword}%,email.ilike.%${keyword}%`);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, count) });
  } catch (e) { next(e); }
};

const getUserById = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('users').select('user_id,username,email,role,status,created_at').eq('user_id', req.params.userId).maybeSingle();
    if (error) throw error;
    if (!data) return next(new AppError('User not found', 404));
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const createUser = async (req, res, next) => {
  try {
    const { password, ...rest } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const data = await usersRepo.create({ ...rest, password: hashed, status: rest.status || 'active' });
    const { password: _p, ...safe } = data;
    return sendSuccess(res, 201, safe, 'User created');
  } catch (e) { next(e); }
};

const updateUser = async (req, res, next) => {
  try {
    const { password, ...rest } = req.body;
    const updates = { ...rest };
    if (password) updates.password = await bcrypt.hash(password, 10);
    const data = await usersRepo.update(req.params.userId, updates);
    const { password: _p, ...safe } = data;
    return sendSuccess(res, 200, safe, 'User updated');
  } catch (e) { next(e); }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const user = await usersRepo.update(req.params.userId, { status: req.body.status });
    const { password: _p, ...safeUser } = user;
    return sendSuccess(res, 200, safeUser, 'Status updated');
  } catch (e) { next(e); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const data = await usersRepo.update(req.params.userId, { role: req.body.role });
    return sendSuccess(res, 200, data, 'Role updated');
  } catch (e) { next(e); }
};

const deleteUser = async (req, res, next) => {
  try {
    await usersRepo.update(req.params.userId, { status: 'inactive' });
    return sendSuccess(res, 200, null, 'User deactivated');
  } catch (e) { next(e); }
};

// --- Generic admin override helpers ---
const makeListHandler = (table, select = '*') => async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status } = req.query;
    let query = supabase.from(table).select(select, { count: 'exact' });
    if (status) query = query.eq('status', status);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, count) });
  } catch (e) { next(e); }
};

const makeGetByIdHandler = (repo, pkField) => async (req, res, next) => {
  try {
    const data = await repo.findById(req.params[pkField]);
    if (!data) return next(new AppError('Not found', 404));
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const makeStatusUpdateHandler = (table, pkField, pkParam) => async (req, res, next) => {
  try {
    const { data, error } = await supabase.from(table).update({ status: req.body.status, updated_at: new Date().toISOString() }).eq(pkField, req.params[pkParam]).select().single();
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Status updated');
  } catch (e) { next(e); }
};

const makeDeleteHandler = (table, pkField, pkParam) => async (req, res, next) => {
  try {
    const { error } = await supabase.from(table).delete().eq(pkField, req.params[pkParam]);
    if (error) throw error;
    return sendSuccess(res, 200, null, 'Deleted');
  } catch (e) { next(e); }
};

// Series
const listAdminSeries = makeListHandler('series');
const getAdminSeriesById = makeGetByIdHandler(seriesRepo, 'seriesId');
const updateAdminSeriesStatus = makeStatusUpdateHandler('series', 'series_id', 'seriesId');
const deleteAdminSeries = makeDeleteHandler('series', 'series_id', 'seriesId');

// Chapters
const listAdminChapters = makeListHandler('chapter');
const getAdminChapterById = makeGetByIdHandler(chaptersRepo, 'chapterId');
const updateAdminChapterStatus = makeStatusUpdateHandler('chapter', 'chapter_id', 'chapterId');
const deleteAdminChapter = makeDeleteHandler('chapter', 'chapter_id', 'chapterId');

// Pages
const listAdminPages = makeListHandler('page');
const getAdminPageById = makeGetByIdHandler(pagesRepo, 'pageId');
const updateAdminPageStatus = makeStatusUpdateHandler('page', 'page_id', 'pageId');
const deleteAdminPage = makeDeleteHandler('page', 'page_id', 'pageId');

// Tasks
const listAdminTasks = makeListHandler('page_task');
const getAdminTaskById = makeGetByIdHandler(pageTasksRepo, 'taskId');
const updateAdminTask = async (req, res, next) => {
  try {
    const data = await pageTasksRepo.update(req.params.taskId, { ...req.body, updated_at: new Date().toISOString() });
    return sendSuccess(res, 200, data, 'Task updated');
  } catch (e) { next(e); }
};
const updateAdminTaskStatus = makeStatusUpdateHandler('page_task', 'task_id', 'taskId');
const deleteAdminTask = makeDeleteHandler('page_task', 'task_id', 'taskId');

// Feedbacks
const listAdminFeedbacks = makeListHandler('page_task_feedback');
const getAdminFeedbackById = makeGetByIdHandler(pageTaskFeedbacksRepo, 'feedbackId');
const updateAdminFeedbackStatus = makeStatusUpdateHandler('page_task_feedback', 'feedback_id', 'feedbackId');
const deleteAdminFeedback = makeDeleteHandler('page_task_feedback', 'feedback_id', 'feedbackId');

// Annotations
const listAdminAnnotations = makeListHandler('annotation');
const getAdminAnnotationById = makeGetByIdHandler(annotationsRepo, 'annotationId');
const updateAdminAnnotationStatus = makeStatusUpdateHandler('annotation', 'annotation_id', 'annotationId');
const deleteAdminAnnotation = makeDeleteHandler('annotation', 'annotation_id', 'annotationId');

// Review Sessions
const listAdminSessions = makeListHandler('review_session');
const getAdminSessionById = makeGetByIdHandler(reviewSessionsRepo, 'sessionId');
const createAdminSession = async (req, res, next) => {
  try {
    const data = await reviewSessionsSvc.createSession(req.body);
    return sendSuccess(res, 201, data, 'Review session created');
  } catch (e) { next(e); }
};
const updateAdminSession = async (req, res, next) => {
  try {
    const data = await reviewSessionsRepo.update(req.params.sessionId, { ...req.body, updated_at: new Date().toISOString() });
    return sendSuccess(res, 200, data, 'Session updated');
  } catch (e) { next(e); }
};
const updateAdminSessionStatus = makeStatusUpdateHandler('review_session', 'session_id', 'sessionId');
const deleteAdminSession = makeDeleteHandler('review_session', 'session_id', 'sessionId');

// Votes
const listAdminVotes = makeListHandler('vote');
const getAdminVoteById = makeGetByIdHandler(votesRepo, 'voteId');
const updateAdminVote = async (req, res, next) => {
  try {
    const data = await votesSvc.updateVote(req.params.voteId, req.body);
    return sendSuccess(res, 200, data, 'Vote updated');
  } catch (e) { next(e); }
};
const updateAdminVoteStatus = async (req, res, next) => {
  try {
    const data = await votesSvc.updateVoteStatus(req.params.voteId, req.body.status);
    return sendSuccess(res, 200, data, 'Status updated');
  } catch (e) { next(e); }
};
const deleteAdminVote = async (req, res, next) => {
  try {
    await votesSvc.deleteVote(req.params.voteId);
    return sendSuccess(res, 200, null, 'Vote deleted');
  } catch (e) { next(e); }
};

// Ranking Periods
const listAdminPeriods = makeListHandler('ranking_period');
const getAdminPeriodById = makeGetByIdHandler(rankingPeriodsRepo, 'periodId');
const createAdminPeriod = async (req, res, next) => {
  try {
    const data = await rankingPeriodsRepo.create(req.body);
    return sendSuccess(res, 201, data, 'Period created');
  } catch (e) { next(e); }
};
const updateAdminPeriod = async (req, res, next) => {
  try {
    const data = await rankingPeriodsRepo.update(req.params.periodId, req.body);
    return sendSuccess(res, 200, data, 'Period updated');
  } catch (e) { next(e); }
};
const updateAdminPeriodStatus = makeStatusUpdateHandler('ranking_period', 'period_id', 'periodId');
const deleteAdminPeriod = makeDeleteHandler('ranking_period', 'period_id', 'periodId');

// Series/Chapter Rankings
const listAdminSeriesRankings = makeListHandler('series_ranking');
const createAdminSeriesRanking = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('series_ranking').insert(req.body).select().single();
    if (error) throw error;
    return sendSuccess(res, 201, data, 'Created');
  } catch (e) { next(e); }
};
const updateAdminSeriesRanking = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('series_ranking').update(req.body).eq('series_ranking_id', req.params.seriesRankingId).select().single();
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Updated');
  } catch (e) { next(e); }
};
const deleteAdminSeriesRanking = makeDeleteHandler('series_ranking', 'series_ranking_id', 'seriesRankingId');

const listAdminChapterRankings = makeListHandler('chapter_ranking');
const createAdminChapterRanking = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('chapter_ranking').insert(req.body).select().single();
    if (error) throw error;
    return sendSuccess(res, 201, data, 'Created');
  } catch (e) { next(e); }
};
const updateAdminChapterRanking = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('chapter_ranking').update(req.body).eq('chapter_ranking_id', req.params.chapterRankingId).select().single();
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Updated');
  } catch (e) { next(e); }
};
const deleteAdminChapterRanking = makeDeleteHandler('chapter_ranking', 'chapter_ranking_id', 'chapterRankingId');

// Notifications
const listAdminNotifications = makeListHandler('notification');
const getAdminNotificationById = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('notification').select('*').eq('notification_id', req.params.notificationId).maybeSingle();
    if (error) throw error;
    if (!data) return next(new AppError('Not found', 404));
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};
const createAdminNotification = async (req, res, next) => {
  try {
    const { createNotification } = require('../../utils/notification.helper');
    await createNotification(req.body.user_id, req.body.title, req.body.content, req.body.type);
    return sendSuccess(res, 201, null, 'Notification sent');
  } catch (e) { next(e); }
};
const updateAdminNotification = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('notification').update(req.body).eq('notification_id', req.params.notificationId).select().single();
    if (error) throw error;
    return sendSuccess(res, 200, data, 'Updated');
  } catch (e) { next(e); }
};
const deleteAdminNotification = makeDeleteHandler('notification', 'notification_id', 'notificationId');

// Dashboard
const dashboardOverview = async (req, res, next) => {
  try { return sendSuccess(res, 200, await dashboardSvc.getOverview(), 'Success'); } catch (e) { next(e); }
};
const dashboardUsers = async (req, res, next) => {
  try { return sendSuccess(res, 200, await dashboardSvc.getUserStats(), 'Success'); } catch (e) { next(e); }
};
const dashboardSeries = async (req, res, next) => {
  try { return sendSuccess(res, 200, await dashboardSvc.getSeriesStats(), 'Success'); } catch (e) { next(e); }
};
const dashboardTasks = async (req, res, next) => {
  try { return sendSuccess(res, 200, await dashboardSvc.getTaskStats(), 'Success'); } catch (e) { next(e); }
};
const dashboardReviews = async (req, res, next) => {
  try { return sendSuccess(res, 200, await dashboardSvc.getReviewStats(), 'Success'); } catch (e) { next(e); }
};
const dashboardRankings = async (req, res, next) => {
  try { return sendSuccess(res, 200, await dashboardSvc.getRankingStats(), 'Success'); } catch (e) { next(e); }
};
const dashboardNotifications = async (req, res, next) => {
  try { return sendSuccess(res, 200, await dashboardSvc.getNotificationStats(), 'Success'); } catch (e) { next(e); }
};

// Import / Export
const exportFullSystem = async (req, res, next) => {
  try { return sendSuccess(res, 200, await importExportSvc.exportFullSystem(), 'Export ready'); } catch (e) { next(e); }
};
const exportSeries = async (req, res, next) => {
  try { return sendSuccess(res, 200, await importExportSvc.exportSeries(req.params.seriesId), 'Export ready'); } catch (e) { next(e); }
};
const exportUsers = async (req, res, next) => {
  try { return sendSuccess(res, 200, await importExportSvc.exportUsers(), 'Export ready'); } catch (e) { next(e); }
};
const exportRankings = async (req, res, next) => {
  try { return sendSuccess(res, 200, await importExportSvc.exportRankings(), 'Export ready'); } catch (e) { next(e); }
};
const importUsers = async (req, res, next) => {
  try { return sendSuccess(res, 200, await importExportSvc.importUsers(req.body.users), 'Import complete'); } catch (e) { next(e); }
};
const importSeries = async (req, res, next) => {
  try { return sendSuccess(res, 201, await importExportSvc.importSeries(req.body), 'Import complete'); } catch (e) { next(e); }
};
const importRankings = async (req, res, next) => {
  try { return sendSuccess(res, 200, await importExportSvc.importRankings(req.body), 'Import complete'); } catch (e) { next(e); }
};
const importFullSystem = async (req, res, next) => {
  try {
    const results = {};
    if (req.body.users?.length) results.users = await importExportSvc.importUsers(req.body.users);
    if (req.body.series) results.series = await importExportSvc.importSeries(req.body.series);
    if (req.body.rankings) results.rankings = await importExportSvc.importRankings(req.body.rankings);
    return sendSuccess(res, 200, results, 'Full import complete');
  } catch (e) { next(e); }
};

// --- Activity Logs ---
const getActivityLogs = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { user_id, action, from, to } = req.query;
    let query = supabase
      .from('activity_log')
      .select('*', { count: 'exact' });
    if (user_id) query = query.eq('user_id', user_id);
    if (action) query = query.eq('action', action);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, count) });
  } catch (e) { next(e); }
};

// --- Global Search ---
const globalSearch = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    if (!keyword || keyword.trim().length < 2) {
      return next(new AppError('keyword must be at least 2 characters', 400));
    }
    const kw = keyword.trim();
    const [usersRes, seriesRes, chaptersRes] = await Promise.all([
      supabase.from('users').select('user_id,username,email,role,status').or(`username.ilike.%${kw}%,email.ilike.%${kw}%`).limit(10),
      supabase.from('series').select('series_id,title,status').ilike('title', `%${kw}%`).limit(10),
      supabase.from('chapter').select('chapter_id,title,chapter_number,status').ilike('title', `%${kw}%`).limit(10),
    ]);
    if (usersRes.error) throw usersRes.error;
    if (seriesRes.error) throw seriesRes.error;
    if (chaptersRes.error) throw chaptersRes.error;
    return sendSuccess(res, 200, {
      users: usersRes.data,
      series: seriesRes.data,
      chapters: chaptersRes.data,
    }, 'Search results');
  } catch (e) { next(e); }
};

// --- Storage Usage ---
const getStorageUsage = async (req, res, next) => {
  try {
    const [filesRes, versionsRes] = await Promise.all([
      supabase.from('manuscript_file').select('file_id', { count: 'exact' }),
      supabase.from('page_version').select('version_id', { count: 'exact' }),
    ]);
    if (filesRes.error) throw filesRes.error;
    if (versionsRes.error) throw versionsRes.error;
    return sendSuccess(res, 200, {
      manuscript_files: { count: filesRes.count },
      page_versions: { count: versionsRes.count },
    }, 'Storage usage');
  } catch (e) { next(e); }
};

// --- Trust Scores ---
const getTrustScores = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { role } = req.query;
    let query = supabase
      .from('users')
      .select('user_id,username,email,role,status', { count: 'exact' })
      .in('role', role ? [role] : ['mangaka', 'assistant']);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    const { data: users, error, count } = await query;
    if (error) throw error;

    const userIds = users.map((u) => u.user_id);
    const [tasksRes, feedbacksRes] = await Promise.all([
      supabase.from('page_task').select('assistant_id,status').in('assistant_id', userIds),
      supabase.from('page_task_feedback').select('assistant_id').in('assistant_id', userIds),
    ]);

    const taskMap = {};
    (tasksRes.data || []).forEach((t) => {
      if (!taskMap[t.assistant_id]) taskMap[t.assistant_id] = { total: 0, completed: 0 };
      taskMap[t.assistant_id].total++;
      if (t.status === 'completed') taskMap[t.assistant_id].completed++;
    });
    const feedbackCount = {};
    (feedbacksRes.data || []).forEach((f) => {
      feedbackCount[f.assistant_id] = (feedbackCount[f.assistant_id] || 0) + 1;
    });

    const result = users.map((u) => {
      const stats = taskMap[u.user_id] || { total: 0, completed: 0 };
      const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      const feedbacks = feedbackCount[u.user_id] || 0;
      // Trust score: 70% completion rate + 30% based on low feedback count (max 10)
      const trustScore = Math.round(completionRate * 0.7 + Math.max(0, 10 - feedbacks) * 3);
      return { ...u, tasks_total: stats.total, tasks_completed: stats.completed, completion_rate: completionRate, feedback_count: feedbacks, trust_score: trustScore };
    });

    return res.status(200).json({ success: true, message: 'Success', data: result, pagination: buildPaginationMeta(page, limit, count) });
  } catch (e) { next(e); }
};

// --- System Health ---
const getSystemHealth = async (req, res, next) => {
  try {
    const start = Date.now();
    const { error } = await supabase.from('users').select('user_id').limit(1);
    const dbLatencyMs = Date.now() - start;
    if (error) throw error;

    const [usersRes, seriesRes, tasksRes] = await Promise.all([
      supabase.from('users').select('user_id', { count: 'exact' }).limit(0),
      supabase.from('series').select('series_id', { count: 'exact' }).limit(0),
      supabase.from('page_task').select('task_id', { count: 'exact' }).limit(0),
    ]);

    return sendSuccess(res, 200, {
      status: 'ok',
      db_latency_ms: dbLatencyMs,
      counts: {
        users: usersRes.count,
        series: seriesRes.count,
        tasks: tasksRes.count,
      },
      timestamp: new Date().toISOString(),
    }, 'System healthy');
  } catch (e) {
    return res.status(503).json({ success: false, message: 'System unhealthy', error: e.message });
  }
};

// --- Retry OCR ---
const retryOcr = async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const { data: page, error: pageError } = await supabase
      .from('page')
      .select('page_id,status')
      .eq('page_id', pageId)
      .maybeSingle();
    if (pageError) throw pageError;
    if (!page) return next(new AppError('Page not found', 404));

    // Mark page for OCR retry by updating metadata
    const { data, error } = await supabase
      .from('page')
      .update({ ocr_status: 'pending', updated_at: new Date().toISOString() })
      .eq('page_id', pageId)
      .select()
      .single();
    if (error) throw error;
    return sendSuccess(res, 200, data, 'OCR retry queued');
  } catch (e) { next(e); }
};

// --- Page Regions (Admin) ---
const listAdminPageRegions = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { page_id } = req.query;
    let query = supabase.from('page_region').select('*', { count: 'exact' });
    if (page_id) query = query.eq('page_id', page_id);
    query = query.range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, count) });
  } catch (e) { next(e); }
};

const createAdminPageRegion = async (req, res, next) => {
  try {
    const data = await pageRegionsRepo.create(req.body);
    return sendSuccess(res, 201, data, 'Page region created');
  } catch (e) { next(e); }
};

const updateAdminPageRegion = async (req, res, next) => {
  try {
    const exists = await pageRegionsRepo.existsById(req.params.regionId);
    if (!exists) return next(new AppError('Page region not found', 404));
    const data = await pageRegionsRepo.update(req.params.regionId, req.body);
    return sendSuccess(res, 200, data, 'Page region updated');
  } catch (e) { next(e); }
};

const deleteAdminPageRegion = async (req, res, next) => {
  try {
    const exists = await pageRegionsRepo.existsById(req.params.regionId);
    if (!exists) return next(new AppError('Page region not found', 404));
    await pageRegionsRepo.deleteById(req.params.regionId);
    return sendSuccess(res, 200, null, 'Page region deleted');
  } catch (e) { next(e); }
};

module.exports = {
  listUsers, getUserById, createUser, updateUser, updateUserStatus, updateUserRole, deleteUser,
  listAdminSeries, getAdminSeriesById, updateAdminSeriesStatus, deleteAdminSeries,
  listAdminChapters, getAdminChapterById, updateAdminChapterStatus, deleteAdminChapter,
  listAdminPages, getAdminPageById, updateAdminPageStatus, deleteAdminPage,
  listAdminTasks, getAdminTaskById, updateAdminTask, updateAdminTaskStatus, deleteAdminTask,
  listAdminFeedbacks, getAdminFeedbackById, updateAdminFeedbackStatus, deleteAdminFeedback,
  listAdminAnnotations, getAdminAnnotationById, updateAdminAnnotationStatus, deleteAdminAnnotation,
  listAdminSessions, getAdminSessionById, createAdminSession, updateAdminSession, updateAdminSessionStatus, deleteAdminSession,
  listAdminVotes, getAdminVoteById, updateAdminVote, updateAdminVoteStatus, deleteAdminVote,
  listAdminPeriods, getAdminPeriodById, createAdminPeriod, updateAdminPeriod, updateAdminPeriodStatus, deleteAdminPeriod,
  listAdminSeriesRankings, createAdminSeriesRanking, updateAdminSeriesRanking, deleteAdminSeriesRanking,
  listAdminChapterRankings, createAdminChapterRanking, updateAdminChapterRanking, deleteAdminChapterRanking,
  listAdminNotifications, getAdminNotificationById, createAdminNotification, updateAdminNotification, deleteAdminNotification,
  dashboardOverview, dashboardUsers, dashboardSeries, dashboardTasks, dashboardReviews, dashboardRankings, dashboardNotifications,
  exportFullSystem, exportSeries, exportUsers, exportRankings,
  importUsers, importSeries, importRankings, importFullSystem,
  getActivityLogs,
  globalSearch,
  getStorageUsage,
  getTrustScores,
  getSystemHealth,
  retryOcr,
  listAdminPageRegions, createAdminPageRegion, updateAdminPageRegion, deleteAdminPageRegion,
};
