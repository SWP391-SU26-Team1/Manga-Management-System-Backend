const taskReviewSvc = require("./editorTaskReview.service");
const manuscriptReviewSvc = require("./editorManuscriptReview.service");
const dashboardSvc = require("./editorDashboard.service");
const seriesRepo = require("../series/series.repository");
const seriesMembersRepo = require("../seriesMembers/seriesMembers.repository");
const usersRepo = require("../users/users.repository");
const annotationsRepo = require("../annotations/annotations.repository");
const pageTaskFeedbacksRepo = require("../pageTaskFeedbacks/pageTaskFeedbacks.repository");
const reviewSessionsRepo = require("../reviewSessions/reviewSessions.repository");
const editorAlertsSvc = require("./editorAlerts.service");
const editorReportsSvc = require("./editorReports.service");
const editorProposalsSvc = require("./editorProposals.service");
const editorTeamSvc = require("./editorTeam.service");
const { sendSuccess } = require("../../utils/response");
const {
  parsePagination,
  buildPaginationMeta,
} = require("../../utils/pagination");
const supabase = require("../../config/supabase");
const AppError = require("../../utils/appError");

// --- Series ---
const listSeries = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, keyword } = req.query;
    let query = supabase.from("series").select("*", { count: "exact" });
    if (status) query = query.eq("status", status);
    if (keyword) query = query.ilike("title", `%${keyword}%`);
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return res
      .status(200)
      .json({
        success: true,
        message: "Success",
        data,
        pagination: buildPaginationMeta(page, limit, count),
      });
  } catch (e) {
    next(e);
  }
};

const getSeriesById = async (req, res, next) => {
  try {
    const data = await seriesRepo.findById(req.params.seriesId);
    if (!data) return next(new AppError("Series not found", 404));
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const getSeriesDetail = async (req, res, next) => {
  try {
    const data = await seriesRepo.findByIdWithDetail(req.params.seriesId);
    if (!data) return next(new AppError("Series not found", 404));
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const updateSeries = async (req, res, next) => {
  try {
    const data = await seriesRepo.update(req.params.seriesId, {
      ...req.body,
      updated_at: new Date().toISOString(),
    });
    return sendSuccess(res, 200, data, "Series updated");
  } catch (e) {
    next(e);
  }
};

const updateSeriesStatus = async (req, res, next) => {
  try {
    const data = await seriesRepo.update(req.params.seriesId, {
      status: req.body.status,
      updated_at: new Date().toISOString(),
    });
    return sendSuccess(res, 200, data, "Status updated");
  } catch (e) {
    next(e);
  }
};

const seriesWorkflow = (status) => async (req, res, next) => {
  try {
    const data = await seriesRepo.update(req.params.seriesId, {
      status,
      updated_at: new Date().toISOString(),
    });
    return sendSuccess(res, 200, data, `Series ${status}`);
  } catch (e) {
    next(e);
  }
};

// --- Team Management ---
const listMembers = async (req, res, next) => {
  try {
    const data = await seriesMembersRepo.findBySeriesId(req.params.seriesId);
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const addMember = async (req, res, next) => {
  try {
    const exists = await usersRepo.existsById(req.body.user_id);
    if (!exists) return next(new AppError("User not found", 404));
    const already = await seriesMembersRepo.findBySeriesAndUser(
      req.params.seriesId,
      req.body.user_id,
    );
    if (already) return next(new AppError("User already a member", 409));
    const data = await seriesMembersRepo.create({
      series_id: req.params.seriesId,
      user_id: req.body.user_id,
      role_in_series: req.body.role_in_series,
    });
    return sendSuccess(res, 201, data, "Member added");
  } catch (e) {
    next(e);
  }
};

const updateMember = async (req, res, next) => {
  try {
    const data = await seriesMembersRepo.update(req.params.seriesMemberId, {
      role_in_series: req.body.role_in_series,
    });
    return sendSuccess(res, 200, data, "Member updated");
  } catch (e) {
    next(e);
  }
};

const removeMember = async (req, res, next) => {
  try {
    await seriesMembersRepo.deleteById(req.params.seriesMemberId);
    return sendSuccess(res, 200, null, "Member removed");
  } catch (e) {
    next(e);
  }
};

// --- Dashboard ---
const dashboardOverview = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, await dashboardSvc.getOverview(), "Success");
  } catch (e) {
    next(e);
  }
};

const seriesProgress = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      200,
      await dashboardSvc.getSeriesProgress(req.params.seriesId),
      "Success",
    );
  } catch (e) {
    next(e);
  }
};

