const regionsRepo = require('./pageRegions.repository');
const pagesRepo = require('../pages/pages.repository');
const aiRepo = require('../ai/ai.repository');
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
  const { suggestion_id, ...regionData } = payload;
  const region = await regionsRepo.create(regionData);
  if (suggestion_id) {
    try {
      await aiRepo.markApplied(suggestion_id);
    } catch (err) {
      console.error('⚠️ Failed to mark AI suggestion as applied:', err.message);
    }
  }
  return region;
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

const bulkCreateRegions = async (pageId, regions, suggestionId) => {
  const pageExists = await pagesRepo.existsById(pageId);
  if (!pageExists) throw new AppError('Page not found', 404);

  // Map and clean up payloads to exactly match DB table columns
  const payloads = regions.map((r) => ({
    page_id: pageId,
    x: Math.round(Number(r.x)),
    y: Math.round(Number(r.y)),
    width: Math.round(Number(r.width)),
    height: Math.round(Number(r.height)),
  }));

  const data = await regionsRepo.bulkCreate(payloads);

  if (suggestionId) {
    try {
      await aiRepo.markApplied(suggestionId);
    } catch (err) {
      console.error('⚠️ Failed to mark AI suggestion as applied:', err.message);
    }
  }

  return data;
};

module.exports = { 
  listRegions, 
  getRegionById, 
  getRegionsByPage, 
  createRegion, 
  bulkCreateRegions, 
  updateRegion, 
  deleteRegion, 
  deleteRegionByPage 
};
