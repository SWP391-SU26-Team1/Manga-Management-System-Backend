const taskService = require("./assistantTasks.service");
const perfService = require("./assistantPerformance.service");
const pageTaskFeedbacksRepo = require("../pageTaskFeedbacks/pageTaskFeedbacks.repository");
const submissionsService = require("../pageSubmissions/pageSubmissions.service");
const manuscriptFilesRepo = require("../manuscriptFiles/manuscriptFiles.repository");
const { createNotification } = require("../../utils/notification.helper");
const { sendSuccess } = require("../../utils/response");
const {
  parsePagination,
  buildPaginationMeta,
} = require("../../utils/pagination");
const supabase = require("../../config/supabase");
const AppError = require("../../utils/appError");

// --- Tasks ---
const listMyTasks = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, task_type, deadline_before, overdue } = req.query;
    const { data, total } = await taskService.listMyTasks(req.user.user_id, {
      status,
      taskType: task_type,
      deadlineBefore: deadline_before,
      overdue,
      offset,
      limit,
    });
    return res.status(200).json({
      success: true,
      message: "Success",
      data,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (e) {
    next(e);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const data = await taskService.getMyTaskById(
      req.user.user_id,
      req.params.taskId,
    );
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const getTaskDetail = async (req, res, next) => {
  try {
    const data = await taskService.getMyTaskDetail(
      req.user.user_id,
      req.params.taskId,
    );
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const taskWorkflow = (action) => async (req, res, next) => {
  try {
    const data = await taskService.performWorkflow(
      req.user.user_id,
      req.params.taskId,
      action,
      req.body.content,
    );
    return sendSuccess(res, 200, data, `Task ${action} successful`);
  } catch (e) {
    next(e);
  }
};

// --- Submissions ---
const createSubmission = async (req, res, next) => {
  try {
    const data = await submissionsService.submitTask(
      req.user.user_id,
      req.params.taskId,
      req.body,
    );
    return sendSuccess(res, 201, data, "Submission created");
  } catch (e) {
    next(e);
  }
};

const listTaskSubmissions = async (req, res, next) => {
  try {
    const data = await submissionsService.listSubmissions(
      req.params.taskId,
      req.user.user_id,
    );
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const getSubmissionById = async (req, res, next) => {
  try {
    const submission = await submissionsService.getSubmissionById(
      req.params.submissionId,
    );
    if (
      submission.assistant_id !== req.user.user_id &&
      req.user.role !== "admin"
    ) {
      return next(new AppError("Forbidden: not your submission", 403));
    }
    return sendSuccess(res, 200, submission, "Success");
  } catch (e) {
    next(e);
  }
};

// --- Feedbacks (now submission-scoped) ---
const listSubmissionFeedbacks = async (req, res, next) => {
  try {
    const submission = await submissionsService.getSubmissionById(
      req.params.submissionId,
    );
    if (
      submission.assistant_id !== req.user.user_id &&
      req.user.role !== "admin"
    ) {
      return next(new AppError("Forbidden: not your submission", 403));
    }
    const data = await pageTaskFeedbacksRepo.findBySubmissionId(
      req.params.submissionId,
    );
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const createSubmissionFeedback = async (req, res, next) => {
  try {
    const submission = await submissionsService.getSubmissionById(
      req.params.submissionId,
    );
    if (
      submission.assistant_id !== req.user.user_id &&
      req.user.role !== "admin"
    ) {
      return next(new AppError("Forbidden: not your submission", 403));
    }
    const data = await pageTaskFeedbacksRepo.create({
      submission_id: req.params.submissionId,
      assistant_id: req.user.user_id,
      mangaka_id: null,
      content: req.body.content,
    });
    return sendSuccess(res, 201, data, "Feedback created");
  } catch (e) {
    next(e);
  }
};

// --- Annotations ---
const listPageAnnotations = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("annotation")
      .select("*")
      .eq("page_id", req.params.pageId)
      .order("created_at");
    if (error) throw error;
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const listRegionAnnotations = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("annotation")
      .select("*")
      .eq("region_id", req.params.regionId)
      .order("created_at");
    if (error) throw error;
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const listTaskAnnotations = async (req, res, next) => {
  try {
    await taskService.getMyTaskById(req.user.user_id, req.params.taskId);
    const task = await taskService.getMyTaskById(
      req.user.user_id,
      req.params.taskId,
    );
    const { data, error } = await supabase
      .from("annotation")
      .select("*")
      .eq("page_id", task.page_id)
      .order("created_at");
    if (error) throw error;
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

// --- Manuscript Files ---
const listManuscriptFiles = async (req, res, next) => {
  try {
    const files = await manuscriptFilesRepo.findAll({
      manuscript_id: req.params.manuscriptId,
    });
    return sendSuccess(res, 200, files, "Success");
  } catch (e) {
    next(e);
  }
};

const addManuscriptFile = async (req, res, next) => {
  try {
    const data = await manuscriptFilesRepo.create({
      ...req.body,
      manuscript_id: req.params.manuscriptId,
    });
    return sendSuccess(res, 201, data, "File added");
  } catch (e) {
    next(e);
  }
};

const bulkAddManuscriptFiles = async (req, res, next) => {
  try {
    const rows = req.body.files.map((f) => ({
      ...f,
      manuscript_id: req.params.manuscriptId,
    }));
    const { data, error } = await supabase
      .from("manuscript_file")
      .insert(rows)
      .select();
    if (error) throw error;
    return sendSuccess(res, 201, data, "Files added");
  } catch (e) {
    next(e);
  }
};

// --- Performance ---
const dashboardOverview = async (req, res, next) => {
  try {
    const data = await perfService.getOverview(req.user.user_id);
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const dashboardPerformance = async (req, res, next) => {
  try {
    const data = await perfService.getPerformance(req.user.user_id);
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const performanceBreakdown = async (req, res, next) => {
  try {
    const data = await perfService.getBreakdown(req.user.user_id);
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const performanceBySeries = async (req, res, next) => {
  try {
    const data = await perfService.getBySeries(req.user.user_id);
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const performanceByChapter = async (req, res, next) => {
  try {
    const data = await perfService.getByChapter(req.user.user_id);
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

// --- Notifications ---
const listNotifications = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { is_read } = req.query;
    let query = supabase
      .from("notification")
      .select("*", { count: "exact" })
      .eq("user_id", req.user.user_id);
    if (is_read !== undefined) query = query.eq("is_read", is_read === "true");
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return res.status(200).json({
      success: true,
      message: "Success",
      data,
      pagination: buildPaginationMeta(page, limit, count),
    });
  } catch (e) {
    next(e);
  }
};

const getUnreadNotifications = async (req, res, next) => {
  try {
    const { data, error, count } = await supabase
      .from("notification")
      .select("*", { count: "exact" })
      .eq("user_id", req.user.user_id)
      .eq("is_read", false)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return sendSuccess(res, 200, { count, items: data }, "Success");
  } catch (e) {
    next(e);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("notification")
      .update({ is_read: true })
      .eq("notification_id", req.params.notificationId)
      .eq("user_id", req.user.user_id);
    if (error) throw error;
    return sendSuccess(res, 200, null, "Marked as read");
  } catch (e) {
    next(e);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("notification")
      .update({ is_read: true })
      .eq("user_id", req.user.user_id)
      .eq("is_read", false);
    if (error) throw error;
    return sendSuccess(res, 200, null, "All marked as read");
  } catch (e) {
    next(e);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("notification")
      .delete()
      .eq("notification_id", req.params.notificationId)
      .eq("user_id", req.user.user_id);
    if (error) throw error;
    return sendSuccess(res, 200, null, "Notification deleted");
  } catch (e) {
    next(e);
  }
};

module.exports = {
  listMyTasks,
  getTaskById,
  getTaskDetail,
  taskWorkflow,
  createSubmission,
  listTaskSubmissions,
  getSubmissionById,
  listSubmissionFeedbacks,
  createSubmissionFeedback,
  listPageAnnotations,
  listRegionAnnotations,
  listTaskAnnotations,
  listManuscriptFiles,
  addManuscriptFile,
  bulkAddManuscriptFiles,
  dashboardOverview,
  dashboardPerformance,
  performanceBreakdown,
  performanceBySeries,
  performanceByChapter,
  listNotifications,
  getUnreadNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification,
};
