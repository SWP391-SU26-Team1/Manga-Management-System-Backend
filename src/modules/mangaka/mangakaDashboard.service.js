const supabase = require('../../config/supabase');

const getSeriesProgress = async (userId, seriesId) => {
  const [{ data: chapters }, { data: pages }, { data: tasks }] = await Promise.all([
    supabase.from('chapter').select('chapter_id, status').eq('series_id', seriesId),
    supabase.from('page').select('page_id, status, chapter:chapter_id(series_id)'),
    supabase.from('page_task').select('task_id, status, page:page_id(chapter:chapter_id(series_id))'),
  ]);

  const seriesPages = (pages || []).filter((p) => p.chapter?.series_id === seriesId);
  const seriesTasks = (tasks || []).filter((t) => t.page?.chapter?.series_id === seriesId);

  const chapterStats = { total: chapters?.length ?? 0, by_status: groupBy(chapters || [], 'status') };
  const pageStats = { total: seriesPages.length, by_status: groupBy(seriesPages, 'status') };
  const taskStats = { total: seriesTasks.length, by_status: groupBy(seriesTasks, 'status') };

  return { series_id: seriesId, chapters: chapterStats, pages: pageStats, tasks: taskStats };
};

const getWorkload = async (userId, seriesId) => {
  const { data: members } = await supabase.from('series_member').select('user_id, role_in_series, users:user_id(username)').eq('series_id', seriesId);
  if (!members) return [];

  const workload = await Promise.all(
    members.map(async (m) => {
      const { count: totalTasks } = await supabase.from('page_task').select('*', { count: 'exact', head: true }).eq('assistant_id', m.user_id);
      const { count: activeTasks } = await supabase.from('page_task').select('*', { count: 'exact', head: true }).eq('assistant_id', m.user_id).in('status', ['assigned', 'in_progress']);
      const { count: completedTasks } = await supabase.from('page_task').select('*', { count: 'exact', head: true }).eq('assistant_id', m.user_id).eq('status', 'completed');
      return {
        user_id: m.user_id,
        username: m.users?.username,
        role_in_series: m.role_in_series,
        total_tasks: totalTasks ?? 0,
        active_tasks: activeTasks ?? 0,
        completed_tasks: completedTasks ?? 0,
      };
    })
  );
  return workload;
};

const getPerformance = async (userId, seriesId) => {
  const { data: tasks } = await supabase
    .from('page_task')
    .select('task_id, status, assistant_id, created_at, updated_at, page:page_id(chapter:chapter_id(series_id))');

  const seriesTasks = (tasks || []).filter((t) => t.page?.chapter?.series_id === seriesId);
  const completedTasks = seriesTasks.filter((t) => t.status === 'completed');
  const totalTasks = seriesTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // avg time to complete (rough)
  const avgCompletionMs = completedTasks.length > 0
    ? completedTasks.reduce((sum, t) => sum + (new Date(t.updated_at) - new Date(t.created_at)), 0) / completedTasks.length
    : null;

  return {
    series_id: seriesId,
    total_tasks: totalTasks,
    completed_tasks: completedTasks.length,
    completion_rate_pct: completionRate,
    avg_completion_hours: avgCompletionMs ? Math.round(avgCompletionMs / 3600000) : null,
  };
};

const groupBy = (arr, key) =>
  arr.reduce((acc, item) => { acc[item[key]] = (acc[item[key]] ?? 0) + 1; return acc; }, {});

module.exports = { getSeriesProgress, getWorkload, getPerformance };
