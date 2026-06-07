const service = require('./pageRegions.service');
const { sendSuccess } = require('../../utils/response');

const listRegions = async (req, res, next) => {
  try {
    const data = await service.listRegions();
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getRegionById = async (req, res, next) => {
  try {
    const data = await service.getRegionById(req.params.regionId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getRegionsByPage = async (req, res, next) => {
  try {
    const data = await service.getRegionsByPage(req.params.pageId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const createRegion = async (req, res, next) => {
  try {
    const payload = req.params.pageId ? { ...req.body, page_id: req.params.pageId } : req.body;
    const data = await service.createRegion(payload);
    return sendSuccess(res, 201, data, 'Region created');
  } catch (error) { next(error); }
};

const updateRegion = async (req, res, next) => {
  try {
    const data = await service.updateRegion(req.params.regionId, req.body);
    return sendSuccess(res, 200, data, 'Region updated');
  } catch (error) { next(error); }
};

const deleteRegion = async (req, res, next) => {
  try {
    await service.deleteRegion(req.params.regionId);
    return sendSuccess(res, 200, null, 'Region deleted');
  } catch (error) { next(error); }
};

const deleteRegionByPage = async (req, res, next) => {
  try {
    await service.deleteRegionByPage(req.params.pageId, req.params.regionId);
    return sendSuccess(res, 200, null, 'Region deleted');
  } catch (error) { next(error); }
};

module.exports = { listRegions, getRegionById, getRegionsByPage, createRegion, updateRegion, deleteRegion, deleteRegionByPage };
