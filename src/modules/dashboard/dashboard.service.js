const supabase = require('../../config/supabase');

const getOverview = async () => {
  const [
    { count: total_users },
    { count: total_series },
    { count: total_chapters },
    { count: total_pages },
    { count: pending_tasks },
    { count: in_progress_tasks },
    { count: completed_tasks },
    { count: active_review_sessions },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('series').select('*', { count: 'exact', head: true }),
    supabase.from('chapter').select('*', { count: 'exact', head: true }),
    supabase.from('page').select('*', { count: 'exact', head: true }),
    supabase.from('page_task').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('page_task').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('page_task').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('review_session').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
  ]);

  return { total_users, total_series, total_chapters, total_pages, pending_tasks, in_progress_tasks, completed_tasks, active_review_sessions };
};

const getTaskSummary = async () => {
  const statuses = ['pending', 'assigned', 'in_progress', 'submitted', 'review', 'approved', 'needs_revision', 'completed', 'on_hold', 'cancelled', 'rejected'];
  const results = await Promise.all(
    statuses.map((s) => supabase.from('page_task').select('*', { count: 'exact', head: true }).eq('status', s))
  );
  return Object.fromEntries(statuses.map((s, i) => [s, results[i].count]));
};

const getReviewSummary = async () => {
  const { data, error } = await supabase
    .from('review_session')
    .select('status')
    .then(({ data, error }) => {
      if (error) throw error;
      const summary = {};
      for (const row of data) {
        summary[row.status] = (summary[row.status] || 0) + 1;
      }
      return { data: summary, error: null };
    });
  if (error) throw error;
  return data;
};

const getRankingSummary = async () => {
  const { data: periods, error } = await supabase
    .from('ranking_period')
    .select('period_id, name, status, calculated_at')
    .order('start_date', { ascending: false })
    .limit(5);
  if (error) throw error;
  return periods;
};

const getUserSummary = async () => {
  const roles = ['admin', 'mangaka', 'assistant', 'editor', 'reviewer', 'reader'];
  const results = await Promise.all(
    roles.map((r) => supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', r))
  );
  return Object.fromEntries(roles.map((r, i) => [r, results[i].count]));
};

module.exports = { getOverview, getTaskSummary, getReviewSummary, getRankingSummary, getUserSummary };
