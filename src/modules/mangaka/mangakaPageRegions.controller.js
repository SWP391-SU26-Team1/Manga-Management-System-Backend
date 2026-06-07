const service = require('./mangakaPageRegions.service');
const { sendSuccess } = require('../../utils/response');

const listRegions = async (req, res, next) => {
  try {
    const data = await service.listRegions(req.params.pageId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getRegionById = async (req, res, next) => {
  try {
    const data = await service.getRegionById(req.params.regionId, req.params.pageId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const createRegion = async (req, res, next) => {
  try {
    const data = await service.createRegion(req.params.pageId, req.body);
    return sendSuccess(res, 201, data, 'Region created');
  } catch (e) { next(e); }
};

const bulkCreateRegions = async (req, res, next) => {
  try {
    const data = await service.bulkCreateRegions(req.params.pageId, req.body.regions);
    return sendSuccess(res, 201, data, 'Regions created');
  } catch (e) { next(e); }
};

const updateRegion = async (req, res, next) => {
  try {
    const data = await service.updateRegion(req.params.regionId, req.params.pageId, req.body);
    return sendSuccess(res, 200, data, 'Region updated');
  } catch (e) { next(e); }
};

const deleteRegion = async (req, res, next) => {
  try {
    await service.deleteRegion(req.params.regionId, req.params.pageId);
    return sendSuccess(res, 200, null, 'Region deleted');
  } catch (e) { next(e); }
};

module.exports = { listRegions, getRegionById, createRegion, bulkCreateRegions, updateRegion, deleteRegion };
