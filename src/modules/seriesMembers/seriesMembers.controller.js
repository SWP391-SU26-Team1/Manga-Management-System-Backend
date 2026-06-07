const service = require('./seriesMembers.service');
const { sendSuccess } = require('../../utils/response');

const listMembers = async (req, res, next) => {
  try {
    const data = await service.listMembers();
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getMemberById = async (req, res, next) => {
  try {
    const data = await service.getMemberById(req.params.seriesMemberId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getMembersBySeries = async (req, res, next) => {
  try {
    const data = await service.getMembersBySeries(req.params.seriesId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const addMember = async (req, res, next) => {
  try {
    const payload = req.params.seriesId
      ? { ...req.body, series_id: req.params.seriesId }
      : req.body;
    const data = await service.addMember(payload);
    return sendSuccess(res, 201, data, 'Member added');
  } catch (error) { next(error); }
};

const updateMember = async (req, res, next) => {
  try {
    const data = await service.updateMember(req.params.seriesMemberId, req.body);
    return sendSuccess(res, 200, data, 'Member updated');
  } catch (error) { next(error); }
};

const removeMember = async (req, res, next) => {
  try {
    await service.removeMember(req.params.seriesMemberId);
    return sendSuccess(res, 200, null, 'Member removed');
  } catch (error) { next(error); }
};

const removeMemberBySeries = async (req, res, next) => {
  try {
    await service.removeMemberBySeries(req.params.seriesId, req.params.userId);
    return sendSuccess(res, 200, null, 'Member removed');
  } catch (error) { next(error); }
};

module.exports = { listMembers, getMemberById, getMembersBySeries, addMember, updateMember, removeMember, removeMemberBySeries };
