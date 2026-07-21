const supabase = require('../../config/supabase');

const getOverview = async (editorId) => {
  const now = new Date().toISOString();
  
  let seriesIds = null;
  if (editorId) {
    const { data: memberSeries } = await supabase
      .from('series_member')
      .select('series_id')
      .eq('user_id', editorId);
    seriesIds = memberSeries?.map(m => m.series_id) || [];
  }

  const [{ count: totalSeries }, { count: totalChapters }, { count: totalPages }, { data: tasks }] = await Promise.all([
    supabase.from('series').select('*', { count: 'exact', head: true }),
    supabase.from('chapter').select('*', { count: 'exact', head: true }),
    supabase.from('page').select('*', { count: 'exact', head: true }),
    supabase.from('page_task').select('task_id, status, deadline, page_id'),
  ]);

  let filteredTasks = tasks || [];
  if (seriesIds !== null) {
    if (seriesIds.length === 0) {
      filteredTasks = [];
    } else {
      const { data: chapters } = await supabase.from('chapter').select('chapter_id').in('series_id', seriesIds);
      const chapterIds = chapters?.map(c => c.chapter_id) || [];
      if (chapterIds.length === 0) {
        filteredTasks = [];
      } else {
        const { data: pages } = await supabase.from('page').select('page_id').in('chapter_id', chapterIds);
        const pageIds = pages?.map(p => p.page_id) || [];
        if (pageIds.length === 0) {
          filteredTasks = [];
        } else {
          filteredTasks = (tasks || []).filter(t => pageIds.includes(t.page_id));
        }
      }
    }
  }

  const byStatus = filteredTasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {});
  const overdue = filteredTasks.filter((t) => t.deadline && new Date(t.deadline) < new Date() && !['completed', 'cancelled', 'rejected'].includes(t.status)).length;

  const activeSeriesCount = seriesIds !== null ? seriesIds.length : (totalSeries ?? 0);

  return { 
    total_series: activeSeriesCount, 
    total_chapters: totalChapters ?? 0, 
    total_pages: totalPages ?? 0, 
    total_tasks: filteredTasks.length, 
    ...byStatus, 
    overdue_tasks: overdue 
  };
};

const getSeriesProgress = async (seriesId) => {
  const { data: chapters } = await supabase.from('chapter').select('chapter_id, status').eq('series_id', seriesId);
  const chapterIds = (chapters || []).map((c) => c.chapter_id);
  let pages = [], tasks = [];
  if (chapterIds.length) {
    const [{ data: p }, { data: t }] = await Promise.all([
      supabase.from('page').select('page_id, status').in('chapter_id', chapterIds),
      supabase.from('page_task').select('task_id, status, deadline').in('page_id', (await supabase.from('page').select('page_id').in('chapter_id', chapterIds)).data?.map((x) => x.page_id) || []),
    ]);
    pages = p || [];
    tasks = t || [];
  }
  const now = new Date();
  const overdue = tasks.filter((t) => t.deadline && new Date(t.deadline) < now && !['completed', 'cancelled', 'rejected'].includes(t.status)).length;
  const byTask = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {});

  return { series_id: seriesId, total_chapters: chapters?.length ?? 0, total_pages: pages.length, total_tasks: tasks.length, overdue_tasks: overdue, ...byTask };
};

const getChapterProgress = async (chapterId) => {
  const { data: pages } = await supabase.from('page').select('page_id, status').eq('chapter_id', chapterId);
  const pageIds = (pages || []).map((p) => p.page_id);
  let tasks = [];
  if (pageIds.length) {
    const { data: t } = await supabase.from('page_task').select('task_id, status').in('page_id', pageIds);
    tasks = t || [];
  }
  const byTask = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {});
  return { chapter_id: chapterId, total_pages: pages?.length ?? 0, total_tasks: tasks.length, ...byTask };
};

const getTaskSummary = async () => {
  const { data: tasks } = await supabase.from('page_task').select('status, deadline');
  const byStatus = (tasks || []).reduce((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {});
  const now = new Date();
  const overdue = (tasks || []).filter((t) => t.deadline && new Date(t.deadline) < now && !['completed', 'cancelled', 'rejected'].includes(t.status)).length;
  return { total: tasks?.length ?? 0, by_status: byStatus, overdue };
};

const getAssistantsWorkload = async () => {
  const { data: assistants } = await supabase.from('users').select('user_id, username').eq('role', 'assistant').eq('status', 'active');
  if (!assistants) return [];

  const workload = await Promise.all(assistants.map(async (a) => {
    const { count: total } = await supabase.from('page_task').select('*', { count: 'exact', head: true }).eq('assistant_id', a.user_id);
    const { count: active } = await supabase.from('page_task').select('*', { count: 'exact', head: true }).eq('assistant_id', a.user_id).in('status', ['assigned', 'in_progress']);
    return { user_id: a.user_id, username: a.username, total_tasks: total ?? 0, active_tasks: active ?? 0 };
  }));
  return workload;
};

const getAssistantPerformance = async (assistantId) => {
  const { data: tasks } = await supabase.from('page_task').select('status, deadline, created_at, updated_at').eq('assistant_id', assistantId);
  const completed = (tasks || []).filter((t) => t.status === 'completed');
  const now = new Date();
  const overdue = (tasks || []).filter((t) => t.deadline && new Date(t.deadline) < now && !['completed', 'cancelled', 'rejected'].includes(t.status));
  const total = tasks?.length ?? 0;
  return { assistant_id: assistantId, total_tasks: total, completed_tasks: completed.length, overdue_tasks: overdue.length, completion_rate_pct: total > 0 ? Math.round((completed.length / total) * 100) : 0 };
};

module.exports = { getOverview, getSeriesProgress, getChapterProgress, getTaskSummary, getAssistantsWorkload, getAssistantPerformance };
