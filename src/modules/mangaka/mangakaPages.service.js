const supabase = require('../../config/supabase');
const pagesRepo = require('../pages/pages.repository');
const AppError = require('../../utils/appError');

const PAGE_WORKFLOW = {
  approve: { from: ['pending_review'], to: 'approved' },
  reject: { from: ['pending_review'], to: 'rejected' },
  publish: { from: ['approved'], to: 'published' },
  hide: { from: ['published'], to: 'hidden' },
};

const listPages = async (chapterId, filters) => {
  let query = supabase
    .from('page')
    .select('*', { count: 'exact' })
    .eq('chapter_id', chapterId);
  if (filters.status) query = query.eq('status', filters.status);
  query = query.order('page_number', { ascending: true })
    .range(filters.offset, filters.offset + filters.limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const getPageById = async (pageId, chapterId) => {
  const page = await pagesRepo.findById(pageId);
  if (!page || page.chapter_id !== chapterId) throw new AppError('Page not found', 404);
  return page;
};

const getPageDetail = async (pageId, chapterId) => {
  const page = await pagesRepo.findByIdWithDetail(pageId);
  if (!page || page.chapter_id !== chapterId) throw new AppError('Page not found', 404);
  return page;
};

const createPage = async (chapterId, payload) => {
  let pageNumber = payload.page_number;
  if (!pageNumber) {
    const { data } = await supabase.from('page').select('page_number').eq('chapter_id', chapterId).order('page_number', { ascending: false }).limit(1).maybeSingle();
    pageNumber = (data?.page_number ?? 0) + 1;
  }
  return pagesRepo.create({ ...payload, chapter_id: chapterId, page_number: pageNumber, status: payload.status || 'draft' });
};

const bulkCreatePages = async (chapterId, pages) => {
  const { data: existing } = await supabase.from('page').select('page_number').eq('chapter_id', chapterId).order('page_number', { ascending: false }).limit(1).maybeSingle();
  let nextNum = (existing?.page_number ?? 0) + 1;

  const rows = pages.map((p, i) => ({
    chapter_id: chapterId,
    page_number: p.page_number ?? (nextNum + i),
    image_url: p.image_url || null,
    status: 'draft',
  }));
  const { data, error } = await supabase.from('page').insert(rows).select();
  if (error) throw error;
  return data;
};

const updatePage = async (pageId, chapterId, payload) => {
  await getPageById(pageId, chapterId);
  return pagesRepo.update(pageId, { ...payload, updated_at: new Date().toISOString() });
};

const reorderPage = async (pageId, chapterId, newNumber) => {
  await getPageById(pageId, chapterId);
  return pagesRepo.update(pageId, { page_number: newNumber, updated_at: new Date().toISOString() });
};

const performWorkflow = async (pageId, chapterId, action) => {
  const page = await getPageById(pageId, chapterId);
  const rule = PAGE_WORKFLOW[action];
  if (!rule) throw new AppError('Unknown workflow action', 400);
  if (!rule.from.includes(page.status))
    throw new AppError(`Cannot perform '${action}' from status '${page.status}'`, 400);
  return pagesRepo.update(pageId, { status: rule.to, updated_at: new Date().toISOString() });
};

const deletePage = async (pageId, chapterId) => {
  await getPageById(pageId, chapterId);
  return pagesRepo.update(pageId, { status: 'deleted', updated_at: new Date().toISOString() });
};

module.exports = {
  listPages, getPageById, getPageDetail,
  createPage, bulkCreatePages, updatePage, reorderPage, performWorkflow, deletePage,
};
