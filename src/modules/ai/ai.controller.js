const aiService = require('./ai.service');
const { sendSuccess } = require('../../utils/response');

const panelDetection = async (req, res, next) => {
  try {
    const data = await aiService.createPanelDetection(req.params.pageId, req.user.user_id, req.body);
    return sendSuccess(res, 202, data, 'AI panel detection job initiated');
  } catch (error) {
    next(error);
  }
};

const smartColoring = async (req, res, next) => {
  try {
    const data = await aiService.createSmartColoring(req.params.taskId, req.user.user_id, req.user.role, req.body);
    return sendSuccess(res, 202, data, 'AI smart coloring job initiated');
  } catch (error) {
    next(error);
  }
};

const getSuggestion = async (req, res, next) => {
  try {
    const data = await aiService.getSuggestionById(req.params.suggestionId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) {
    next(error);
  }
};

const rejectSuggestion = async (req, res, next) => {
  try {
    const data = await aiService.rejectSuggestion(req.params.suggestionId, req.user.user_id, req.user.role);
    return sendSuccess(res, 200, data, 'AI suggestion rejected');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  panelDetection,
  smartColoring,
  getSuggestion,
  rejectSuggestion,
};
