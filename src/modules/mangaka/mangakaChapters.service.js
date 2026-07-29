const supabase = require('../../config/supabase');
const chaptersRepo = require('../chapters/chapters.repository');
const AppError = require('../../utils/appError');

const WORKFLOW = {
  'submit-review': { from: ['draft', 'rejected'], to: 'pending_review' },
  publish: { from: ['approved'], to: 'published' },
  hide: { from: ['published'], to: 'hidden' },
  archive: { from: ['published', 'hidden', 'approved', 'draft'], to: 'archived' },
  republish: { from: ['hidden', 'archived', 'approved'], to: 'published' },
};

const listChapters = async (seriesId, filters) => {
  let query = supabase
    .from('chapter')
    .select('*', { count: 'exact' })
    .eq('series_id', seriesId);

  if (filters.status) query = query.eq('status', filters.status);
  query = query.order('chapter_number', { ascending: true })
    .range(filters.offset, filters.offset + filters.limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const getChapterById = async (chapterId, seriesId) => {
  const chapter = await chaptersRepo.findById(chapterId);
  if (!chapter || chapter.series_id !== seriesId) throw new AppError('Chapter not found', 404);
  return chapter;
};

const getChapterDetail = async (chapterId, seriesId) => {
  const chapter = await chaptersRepo.findByIdWithDetail(chapterId);
  if (!chapter || chapter.series_id !== seriesId) throw new AppError('Chapter not found', 404);
  return chapter;
};

const createChapter = async (seriesId, payload) => {
  // auto increment chapter_number if not provided
  let chapterNumber = payload.chapter_number;
  if (!chapterNumber) {
    const { data } = await supabase
      .from('chapter')
      .select('chapter_number')
      .eq('series_id', seriesId)
      .order('chapter_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    chapterNumber = (data?.chapter_number ?? 0) + 1;
  }
  return chaptersRepo.create({ ...payload, series_id: seriesId, chapter_number: chapterNumber, status: payload.status || 'draft' });
};

const updateChapter = async (chapterId, seriesId, payload) => {
  await getChapterById(chapterId, seriesId);
  return chaptersRepo.update(chapterId, { ...payload, updated_at: new Date().toISOString() });
};

const reorderChapter = async (chapterId, seriesId, newNumber) => {
  await getChapterById(chapterId, seriesId);
  return chaptersRepo.update(chapterId, { chapter_number: newNumber, updated_at: new Date().toISOString() });
};

const performWorkflow = async (chapterId, seriesId, action) => {
  const chapter = await getChapterById(chapterId, seriesId);
  const rule = WORKFLOW[action];
  if (!rule) throw new AppError('Unknown workflow action', 400);
  
  const allowedFrom = action === 'submit-review'
    ? ['draft', 'rejected', 'approved', 'pending_review', 'need_fix']
    : rule.from;

  if (!allowedFrom.includes(chapter.status))
    throw new AppError(`Cannot perform '${action}' from status '${chapter.status}'`, 400);

  const result = await chaptersRepo.update(chapterId, { status: rule.to, updated_at: new Date().toISOString() });

  if (action === 'submit-review') {
    const { data: pages } = await supabase
      .from('page')
      .select('page_id')
      .eq('chapter_id', chapterId);
      
    if (pages && pages.length > 0) {
      const pageIds = pages.map(p => p.page_id);
      await supabase
        .from('page')
        .update({ status: 'completed' })
        .in('page_id', pageIds);
      await supabase
        .from('page_task')
        .update({ status: 'completed' })
        .in('page_id', pageIds);
    }

    try {
      const { createNotification } = require('../../utils/notification.helper');
      const { data: series } = await supabase
        .from('series')
        .select('title')
        .eq('series_id', seriesId)
        .single();
      const seriesTitle = series ? series.title : 'truyện';
      const chapTitle = chapter.title || `Chương ${chapter.chapter_number}`;
      
      const { data: members } = await supabase
        .from('series_member')
        .select('user_id')
        .eq('series_id', seriesId)
        .eq('role_in_series', 'editor');
      const editorIds = members ? members.map(m => m.user_id) : [];
      
      const { data: admins } = await supabase
        .from('users')
        .select('user_id')
        .eq('role', 'admin');
      const adminIds = admins ? admins.map(a => a.user_id) : [];
      
      for (const editorId of editorIds) {
        await createNotification(
          editorId,
          'Nộp Chapter mới',
          `${chapTitle} của bộ truyện "${seriesTitle}" đã hoàn thành xong bản vẽ và nộp lên hệ thống.`,
          'chapter_submitted'
        );
      }
      
      for (const adminId of adminIds) {
        await createNotification(
          adminId,
          'Nộp Chapter mới - Chờ mở vote',
          `${chapTitle} của bộ truyện "${seriesTitle}" đã hoàn thành xong bản vẽ. Vui lòng mở phiên bỏ phiếu thẩm định chất lượng.`,
          'chapter_submitted'
        );
      }
    } catch (err) {
      console.error('[Notification Error] Failed to send chapter submission notifications:', err);
    }
  }

  return result;
};

const copyFromChapter = async (seriesId, sourceChapterId, payload) => {
  const source = await chaptersRepo.findByIdWithDetail(sourceChapterId);
  if (!source) throw new AppError('Source chapter not found', 404);

  const newChapter = await createChapter(seriesId, {
    title: payload.title || `${source.title} (copy)`,
    description: source.description,
    cover_image_url: source.cover_image_url,
  });

  // copy pages if source has pages
  if (source.pages && source.pages.length > 0) {
    const newPages = source.pages.map((p) => ({
      chapter_id: newChapter.chapter_id,
      page_number: p.page_number,
      image_url: p.image_url,
      status: 'draft',
    }));
    const { error } = await supabase.from('page').insert(newPages);
    if (error) throw error;
  }

  return newChapter;
};

const deleteChapter = async (chapterId, seriesId) => {
  await getChapterById(chapterId, seriesId);
  return chaptersRepo.update(chapterId, { status: 'deleted', updated_at: new Date().toISOString() });
};

module.exports = {
  listChapters, getChapterById, getChapterDetail,
  createChapter, updateChapter, reorderChapter, performWorkflow, copyFromChapter, deleteChapter,
};