const chapterProgress = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      200,
      await dashboardSvc.getChapterProgress(req.params.chapterId),
      "Success",
    );
  } catch (e) {
    next(e);
  }
};

const taskSummary = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      200,
      await dashboardSvc.getTaskSummary(),
      "Success",
    );
  } catch (e) {
    next(e);
  }
};

const assistantsWorkload = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      200,
      await dashboardSvc.getAssistantsWorkload(),
      "Success",
    );
  } catch (e) {
    next(e);
  }
};

const assistantPerformance = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      200,
      await dashboardSvc.getAssistantPerformance(req.params.assistantId),
      "Success",
    );
  } catch (e) {
    next(e);
  }
};

// --- Task Review ---
const listReviewTasks = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, assistant_id, chapter_id, series_id } = req.query;
    const { data, total } = await taskReviewSvc.listReviewTasks({
      status,
      assistantId: assistant_id,
      chapterId: chapter_id,
      seriesId: series_id,
      offset,
      limit,
    });
    return res
      .status(200)
      .json({
        success: true,
        message: "Success",
        data,
        pagination: buildPaginationMeta(page, limit, total),
      });
  } catch (e) {
    next(e);
  }
};

const getReviewTaskById = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      200,
      await taskReviewSvc.getTaskById(req.params.taskId),
      "Success",
    );
  } catch (e) {
    next(e);
  }
};

const getReviewTaskDetail = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      200,
      await taskReviewSvc.getTaskDetail(req.params.taskId),
      "Success",
    );
  } catch (e) {
    next(e);
  }
};

const taskWorkflow = (action) => async (req, res, next) => {
  try {
    const data = await taskReviewSvc.performWorkflow(
      req.params.taskId,
      req.user.user_id,
      action,
      req.body,
    );
    return sendSuccess(res, 200, data || null, `Task ${action} successful`);
  } catch (e) {
    next(e);
  }
};

const bulkApproveTasks = async (req, res, next) => {
  try {
    await taskReviewSvc.bulkUpdateTasks(
      req.body.task_ids,
      "approved",
      req.user.user_id,
      req.body.note,
    );
    return sendSuccess(res, 200, null, "Tasks approved");
  } catch (e) {
    next(e);
  }
};

const bulkRejectTasks = async (req, res, next) => {
  try {
    await taskReviewSvc.bulkUpdateTasks(
      req.body.task_ids,
      "rejected",
      req.user.user_id,
      req.body.content,
    );
    return sendSuccess(res, 200, null, "Tasks rejected");
  } catch (e) {
    next(e);
  }
};

const bulkRequestRevision = async (req, res, next) => {
  try {
    await taskReviewSvc.bulkUpdateTasks(
      req.body.task_ids,
      "needs_revision",
      req.user.user_id,
      req.body.content,
    );
    return sendSuccess(res, 200, null, "Revision requested");
  } catch (e) {
    next(e);
  }
};

const bulkUpdateTaskStatus = async (req, res, next) => {
  try {
    await taskReviewSvc.bulkUpdateTasks(
      req.body.task_ids,
      req.body.status,
      req.user.user_id,
      req.body.note,
    );
    return sendSuccess(res, 200, null, "Tasks updated");
  } catch (e) {
    next(e);
  }
};

// --- Manuscript Review ---
const listReviewManuscripts = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, series_id, chapter_id } = req.query;
    const { data, total } = await manuscriptReviewSvc.listManuscripts({
      status,
      seriesId: series_id,
      chapterId: chapter_id,
      offset,
      limit,
    });
    return res
      .status(200)
      .json({
        success: true,
        message: "Success",
        data,
        pagination: buildPaginationMeta(page, limit, total),
      });
  } catch (e) {
    next(e);
  }
};

const getReviewManuscriptById = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      200,
      await manuscriptReviewSvc.getManuscriptById(req.params.manuscriptId),
      "Success",
    );
  } catch (e) {
    next(e);
  }
};

