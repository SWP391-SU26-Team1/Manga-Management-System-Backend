const submissionsRepo = require('./pageSubmissions.repository');
const pageVersionsRepo = require('../pageVersions/pageVersions.repository');
const tasksRepo = require('../pageTasks/pageTasks.repository');
const pagesRepo = require('../pages/pages.repository');
const feedbacksRepo = require('../pageTaskFeedbacks/pageTaskFeedbacks.repository');
const { createNotification } = require('../../utils/notification.helper');
const AppError = require('../../utils/appError');

/**
 * Assistant submits a page task:
 * 1. Validate task belongs to this assistant
 * 2. Create page_version (version_type = 'submitted')
 * 3. Create page_submission
 * 4. Update page_task.status = 'submitted'
 * 5. Notify mangaka/editor
 */
const submitTask = async (assistantId, taskId, { file_url, submission_notes }) => {
  const task = await tasksRepo.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);
  if (task.assistant_id !== assistantId) throw new AppError('Forbidden: not your task', 403);
  if (!['in_progress', 'needs_revision'].includes(task.status)) {
    throw new AppError(`Cannot submit task with status '${task.status}'`, 400);
  }

  // Auto-calculate next version number — avoids race-condition if frontend sends wrong number
  const nextVersion = await pageVersionsRepo.getNextVersionNumber(task.page_id);

  // 1. Create page_version
  const version = await pageVersionsRepo.create({
    page_id: task.page_id,
    image_url: file_url,
    version_number: nextVersion,
    version_type: 'submitted',
  });

  // 2. Create page_submission
  const submission = await submissionsRepo.create({
    page_id: task.page_id,
    task_id: taskId,
    assistant_id: assistantId,
    file_url,
    version_number: nextVersion,
    submission_notes: submission_notes || null,
    submission_status: 'pending',
  });

  // 3. Update task status
  await tasksRepo.update(taskId, { status: 'submitted', updated_at: new Date().toISOString() });

  // 4. Notify mangaka (assigned_by) and editor if present
  const notifyTargets = [task.assigned_by?.user_id].filter(Boolean);
  for (const userId of notifyTargets) {
    await createNotification(
      userId,
      'New page submission',
      `Assistant submitted page version ${nextVersion} for review.`,
      'submission_created'
    );
  }

  return { version, submission };
};

const listSubmissions = async (taskId, assistantId) => {
  const task = await tasksRepo.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);
  if (task.assistant_id !== assistantId) throw new AppError('Forbidden: not your task', 403);
  const { data } = await submissionsRepo.findAll({ taskId });
  return data;
};

const getSubmissionById = async (submissionId) => {
  const s = await submissionsRepo.findById(submissionId);
  if (!s) throw new AppError('Submission not found', 404);
  return s;
};

const listPendingSubmissions = async () => {
  const { data } = await submissionsRepo.findAll({ submissionStatus: 'pending' });
  return data;
};

/**
 * Review actions: approve / reject / request-revision
 * Updates submission status, task status, and page_version type on approve.
 */
const reviewSubmission = async (submissionId, action, reviewerId, { content } = {}) => {
  const submission = await submissionsRepo.findById(submissionId);
  if (!submission) throw new AppError('Submission not found', 404);
  if (submission.submission_status !== 'pending') {
    throw new AppError(`Submission is already '${submission.submission_status}'`, 400);
  }

  const now = new Date().toISOString();

  if (action === 'approve') {
    await submissionsRepo.update(submissionId, { submission_status: 'approved', reviewed_at: now });
    await tasksRepo.update(submission.task_id, { status: 'completed', updated_at: now });
    await pageVersionsRepo.updateByPageAndNumber(submission.page_id, submission.version_number, { version_type: 'approved' });
    // page.image_url always reflects the latest approved version
    await pagesRepo.update(submission.page_id, { image_url: submission.file_url, status: 'completed', updated_at: now });

    await createNotification(
      submission.assistant_id,
      'Submission approved',
      `Your page version ${submission.version_number} has been approved.`,
      'submission_approved'
    );
  } else if (action === 'reject') {
    await submissionsRepo.update(submissionId, { submission_status: 'rejected', reviewed_at: now });
    await tasksRepo.update(submission.task_id, { status: 'rejected', updated_at: now });

    await createNotification(
      submission.assistant_id,
      'Submission rejected',
      `Your page version ${submission.version_number} has been rejected.`,
      'submission_rejected'
    );
  } else if (action === 'request-revision') {
    if (!content) throw new AppError('Feedback content is required when requesting revision', 400);

    await submissionsRepo.update(submissionId, { submission_status: 'needs_revision', reviewed_at: now });
    await tasksRepo.update(submission.task_id, { status: 'needs_revision', updated_at: now });

    // Auto-create feedback record
    await feedbacksRepo.create({
      submission_id: submissionId,
      mangaka_id: reviewerId,
      assistant_id: submission.assistant_id,
      content,
    });

    await createNotification(
      submission.assistant_id,
      'Revision requested',
      `Reviewer requested changes on page version ${submission.version_number}: ${content}`,
      'submission_needs_revision'
    );
  } else {
    throw new AppError('Unknown review action', 400);
  }

  return submissionsRepo.findById(submissionId);
};

module.exports = { submitTask, listSubmissions, getSubmissionById, listPendingSubmissions, reviewSubmission };
