const service = require("./pageTaskFeedbacks.service");
const { sendSuccess } = require("../../utils/response");

const listFeedbacks = async (req, res, next) => {
  try {
    const data = await service.listFeedbacks();
    return sendSuccess(res, 200, data, "Success");
  } catch (error) {
    next(error);
  }
};

const getFeedbackById = async (req, res, next) => {
  try {
    const data = await service.getFeedbackById(req.params.feedbackId);
    return sendSuccess(res, 200, data, "Success");
  } catch (error) {
    next(error);
  }
};

const getFeedbacksBySubmission = async (req, res, next) => {
  try {
    const data = await service.getFeedbacksBySubmission(
      req.params.submissionId,
    );
    return sendSuccess(res, 200, data, "Success");
  } catch (error) {
    next(error);
  }
};

const createFeedback = async (req, res, next) => {
  try {
    const payload = req.params.submissionId
      ? { ...req.body, submission_id: req.params.submissionId }
      : req.body;
    const data = await service.createFeedback(payload);
    return sendSuccess(res, 201, data, "Feedback created");
  } catch (error) {
    next(error);
  }
};

const updateFeedback = async (req, res, next) => {
  try {
    const data = await service.updateFeedback(req.params.feedbackId, req.body);
    return sendSuccess(res, 200, data, "Feedback updated");
  } catch (error) {
    next(error);
  }
};

const deleteFeedback = async (req, res, next) => {
  try {
    await service.deleteFeedback(req.params.feedbackId);
    return sendSuccess(res, 200, null, "Feedback deleted");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listFeedbacks,
  getFeedbackById,
  getFeedbacksBySubmission,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};