const getReviewManuscriptDetail = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      200,
      await manuscriptReviewSvc.getManuscriptDetail(req.params.manuscriptId),
      "Success",
    );
  } catch (e) {
    next(e);
  }
};

const manuscriptWorkflow = (action) => async (req, res, next) => {
  try {
    const data = await manuscriptReviewSvc.performWorkflow(
      req.params.manuscriptId,
      req.user.user_id,
      action,
      req.body,
    );
    return sendSuccess(
      res,
      200,
      data || null,
      `Manuscript ${action} successful`,
    );
  } catch (e) {
    next(e);
  }
};

const bulkApproveManuscripts = async (req, res, next) => {
  try {
    await manuscriptReviewSvc.bulkUpdateManuscripts(
      req.body.manuscript_ids,
      "approved",
    );
    return sendSuccess(res, 200, null, "Manuscripts approved");
  } catch (e) {
    next(e);
  }
};

const bulkRejectManuscripts = async (req, res, next) => {
  try {
    await manuscriptReviewSvc.bulkUpdateManuscripts(
      req.body.manuscript_ids,
      "rejected",
    );
    return sendSuccess(res, 200, null, "Manuscripts rejected");
  } catch (e) {
    next(e);
  }
};

const bulkUpdateManuscriptStatus = async (req, res, next) => {
  try {
    await manuscriptReviewSvc.bulkUpdateManuscripts(
      req.body.manuscript_ids,
      req.body.status,
    );
    return sendSuccess(res, 200, null, "Manuscripts updated");
  } catch (e) {
    next(e);
  }
};

