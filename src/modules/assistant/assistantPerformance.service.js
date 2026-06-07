const supabase = require('../../config/supabase');

const getOverview = async (userId) => {
  const { data: tasks, error } = await supabase.from('page_task').select('task_id, status, deadline').eq('assistant_id', userId);
  if (error) throw error;

  const now = new Date();
  const overdue = (tasks || []).filter((t) => t.deadline && new Date(t.deadline) < now && !['completed', 'cancelled', 'rejected'].includes(t.status));

  const byStatus = (tasks || []).reduce((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {});

  return {
    assistant_id: userId,
    total_tasks: tasks?.length ?? 0,
    ...byStatus,
    overdue_tasks: overdue.length,
  };
};

const getPerformance = async (userId) => {
  const { data: tasks, error } = await supabase.from('page_task').select('task_id, status, deadline, created_at, updated_at').eq('assistant_id', userId);
  if (error) throw error;

  const now = new Date();
  const completed = (tasks || []).filter((t) => t.status === 'completed');
  const overdue = (tasks || []).filter((t) => t.deadline && new Date(t.deadline) < now && !['completed', 'cancelled', 'rejected'].includes(t.status));
  const totalTasks = tasks?.length ?? 0;
  const completionRate = totalTasks > 0 ? Math.round((completed.length / totalTasks) * 100) : 0;
  const avgMs = completed.length > 0
    ? completed.reduce((s, t) => s + (new Date(t.updated_at) - new Date(t.created_at)), 0) / completed.length
    : null;

  return {
    assistant_id: userId,
    total_tasks: totalTasks,
    completed_tasks: completed.length,
    overdue_tasks: overdue.length,
    completion_rate_pct: completionRate,
    avg_completion_hours: avgMs ? Math.round(avgMs / 3600000) : null,
  };
};

const getBreakdown = async (userId) => {
  const { data: tasks } = await supabase.from('page_task').select('task_id, status, task_type, deadline, created_at, updated_at, page:page_id(chapter:chapter_id(series_id, series:series_id(title), chapter_id, title))').eq('assistant_id', userId);

  return (tasks || []).map((t) => ({
    task_id: t.task_id,
    status: t.status,
    task_type: t.task_type,
    deadline: t.deadline,
    series_title: t.page?.chapter?.series?.title,
    chapter_title: t.page?.chapter?.title,
  }));
};

const getBySeries = async (userId) => {
  const { data: tasks } = await supabase.from('page_task').select('status, page:page_id(chapter:chapter_id(series:series_id(series_id, title)))').eq('assistant_id', userId);
  const map = {};
  (tasks || []).forEach((t) => {
    const sid = t.page?.chapter?.series?.series_id;
    const sTitle = t.page?.chapter?.series?.title;
    if (!sid) return;
    if (!map[sid]) map[sid] = { series_id: sid, title: sTitle, total: 0, completed: 0 };
    map[sid].total++;
    if (t.status === 'completed') map[sid].completed++;
  });
  return Object.values(map);
};

const getByChapter = async (userId) => {
  const { data: tasks } = await supabase.from('page_task').select('status, page:page_id(chapter:chapter_id(chapter_id, title))').eq('assistant_id', userId);
  const map = {};
  (tasks || []).forEach((t) => {
    const cid = t.page?.chapter?.chapter_id;
    const cTitle = t.page?.chapter?.title;
    if (!cid) return;
    if (!map[cid]) map[cid] = { chapter_id: cid, title: cTitle, total: 0, completed: 0 };
    map[cid].total++;
    if (t.status === 'completed') map[cid].completed++;
  });
  return Object.values(map);
};

module.exports = { getOverview, getPerformance, getBreakdown, getBySeries, getByChapter };
