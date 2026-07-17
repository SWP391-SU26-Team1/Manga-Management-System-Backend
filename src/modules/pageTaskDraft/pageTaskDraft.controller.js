const pageTaskDraftService = require('./pageTaskDraft.service');
const { sendSuccess } = require('../../utils/response');

const getDraft = async (req, res, next) => {
  try {
    const data = await pageTaskDraftService.getDraft(req.params.taskId, req.user.user_id);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) {
    next(error);
  }
};

const saveDraft = async (req, res, next) => {
  try {
    const data = await pageTaskDraftService.saveDraft(req.params.taskId, req.user.user_id, req.body);
    return sendSuccess(res, 200, data, 'Draft saved successfully.');
  } catch (error) {
    next(error);
  }
};

const deleteDraft = async (req, res, next) => {
  try {
    await pageTaskDraftService.deleteDraft(req.params.taskId, req.user.user_id);
    return sendSuccess(res, 200, null, 'Draft deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDraft,
  saveDraft,
  deleteDraft,
};
