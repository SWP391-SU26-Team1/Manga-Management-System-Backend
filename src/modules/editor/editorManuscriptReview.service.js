const supabase = require('../../config/supabase');
const manuscriptsRepo = require('../manuscripts/manuscripts.repository');
const { createNotification, createNotifications } = require('../../utils/notification.helper');
const AppError = require('../../utils/appError');

const listManuscripts = async (filters) => {
  let query = supabase.from('manuscript').select('*', { count: 'exact' });
  if (filters.requestingUser && filters.requestingUser.role === 'editor') {
    const { data: memberships } = await supabase
      .from('series_member')
      .select('series_id')
      .eq('user_id', filters.requestingUser.user_id)
      .in('role_in_series', ['editor', 'pending_editor']);
      
    const seriesIds = (memberships || []).map(m => m.series_id);
    if (seriesIds.length === 0) {
      return { data: [], total: 0 };
    }
    query = query.in('series_id', seriesIds);
  }
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.seriesId) query = query.eq('series_id', filters.seriesId);
  if (filters.chapterId) query = query.eq('chapter_id', filters.chapterId);
  query = query.order('created_at', { ascending: false }).range(filters.offset, filters.offset + filters.limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const getManuscriptById = async (manuscriptId) => {
  const m = await manuscriptsRepo.findById(manuscriptId);
  if (!m) throw new AppError('Manuscript not found', 404);
  return m;
};

const getManuscriptDetail = async (manuscriptId) => {
  const m = await getManuscriptById(manuscriptId);
  const { data: files } = await supabase.from('manuscript_file').select('*').eq('manuscript_id', manuscriptId).order('uploaded_at');
  return { ...m, files: files || [] };
};

const MANUSCRIPT_WORKFLOW = {
  'start-review': { from: ['submitted'], to: 'in_review' },
  approve: { from: ['submitted', 'in_review'], to: 'approved' },
  reject: { from: ['submitted', 'in_review'], to: 'rejected' },
  publish: { from: ['approved'], to: 'published' },
  archive: { from: ['published'], to: 'archived' },
  'request-revision': null,
  'override-status': null,
};

const performWorkflow = async (manuscriptId, editorId, action, payload) => {
  const m = await getManuscriptById(manuscriptId);

  if (action === 'override-status') {
    if (!payload.status) throw new AppError('status required', 400);
    return manuscriptsRepo.update(manuscriptId, { status: payload.status, updated_at: new Date().toISOString() });
  }

  if (action === 'request-revision') {
    if (!['submitted', 'in_review'].includes(m.status)) throw new AppError(`Cannot request revision from '${m.status}'`, 400);
    return manuscriptsRepo.update(manuscriptId, { status: 'rejected', updated_at: new Date().toISOString() });
  }

  const rule = MANUSCRIPT_WORKFLOW[action];
  if (!rule) throw new AppError('Unknown workflow action', 400);
  if (!rule.from.includes(m.status)) throw new AppError(`Cannot perform '${action}' from '${m.status}'`, 400);

  if (rule.to === 'approved' && editorId) {
    const { data: existingMember } = await supabase
      .from('series_member')
      .select('*')
      .eq('series_id', m.series_id)
      .eq('user_id', editorId)
      .maybeSingle();

    if (!existingMember) {
      await supabase.from('series_member').insert({
        series_id: m.series_id,
        user_id: editorId,
        role_in_series: 'editor'
      });
    }
  }

  return manuscriptsRepo.update(manuscriptId, { status: rule.to, updated_at: new Date().toISOString() });
};

const bulkUpdateManuscripts = async (manuscriptIds, status, editorId) => {
  const updates = manuscriptIds.map((id) => supabase.from('manuscript').update({ status, updated_at: new Date().toISOString() }).eq('manuscript_id', id));
  await Promise.all(updates);

  if (status === 'approved' && editorId) {
    const { data: manuscripts } = await supabase
      .from('manuscript')
      .select('series_id')
      .in('manuscript_id', manuscriptIds);

    const seriesIds = [...new Set((manuscripts || []).map(m => m.series_id))];

    for (const sId of seriesIds) {
      const { data: existingMember } = await supabase
        .from('series_member')
        .select('*')
        .eq('series_id', sId)
        .eq('user_id', editorId)
        .maybeSingle();

      if (!existingMember) {
        await supabase.from('series_member').insert({
          series_id: sId,
          user_id: editorId,
          role_in_series: 'editor'
        });
      }
    }
  }
};

module.exports = { listManuscripts, getManuscriptById, getManuscriptDetail, performWorkflow, bulkUpdateManuscripts };
