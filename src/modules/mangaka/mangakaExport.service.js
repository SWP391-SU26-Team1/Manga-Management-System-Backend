const supabase = require('../../config/supabase');
const seriesMembersRepo = require('../seriesMembers/seriesMembers.repository');
const AppError = require('../../utils/appError');

const assertMember = async (userId, seriesId) => {
  const m = await seriesMembersRepo.findBySeriesAndUser(seriesId, userId);
  if (!m) throw new AppError('Access denied', 403);
};

const exportSeries = async (userId, seriesId) => {
  await assertMember(userId, seriesId);

  const { data: series, error: sErr } = await supabase.from('series').select('*').eq('series_id', seriesId).maybeSingle();
  if (sErr || !series) throw new AppError('Series not found', 404);

  const { data: chapters } = await supabase.from('chapter').select('*').eq('series_id', seriesId).order('chapter_number');
  const chapterIds = (chapters || []).map((c) => c.chapter_id);

  let pages = [];
  if (chapterIds.length > 0) {
    const { data } = await supabase.from('page').select('*').in('chapter_id', chapterIds).order('page_number');
    pages = data || [];
  }

  const pageIds = pages.map((p) => p.page_id);
  let regions = [];
  let tasks = [];
  if (pageIds.length > 0) {
    const [{ data: r }, { data: t }] = await Promise.all([
      supabase.from('page_region').select('*').in('page_id', pageIds),
      supabase.from('page_task').select('*').in('page_id', pageIds),
    ]);
    regions = r || [];
    tasks = t || [];
  }

  const { data: members } = await supabase.from('series_member').select('*').eq('series_id', seriesId);
  const { data: manuscripts } = await supabase.from('manuscript').select('*').eq('series_id', seriesId);

  return {
    exported_at: new Date().toISOString(),
    series,
    chapters: chapters || [],
    pages,
    regions,
    tasks,
    members: members || [],
    manuscripts: manuscripts || [],
  };
};

const exportChapter = async (userId, seriesId, chapterId) => {
  await assertMember(userId, seriesId);

  const { data: chapter, error } = await supabase.from('chapter').select('*').eq('chapter_id', chapterId).eq('series_id', seriesId).maybeSingle();
  if (error || !chapter) throw new AppError('Chapter not found', 404);

  const { data: pages } = await supabase.from('page').select('*').eq('chapter_id', chapterId).order('page_number');
  const pageIds = (pages || []).map((p) => p.page_id);

  let regions = [];
  let tasks = [];
  if (pageIds.length > 0) {
    const [{ data: r }, { data: t }] = await Promise.all([
      supabase.from('page_region').select('*').in('page_id', pageIds),
      supabase.from('page_task').select('*').in('page_id', pageIds),
    ]);
    regions = r || [];
    tasks = t || [];
  }

  return { exported_at: new Date().toISOString(), chapter, pages: pages || [], regions, tasks };
};

module.exports = { exportSeries, exportChapter };
