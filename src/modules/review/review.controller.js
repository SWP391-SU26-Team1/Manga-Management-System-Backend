const submissionsService = require('../pageSubmissions/pageSubmissions.service');
const feedbacksRepo = require('../pageTaskFeedbacks/pageTaskFeedbacks.repository');
const { sendSuccess } = require('../../utils/response');
const AppError = require('../../utils/appError');

const listPendingSubmissions = async (req, res, next) => {
  try {
    const data = await submissionsService.listPendingSubmissions();
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const getSubmissionById = async (req, res, next) => {
  try {
    const data = await submissionsService.getSubmissionById(req.params.submissionId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const approveSubmission = async (req, res, next) => {
  try {
    const data = await submissionsService.reviewSubmission(
      req.params.submissionId, 'approve', req.user.user_id
    );
    return sendSuccess(res, 200, data, 'Submission approved');
  } catch (e) { next(e); }
};

const rejectSubmission = async (req, res, next) => {
  try {
    const data = await submissionsService.reviewSubmission(
      req.params.submissionId, 'reject', req.user.user_id
    );
    return sendSuccess(res, 200, data, 'Submission rejected');
  } catch (e) { next(e); }
};

const requestRevision = async (req, res, next) => {
  try {
    const data = await submissionsService.reviewSubmission(
      req.params.submissionId, 'request-revision', req.user.user_id, { content: req.body.content }
    );
    return sendSuccess(res, 200, data, 'Revision requested');
  } catch (e) { next(e); }
};

// GET /api/page-submissions/:submissionId/feedbacks
const listFeedbacks = async (req, res, next) => {
  try {
    await submissionsService.getSubmissionById(req.params.submissionId); // 404 check
    const data = await feedbacksRepo.findBySubmissionId(req.params.submissionId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

// POST /api/page-submissions/:submissionId/feedbacks
const createFeedback = async (req, res, next) => {
  try {
    const submission = await submissionsService.getSubmissionById(req.params.submissionId);
    const isMangaka = req.user.role === 'mangaka' || req.user.role === 'admin';
    const data = await feedbacksRepo.create({
      submission_id: req.params.submissionId,
      mangaka_id: isMangaka ? req.user.user_id : null,
      assistant_id: !isMangaka ? req.user.user_id : submission.assistant_id,
      content: req.body.content,
    });
    return sendSuccess(res, 201, data, 'Feedback created');
  } catch (e) { next(e); }
};

module.exports = {
  listPendingSubmissions,
  getSubmissionById,
  approveSubmission,
  rejectSubmission,
  requestRevision,
  listFeedbacks,
  createFeedback,
};
