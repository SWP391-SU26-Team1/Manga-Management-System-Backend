const membersRepo = require('./seriesMembers.repository');
const seriesRepo = require('../series/series.repository');
const usersRepo = require('../users/users.repository');
const AppError = require('../../utils/appError');

const listMembers = async () => membersRepo.findAll();

const getMemberById = async (seriesMemberId) => {
  const member = await membersRepo.findById(seriesMemberId);
  if (!member) throw new AppError('Series member not found', 404);
  return member;
};

const getMembersBySeries = async (seriesId) => {
  const exists = await seriesRepo.existsById(seriesId);
  if (!exists) throw new AppError('Series not found', 404);
  return membersRepo.findBySeriesId(seriesId);
};

const addMember = async ({ series_id, user_id, role_in_series }) => {
  const seriesExists = await seriesRepo.existsById(series_id);
  if (!seriesExists) throw new AppError('Series not found', 404);

  const userExists = await usersRepo.existsById(user_id);
  if (!userExists) throw new AppError('User not found', 404);

  const existing = await membersRepo.findBySeriesAndUser(series_id, user_id);
  if (existing) throw new AppError('User is already a member of this series', 409);

  return membersRepo.create({ series_id, user_id, role_in_series });
};

const updateMember = async (seriesMemberId, { role_in_series }) => {
  const member = await membersRepo.findById(seriesMemberId);
  if (!member) throw new AppError('Series member not found', 404);
  return membersRepo.update(seriesMemberId, { role_in_series });
};

const removeMember = async (seriesMemberId) => {
  const member = await membersRepo.findById(seriesMemberId);
  if (!member) throw new AppError('Series member not found', 404);
  await membersRepo.deleteById(seriesMemberId);
};

const removeMemberBySeries = async (seriesId, userId) => {
  const existing = await membersRepo.findBySeriesAndUser(seriesId, userId);
  if (!existing) throw new AppError('Member not found in this series', 404);
  await membersRepo.deleteBySeriesAndUser(seriesId, userId);
};

module.exports = { listMembers, getMemberById, getMembersBySeries, addMember, updateMember, removeMember, removeMemberBySeries };
