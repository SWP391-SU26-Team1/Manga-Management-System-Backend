const supabase = require('../../config/supabase');

const getOverview = async () => {
  const [
    { count: totalUsers },
    { count: totalSeries },
    { count: totalChapters },
    { count: totalPages },
    { data: tasks },
    { count: activeSessions },
    { count: totalNotifications },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('series').select('*', { count: 'exact', head: true }),
    supabase.from('chapter').select('*', { count: 'exact', head: true }),
    supabase.from('page').select('*', { count: 'exact', head: true }),
    supabase.from('page_task').select('task_id, status'),
    supabase.from('review_session').select('*', { count: 'exact', head: true }).in('status', ['in_progress', 'pending']),
    supabase.from('notification').select('*', { count: 'exact', head: true }),
  ]);

  const byStatus = (tasks || []).reduce((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {});

  return {
    total_users: totalUsers ?? 0,
    total_series: totalSeries ?? 0,
    total_chapters: totalChapters ?? 0,
    total_pages: totalPages ?? 0,
    total_tasks: tasks?.length ?? 0,
    pending_tasks: byStatus.pending ?? 0,
    completed_tasks: byStatus.completed ?? 0,
    active_review_sessions: activeSessions ?? 0,
    total_notifications: totalNotifications ?? 0,
  };
};

const getUserStats = async () => {
  const { data, error } = await supabase.from('users').select('role, status');
  if (error) throw error;
  const byRole = (data || []).reduce((acc, u) => { acc[u.role] = (acc[u.role] ?? 0) + 1; return acc; }, {});
  const byStatus = (data || []).reduce((acc, u) => { acc[u.status] = (acc[u.status] ?? 0) + 1; return acc; }, {});
  return { total: data?.length ?? 0, by_role: byRole, by_status: byStatus };
};

const getSeriesStats = async () => {
  const { data, error } = await supabase.from('series').select('status, genre');
  if (error) throw error;
  const byStatus = (data || []).reduce((acc, s) => { acc[s.status] = (acc[s.status] ?? 0) + 1; return acc; }, {});
  return { total: data?.length ?? 0, by_status: byStatus };
};

const getChapterStats = async () => {
  const { data, error } = await supabase.from('chapter').select('status');
  if (error) throw error;
  const byStatus = (data || []).reduce((acc, chapter) => {
    acc[chapter.status] = (acc[chapter.status] ?? 0) + 1;
    return acc;
  }, {});
  return { total: data?.length ?? 0, by_status: byStatus };
};

const getTaskStats = async () => {
  const { data, error } = await supabase.from('page_task').select('status, deadline, task_type');
  if (error) throw error;
  const now = new Date();
  const byStatus = (data || []).reduce((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {});
  const overdue = (data || []).filter((t) => t.deadline && new Date(t.deadline) < now && !['completed', 'cancelled', 'rejected'].includes(t.status)).length;
  return { total: data?.length ?? 0, by_status: byStatus, overdue };
};

const getReviewStats = async () => {
  const { data, error } = await supabase.from('review_session').select('status');
  if (error) throw error;
  const byStatus = (data || []).reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {});
  return { total: data?.length ?? 0, by_status: byStatus };
};

const getRankingStats = async () => {
  const [{ count: periods }, { count: seriesRankings }, { count: chapterRankings }] = await Promise.all([
    supabase.from('ranking_period').select('*', { count: 'exact', head: true }),
    supabase.from('series_ranking').select('*', { count: 'exact', head: true }),
    supabase.from('chapter_ranking').select('*', { count: 'exact', head: true }),
  ]);
  return { total_periods: periods ?? 0, total_series_rankings: seriesRankings ?? 0, total_chapter_rankings: chapterRankings ?? 0 };
};

const getNotificationStats = async () => {
  const { data, error } = await supabase.from('notification').select('is_read, type');
  if (error) throw error;
  const unread = (data || []).filter((n) => !n.is_read).length;
  const byType = (data || []).reduce((acc, n) => { if (n.type) acc[n.type] = (acc[n.type] ?? 0) + 1; return acc; }, {});
  return { total: data?.length ?? 0, unread, by_type: byType };
};

module.exports = { getOverview, getUserStats, getSeriesStats, getChapterStats, getTaskStats, getReviewStats, getRankingStats, getNotificationStats };
