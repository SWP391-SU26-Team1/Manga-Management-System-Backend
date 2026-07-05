const supabase = require('../../config/supabase');
const pageRegionsRepo = require('../pageRegions/pageRegions.repository');
const aiRepo = require('../ai/ai.repository');
const AppError = require('../../utils/appError');

const listRegions = async (pageId) => {
  const { data, error } = await supabase.from('page_region').select('*').eq('page_id', pageId).order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

const getRegionById = async (regionId, pageId) => {
  const region = await pageRegionsRepo.findById(regionId);
  if (!region || region.page_id !== pageId) throw new AppError('Region not found', 404);
  return region;
};

const createRegion = async (pageId, payload) => {
  const { suggestion_id, ...rest } = payload;
  const region = await pageRegionsRepo.create({ ...rest, page_id: pageId });
  if (suggestion_id) {
    try {
      await aiRepo.markApplied(suggestion_id);
    } catch (err) {
      console.error('⚠️ Failed to mark AI suggestion as applied:', err.message);
    }
  }
  return region;
};

const bulkCreateRegions = async (pageId, regions, suggestionId) => {
  const rows = regions.map((r) => {
    const { suggestion_id, ...rest } = r;
    return { ...rest, page_id: pageId };
  });
  const { data, error } = await supabase.from('page_region').insert(rows).select();
  if (error) throw error;
  if (suggestionId) {
    try {
      await aiRepo.markApplied(suggestionId);
    } catch (err) {
      console.error('⚠️ Failed to mark AI suggestion as applied:', err.message);
    }
  }
  return data;
};

const updateRegion = async (regionId, pageId, payload) => {
  await getRegionById(regionId, pageId);
  return pageRegionsRepo.update(regionId, { ...payload, updated_at: new Date().toISOString() });
};

const deleteRegion = async (regionId, pageId) => {
  await getRegionById(regionId, pageId);
  return pageRegionsRepo.deleteById(regionId);
};

module.exports = { listRegions, getRegionById, createRegion, bulkCreateRegions, updateRegion, deleteRegion };