// --- Annotations ---
const listAnnotationsByPage = async (req, res, next) => {
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

const listAnnotationsByRegion = async (req, res, next) => {
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

const listAnnotationsByTask = async (req, res, next) => {
  try {
    const task = await taskReviewSvc.getTaskById(req.params.taskId);
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

const getAnnotationById = async (req, res, next) => {
  try {
    const data = await annotationsRepo.findById(req.params.annotationId);
    if (!data) return next(new AppError("Annotation not found", 404));
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const createAnnotation = async (req, res, next) => {
  try {
    const data = await annotationsRepo.create({
      ...req.body,
      page_id: req.params.pageId,
      created_by: req.user.user_id,
    });
    return sendSuccess(res, 201, data, "Annotation created");
  } catch (e) {
    next(e);
  }
};

const updateAnnotation = async (req, res, next) => {
  try {
    const data = await annotationsRepo.update(req.params.annotationId, {
      ...req.body,
      updated_at: new Date().toISOString(),
    });
    return sendSuccess(res, 200, data, "Annotation updated");
  } catch (e) {
    next(e);
  }
};

const updateAnnotationStatus = async (req, res, next) => {
  try {
    const data = await annotationsRepo.update(req.params.annotationId, {
      status: req.body.status,
      updated_at: new Date().toISOString(),
    });
    return sendSuccess(res, 200, data, "Status updated");
  } catch (e) {
    next(e);
  }
};

const deleteAnnotation = async (req, res, next) => {
  try {
    await annotationsRepo.deleteById(req.params.annotationId);
    return sendSuccess(res, 200, null, "Annotation deleted");
  } catch (e) {
    next(e);
  }
};

// --- Feedbacks ---
const listTaskFeedbacks = async (req, res, next) => {
  try {
    const data = await pageTaskFeedbacksRepo.findByTaskId(req.params.taskId);
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const createFeedback = async (req, res, next) => {
  try {
    const data = await pageTaskFeedbacksRepo.create({
      ...req.body,
      task_id: req.params.taskId,
      mangaka_id: req.user.user_id,
    });
    return sendSuccess(res, 201, data, "Feedback created");
  } catch (e) {
    next(e);
  }
};

const updateFeedback = async (req, res, next) => {
  try {
    const data = await pageTaskFeedbacksRepo.update(req.params.feedbackId, {
      ...req.body,
      updated_at: new Date().toISOString(),
    });
    return sendSuccess(res, 200, data, "Feedback updated");
  } catch (e) {
    next(e);
  }
};

const updateFeedbackStatus = async (req, res, next) => {
  try {
    const data = await pageTaskFeedbacksRepo.update(req.params.feedbackId, {
      status: req.body.status,
      updated_at: new Date().toISOString(),
    });
    return sendSuccess(res, 200, data, "Feedback status updated");
  } catch (e) {
    next(e);
  }
};

const deleteFeedback = async (req, res, next) => {
  try {
    await pageTaskFeedbacksRepo.deleteById(req.params.feedbackId);
    return sendSuccess(res, 200, null, "Feedback deleted");
  } catch (e) {
    next(e);
  }
};

// --- Review Sessions ---
const listReviewSessions = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, error, count } = await supabase
      .from("review_session")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return res
      .status(200)
      .json({
        success: true,
        message: "Success",
        data,
        pagination: buildPaginationMeta(page, limit, count),
      });
  } catch (e) {
    next(e);
  }
};

const getReviewSessionById = async (req, res, next) => {
  try {
    const data = await reviewSessionsRepo.findById(req.params.sessionId);
    if (!data) return next(new AppError("Session not found", 404));
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const getReviewSessionDetail = async (req, res, next) => {
  try {
    const session = await reviewSessionsRepo.findById(req.params.sessionId);
    if (!session) return next(new AppError("Session not found", 404));
    const { data: votes } = await supabase
      .from("vote")
      .select("*, users:voter_id(user_id, username)")
      .eq("session_id", req.params.sessionId);
    return sendSuccess(res, 200, { ...session, votes: votes || [] }, "Success");
  } catch (e) {
    next(e);
  }
};

const createReviewSession = async (req, res, next) => {
  try {
    const data = await reviewSessionsRepo.create({
      ...req.body,
      created_by_user_id: req.user.user_id,
      status: "pending",
    });
    return sendSuccess(res, 201, data, "Review session created");
  } catch (e) {
    next(e);
  }
};

const updateReviewSession = async (req, res, next) => {
  try {
    const data = await reviewSessionsRepo.update(req.params.sessionId, {
      ...req.body,
      updated_at: new Date().toISOString(),
    });
    return sendSuccess(res, 200, data, "Session updated");
  } catch (e) {
    next(e);
  }
};

const reviewSessionWorkflow = (action) => async (req, res, next) => {
  try {
    const WORKFLOW = {
      start: "in_progress",
      pause: "paused",
      complete: "completed",
      finish: "finished",
      cancel: "cancelled",
    };
    const updates = {
      status: WORKFLOW[action],
      updated_at: new Date().toISOString(),
    };
    if (action === "start") updates.started_at = new Date().toISOString();
    if (["complete", "finish"].includes(action))
      updates.ended_at = new Date().toISOString();
    const data = await reviewSessionsRepo.update(req.params.sessionId, updates);
    return sendSuccess(res, 200, data, `Session ${action} successful`);
  } catch (e) {
    next(e);
  }
};

// Proposals (map to review_session)
const createProposal = async (req, res, next) => {
  try {
    const data = await editorProposalsSvc.createProposal(req.body);
    return sendSuccess(res, 201, data, "Proposal created");
  } catch (e) {
    next(e);
  }
};

const listAlerts = async (req, res, next) => {
  try {
    const data = await editorAlertsSvc.listAlerts({ type: req.query.type });
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const resolveAlert = async (req, res, next) => {
  try {
    const data = await editorAlertsSvc.resolveAlert(req.params.alert_id);
    if (!data) return next(new AppError("Alert not found", 404));
    return sendSuccess(res, 200, null, "Alert resolved");
  } catch (e) {
    next(e);
  }
};

const listReports = async (req, res, next) => {
  try {
    const data = await editorReportsSvc.listReports({
      status: req.query.status,
    });
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const createReport = async (req, res, next) => {
  try {
    const data = await editorReportsSvc.createReport(req.body);
    return sendSuccess(res, 201, data, "Report created");
  } catch (e) {
    next(e);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const data = await editorReportsSvc.updateReport(
      req.params.report_id,
      req.body,
    );
    if (!data) return next(new AppError("Report not found", 404));
    return sendSuccess(res, 200, data, "Report updated");
  } catch (e) {
    next(e);
  }
};

const submitReport = async (req, res, next) => {
  try {
    const data = await editorReportsSvc.submitReport(req.params.report_id);
    if (!data) return next(new AppError("Report not found", 404));
    return sendSuccess(res, 200, null, "Report submitted");
  } catch (e) {
    next(e);
  }
};

const listProposals = async (req, res, next) => {
  try {
    const data = await editorProposalsSvc.listProposals({
      type: req.query.type,
    });
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const listTeam = async (req, res, next) => {
  try {
    const data = await editorTeamSvc.listTeam({ role: req.query.role });
    return sendSuccess(res, 200, data, "Success");
  } catch (e) {
    next(e);
  }
};

const createTeamMember = async (req, res, next) => {
  try {
    const data = await editorTeamSvc.createTeamMember(req.body);
    return sendSuccess(res, 201, data, "Team member added");
  } catch (e) {
    next(e);
  }
};

const updateTeamMember = async (req, res, next) => {
  try {
    const data = await editorTeamSvc.updateTeamMember(
      req.params.user_id,
      req.body,
    );
    if (!data) return next(new AppError("Team member not found", 404));
    return sendSuccess(res, 200, data, "Team member updated");
  } catch (e) {
    next(e);
  }
};

const deleteTeamMember = async (req, res, next) => {
  try {
    const deleted = await editorTeamSvc.deleteTeamMember(req.params.user_id);
    if (!deleted) return next(new AppError("Team member not found", 404));
    return sendSuccess(res, 200, null, "Team member deleted");
  } catch (e) {
    next(e);
  }
};

const nudgeTeamMember = async (req, res, next) => {
  try {
    const data = await editorTeamSvc.nudgeTeamMember(req.params.user_id);
    if (!data) return next(new AppError("Team member not found", 404));
    return sendSuccess(res, 200, null, "Nudge sent");
  } catch (e) {
    next(e);
  }
};

const createMeeting = async (req, res, next) => {
  try {
    const data = await editorTeamSvc.createMeeting(req.body);
    return sendSuccess(res, 201, data, "Meeting scheduled");
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
    return res
      .status(200)
      .json({
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
    await supabase
      .from("notification")
      .update({ is_read: true })
      .eq("notification_id", req.params.notificationId)
      .eq("user_id", req.user.user_id);
    return sendSuccess(res, 200, null, "Marked as read");
  } catch (e) {
    next(e);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await supabase
      .from("notification")
      .update({ is_read: true })
      .eq("user_id", req.user.user_id)
      .eq("is_read", false);
    return sendSuccess(res, 200, null, "All marked as read");
  } catch (e) {
    next(e);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    await supabase
      .from("notification")
      .delete()
      .eq("notification_id", req.params.notificationId)
      .eq("user_id", req.user.user_id);
    return sendSuccess(res, 200, null, "Deleted");
  } catch (e) {
    next(e);
  }
};

module.exports = {
  listSeries,
  getSeriesById,
  getSeriesDetail,
  updateSeries,
  updateSeriesStatus,
  seriesWorkflow,
  listMembers,
  addMember,
  updateMember,
  removeMember,
  dashboardOverview,
  seriesProgress,
  chapterProgress,
  taskSummary,
  assistantsWorkload,
  assistantPerformance,
  listReviewTasks,
  getReviewTaskById,
  getReviewTaskDetail,
  taskWorkflow,
  bulkApproveTasks,
  bulkRejectTasks,
  bulkRequestRevision,
  bulkUpdateTaskStatus,
  listReviewManuscripts,
  getReviewManuscriptById,
  getReviewManuscriptDetail,
  manuscriptWorkflow,
  bulkApproveManuscripts,
  bulkRejectManuscripts,
  bulkUpdateManuscriptStatus,
  listAnnotationsByPage,
  listAnnotationsByRegion,
  listAnnotationsByTask,
  getAnnotationById,
  createAnnotation,
  updateAnnotation,
  updateAnnotationStatus,
  deleteAnnotation,
  listTaskFeedbacks,
  createFeedback,
  updateFeedback,
  updateFeedbackStatus,
  deleteFeedback,
  listReviewSessions,
  getReviewSessionById,
  getReviewSessionDetail,
  createReviewSession,
  updateReviewSession,
  reviewSessionWorkflow,
  listAlerts,
  resolveAlert,
  listReports,
  createReport,
  updateReport,
  submitReport,
  listProposals,
  createProposal,
  listTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  nudgeTeamMember,
  createMeeting,
  listNotifications,
  getUnreadNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification,
};
