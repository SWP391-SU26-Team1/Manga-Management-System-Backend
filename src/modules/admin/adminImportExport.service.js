const supabase = require('../../config/supabase');

const exportFullSystem = async () => {
  const [{ data: users }, { data: series }, { data: chapters }, { data: pages }, { data: tasks }, { data: rankingPeriods }, { data: seriesRankings }, { data: chapterRankings }, { data: reviewSessions }, { data: votes }] = await Promise.all([
    supabase.from('users').select('user_id, username, email, role, status, created_at'),
    supabase.from('series').select('*'),
    supabase.from('chapter').select('*'),
    supabase.from('page').select('*'),
    supabase.from('page_task').select('*'),
    supabase.from('ranking_period').select('*'),
    supabase.from('series_ranking').select('*'),
    supabase.from('chapter_ranking').select('*'),
    supabase.from('review_session').select('*'),
    supabase.from('vote').select('*'),
  ]);
  return { exported_at: new Date().toISOString(), users, series, chapters, pages, tasks, rankingPeriods, seriesRankings, chapterRankings, reviewSessions, votes };
};

const exportSeries = async (seriesId) => {
  const { data: series } = await supabase.from('series').select('*').eq('series_id', seriesId).maybeSingle();
  const { data: chapters } = await supabase.from('chapter').select('*').eq('series_id', seriesId);
  const { data: members } = await supabase.from('series_member').select('*').eq('series_id', seriesId);
  const { data: manuscripts } = await supabase.from('manuscript').select('*').eq('series_id', seriesId);
  return { exported_at: new Date().toISOString(), series, chapters: chapters || [], members: members || [], manuscripts: manuscripts || [] };
};

const exportUsers = async () => {
  const { data, error } = await supabase.from('users').select('user_id, username, email, role, status, created_at');
  if (error) throw error;
  return { exported_at: new Date().toISOString(), users: data };
};

const exportRankings = async () => {
  const [{ data: periods }, { data: seriesR }, { data: chapterR }] = await Promise.all([
    supabase.from('ranking_period').select('*').order('start_date'),
    supabase.from('series_ranking').select('*').order('rank_position'),
    supabase.from('chapter_ranking').select('*').order('rank_position'),
  ]);
  return { exported_at: new Date().toISOString(), periods, series_rankings: seriesR, chapter_rankings: chapterR };
};

const importUsers = async (usersPayload) => {
  const bcrypt = require('bcryptjs');
  const rows = await Promise.all(usersPayload.map(async (u) => ({
    ...u,
    password: u.password ? await bcrypt.hash(u.password, 10) : undefined,
  })));
  const { data, error } = await supabase.from('users').upsert(rows, { onConflict: 'email' }).select();
  if (error) throw error;
  return { imported: data?.length ?? 0 };
};

const importSeries = async (seriesPayload) => {
  const { chapters = [], ...seriesData } = seriesPayload;
  const { data: series, error: sErr } = await supabase.from('series').insert(seriesData).select().single();
  if (sErr) throw sErr;

  let chaptersImported = 0;
  for (const c of chapters) {
    const { data: chapter } = await supabase.from('chapter').insert({ ...c, series_id: series.series_id }).select().single();
    chaptersImported++;
  }
  return { series_id: series.series_id, chapters_imported: chaptersImported };
};

const importRankings = async (payload) => {
  const { series_rankings = [], chapter_rankings = [] } = payload;
  let seriesCount = 0, chapterCount = 0;
  if (series_rankings.length) {
    const { data } = await supabase.from('series_ranking').upsert(series_rankings, { onConflict: 'series_id,period_id' }).select();
    seriesCount = data?.length ?? 0;
  }
  if (chapter_rankings.length) {
    const { data } = await supabase.from('chapter_ranking').upsert(chapter_rankings, { onConflict: 'chapter_id,period_id' }).select();
    chapterCount = data?.length ?? 0;
  }
  return { series_rankings_imported: seriesCount, chapter_rankings_imported: chapterCount };
};

module.exports = { exportFullSystem, exportSeries, exportUsers, exportRankings, importUsers, importSeries, importRankings };
