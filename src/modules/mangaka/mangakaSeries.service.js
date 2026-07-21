const supabase = require('../../config/supabase');
const seriesRepo = require('../series/series.repository');
const seriesMembersRepo = require('../seriesMembers/seriesMembers.repository');
const usersRepo = require('../users/users.repository');
const AppError = require('../../utils/appError');
const scheduleStorage = require('../../utils/scheduleStorage');

const SERIES_STATUS = require('../../constants/status').SERIES_STATUS;

const WORKFLOW = {
  'submit-review': { from: ['draft', 'rejected'], to: 'pending_review' },
  publish: { from: ['approved'], to: 'published' },
  republish: { from: ['hidden', 'archived', 'draft', 'approved'], to: 'published' },
  hide: { from: ['published'], to: 'hidden' },
  archive: { from: ['published', 'hidden', 'approved', 'draft'], to: 'archived' },
};

// List only series the mangaka belongs to
const listMySeries = async (userId, filters) => {
  const { data: memberships, error } = await supabase
    .from('series_member')
    .select('series_id')
    .eq('user_id', userId);
  if (error) throw error;

  const ids = memberships.map((m) => m.series_id);
  if (ids.length === 0) return { data: [], total: 0 };

  let query = supabase.from('series').select('*', { count: 'exact' }).in('series_id', ids);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.keyword) query = query.ilike('title', `%${filters.keyword}%`);
  query = query.order('created_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  const { data, error: err, count } = await query;
  if (err) throw err;
  return { data, total: count };
};

const getMySeriesById = async (userId, seriesId) => {
  const series = await seriesRepo.findById(seriesId);
  if (!series) throw new AppError('Series not found', 404);
  await assertMember(userId, seriesId);
  return {
    ...series,
    publishSchedule: scheduleStorage.getSeriesSchedule(seriesId) || 'Weekly',
    proposedStartDate: scheduleStorage.getSeriesProposedStartDate(seriesId) || null
  };
};

const getMySeriesDetail = async (userId, seriesId) => {
  await assertMember(userId, seriesId);
  const series = await seriesRepo.findByIdWithDetail(seriesId);
  if (!series) throw new AppError('Series not found', 404);
  return {
    ...series,
    publishSchedule: scheduleStorage.getSeriesSchedule(seriesId) || 'Weekly',
    proposedStartDate: scheduleStorage.getSeriesProposedStartDate(seriesId) || null
  };
};

const createSeries = async (userId, payload) => {
  const { publishSchedule, proposedStartDate, ...seriesData } = payload;
  const series = await seriesRepo.create({ ...seriesData, view_count: 0, status: seriesData.status || 'draft' });
  // auto-add mangaka as owner
  await seriesMembersRepo.create({ series_id: series.series_id, user_id: userId, role_in_series: 'owner' });
  
  if (publishSchedule) {
    scheduleStorage.setSeriesSchedule(series.series_id, publishSchedule);
  }
  if (proposedStartDate) {
    scheduleStorage.setSeriesProposedStartDate(series.series_id, proposedStartDate);
  }
  
  return series;
};

const updateSeries = async (userId, seriesId, payload) => {
  await assertMember(userId, seriesId);
  const { publishSchedule, proposedStartDate, ...seriesData } = payload;
  
  if (publishSchedule) {
    scheduleStorage.setSeriesSchedule(seriesId, publishSchedule);
  }
  if (proposedStartDate) {
    scheduleStorage.setSeriesProposedStartDate(seriesId, proposedStartDate);
  }
  
  return seriesRepo.update(seriesId, { ...seriesData, updated_at: new Date().toISOString() });
};

const updateSeriesStatus = async (userId, seriesId, status) => {
  await assertMember(userId, seriesId);
  return seriesRepo.update(seriesId, { status, updated_at: new Date().toISOString() });
};

const performWorkflow = async (userId, seriesId, action) => {
  await assertMember(userId, seriesId);
  const series = await seriesRepo.findById(seriesId);
  if (!series) throw new AppError('Series not found', 404);

  const rule = WORKFLOW[action];
  if (!rule) throw new AppError('Unknown workflow action', 400);
  if (!rule.from.includes(series.status))
    throw new AppError(`Cannot perform '${action}' from status '${series.status}'`, 400);

  return seriesRepo.update(seriesId, { status: rule.to, updated_at: new Date().toISOString() });
};

// soft delete
const deleteSeries = async (userId, seriesId) => {
  await assertMember(userId, seriesId);
  return seriesRepo.update(seriesId, { status: 'deleted', updated_at: new Date().toISOString() });
};

// --- Members ---
const listMembers = async (userId, seriesId) => {
  await assertMember(userId, seriesId);
  return seriesMembersRepo.findBySeriesId(seriesId);
};

const addMember = async (userId, seriesId, { user_id, role_in_series }) => {
  await assertMember(userId, seriesId);
  const userExists = await usersRepo.existsById(user_id);
  if (!userExists) throw new AppError('User not found', 404);
  const existing = await seriesMembersRepo.findBySeriesAndUser(seriesId, user_id);
  if (existing) throw new AppError('User is already a member of this series', 409);
  return seriesMembersRepo.create({ series_id: seriesId, user_id, role_in_series });
};

const updateMember = async (userId, seriesId, seriesMemberId, { role_in_series }) => {
  await assertMember(userId, seriesId);
  const member = await seriesMembersRepo.findById(seriesMemberId);
  if (!member || member.series_id !== seriesId) throw new AppError('Member not found in this series', 404);
  return seriesMembersRepo.update(seriesMemberId, { role_in_series });
};

const removeMember = async (userId, seriesId, seriesMemberId) => {
  await assertMember(userId, seriesId);
  const member = await seriesMembersRepo.findById(seriesMemberId);
  if (!member || member.series_id !== seriesId) throw new AppError('Member not found in this series', 404);
  await seriesMembersRepo.deleteById(seriesMemberId);
};

// helper
const assertMember = async (userId, seriesId) => {
  const member = await seriesMembersRepo.findBySeriesAndUser(seriesId, userId);
  if (!member) throw new AppError('Access denied: you are not a member of this series', 403);
};

module.exports = {
  listMySeries, getMySeriesById, getMySeriesDetail,
  createSeries, updateSeries, updateSeriesStatus, performWorkflow, deleteSeries,
  listMembers, addMember, updateMember, removeMember,
};
