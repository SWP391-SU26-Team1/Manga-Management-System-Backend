const feedbackRepo = require("./pageTaskFeedbacks.repository");
const submissionsRepo = require("../pageSubmissions/pageSubmissions.repository");
const usersRepo = require("../users/users.repository");
const AppError = require("../../utils/appError");

const listFeedbacks = async () => feedbackRepo.findAll();

const getFeedbackById = async (feedbackId) => {
  const feedback = await feedbackRepo.findById(feedbackId);
  if (!feedback) throw new AppError("Feedback not found", 404);
  return feedback;
};

const getFeedbacksBySubmission = async (submissionId) => {
  const submission = await submissionsRepo.findById(submissionId);
  if (!submission) throw new AppError("Submission not found", 404);
  return feedbackRepo.findBySubmissionId(submissionId);
};

const createFeedback = async (payload) => {
  const submission = await submissionsRepo.findById(payload.submission_id);
  if (!submission) throw new AppError("Submission not found", 404);

  if (payload.mangaka_id) {
    const exists = await usersRepo.existsById(payload.mangaka_id);
    if (!exists) throw new AppError("Mangaka user not found", 404);
  }
  if (payload.assistant_id) {
    const exists = await usersRepo.existsById(payload.assistant_id);
    if (!exists) throw new AppError("Assistant user not found", 404);
  }

  return feedbackRepo.create(payload);
};

const updateFeedback = async (feedbackId, payload) => {
  const feedback = await feedbackRepo.findById(feedbackId);
  if (!feedback) throw new AppError("Feedback not found", 404);
  return feedbackRepo.update(feedbackId, payload);
};

const deleteFeedback = async (feedbackId) => {
  const feedback = await feedbackRepo.findById(feedbackId);
  if (!feedback) throw new AppError("Feedback not found", 404);
  await feedbackRepo.deleteById(feedbackId);
};

module.exports = {
  listFeedbacks,
  getFeedbackById,
  getFeedbacksBySubmission,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};
