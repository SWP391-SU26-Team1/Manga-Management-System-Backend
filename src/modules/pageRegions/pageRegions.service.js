const regionsRepo = require('./pageRegions.repository');
const pagesRepo = require('../pages/pages.repository');
const AppError = require('../../utils/appError');

const listRegions = async () => regionsRepo.findAll();

const getRegionById = async (regionId) => {
  const region = await regionsRepo.findById(regionId);
  if (!region) throw new AppError('Region not found', 404);
  return region;
};

const getRegionsByPage = async (pageId) => {
  const exists = await pagesRepo.existsById(pageId);
  if (!exists) throw new AppError('Page not found', 404);
  return regionsRepo.findByPageId(pageId);
};

const createRegion = async (payload) => {
  const pageExists = await pagesRepo.existsById(payload.page_id);
  if (!pageExists) throw new AppError('Page not found', 404);
  return regionsRepo.create(payload);
};

const updateRegion = async (regionId, payload) => {
  const region = await regionsRepo.findById(regionId);
  if (!region) throw new AppError('Region not found', 404);
  return regionsRepo.update(regionId, { ...payload, updated_at: new Date().toISOString() });
};

const deleteRegion = async (regionId) => {
  const region = await regionsRepo.findById(regionId);
  if (!region) throw new AppError('Region not found', 404);
  await regionsRepo.deleteById(regionId);
};

const deleteRegionByPage = async (pageId, regionId) => {
  const belongs = await regionsRepo.existsByIdAndPageId(regionId, pageId);
  if (!belongs) throw new AppError('Region not found in this page', 404);
  await regionsRepo.deleteById(regionId);
};

module.exports = { listRegions, getRegionById, getRegionsByPage, createRegion, updateRegion, deleteRegion, deleteRegionByPage };
