const supabase = require('../../config/supabase');
const pageRegionsRepo = require('../pageRegions/pageRegions.repository');
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
  return pageRegionsRepo.create({ ...payload, page_id: pageId });
};

const bulkCreateRegions = async (pageId, regions) => {
  const rows = regions.map((r) => ({ ...r, page_id: pageId }));
  const { data, error } = await supabase.from('page_region').insert(rows).select();
  if (error) throw error;
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
