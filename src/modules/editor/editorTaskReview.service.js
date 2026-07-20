const supabase = require("../../config/supabase");
const pageTasksRepo = require("../pageTasks/pageTasks.repository");
const pageTaskFeedbacksRepo = require("../pageTaskFeedbacks/pageTaskFeedbacks.repository");
const {
  createNotification,
  createNotifications,
} = require("../../utils/notification.helper");
const AppError = require("../../utils/appError");

const TASK_SELECT = `*, page:page_id(page_id,page_number,chapter:chapter_id(chapter_id,title,series:series_id(series_id,title))), assistant:users!fk_page_task_assistant(user_id,username,email), assigned_by:users!fk_page_task_assigned_by(user_id,username,email)`;

const listReviewTasks = async (filters) => {
  // Get page IDs if filtering by chapter or series (Supabase doesn't support nested filter directly)
  let pageIds = null;

  if (filters.chapterId) {
    const { data: pages, error: pageError } = await supabase
      .from("page")
      .select("page_id", { count: "exact" })
      .eq("chapter_id", filters.chapterId);
    if (pageError) throw pageError;
    pageIds = pages?.map((p) => p.page_id) || [];
  }

  if (filters.seriesId && !filters.chapterId) {
    // Get chapters from series, then pages from those chapters
    const { data: chapters } = await supabase
      .from("chapter")
      .select("chapter_id")
      .eq("series_id", filters.seriesId);
    const chapterIds = chapters?.map((c) => c.chapter_id) || [];

    if (chapterIds.length === 0) {
      return { data: [], total: 0 };
    }

    const { data: pages, error: pageError } = await supabase
      .from("page")
      .select("page_id")
      .in("chapter_id", chapterIds);
    if (pageError) throw pageError;
    pageIds = pages?.map((p) => p.page_id) || [];
  }

  // Query page_tasks
  let query = supabase
    .from("page_task")
    .select(TASK_SELECT, { count: "exact" });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.assistantId)
    query = query.eq("assistant_id", filters.assistantId);

  // Filter by pages if chapter/series filter was applied
  if (pageIds !== null) {
    if (pageIds.length === 0) {
      return { data: [], total: 0 };
    }
    query = query.in("page_id", pageIds);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const getTaskById = async (taskId) => {
  const { data, error } = await supabase
    .from("page_task")
    .select(TASK_SELECT)
    .eq("task_id", taskId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("Task not found", 404);
  return data;
};

const getTaskDetail = async (taskId) => {
  const task = await getTaskById(taskId);
  const [{ data: annotations }, { data: feedbacks }] = await Promise.all([
    supabase.from("annotation").select("*").eq("page_id", task.page_id),
    supabase
      .from("page_task_feedback")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at"),
  ]);
  return {
    ...task,
    annotations: annotations || [],
    feedbacks: feedbacks || [],
  };
};

const REVIEW_WORKFLOW = {
  "start-review": { from: ["submitted"], to: "in_review" },
  approve: { from: ["submitted", "in_review"], to: "approved" },
  reject: { from: ["submitted", "in_review"], to: "rejected" },
  complete: { from: ["approved"], to: "completed" },
  "override-status": null,
};

const performWorkflow = async (taskId, editorId, action, payload) => {
  const task = await getTaskById(taskId);

  if (action === "override-status") {
    if (!payload.status)
      throw new AppError("status required for override", 400);
    return pageTasksRepo.update(taskId, {
      status: payload.status,
      updated_at: new Date().toISOString(),
    });
  }

  if (action === "request-revision") {
    if (!["submitted", "in_review"].includes(task.status))
      throw new AppError(
        `Cannot request revision from status '${task.status}'`,
        400,
      );
    await pageTasksRepo.update(taskId, {
      status: "needs_revision",
      updated_at: new Date().toISOString(),
    });
    if (payload.content) {
      await pageTaskFeedbacksRepo.create({
        task_id: taskId,
        mangaka_id: editorId,
        assistant_id: task.assistant_id,
        feedback_content: payload.content,
        feedback_type: "revision_request",
        status: "pending",
      });
    }
    if (task.assistant_id)
      await createNotification(
        task.assistant_id,
        "Revision requested",
        payload.content || "Please revise your submission.",
        "revision_request",
      );
    return;
  }

  const rule = REVIEW_WORKFLOW[action];
  if (!rule) throw new AppError("Unknown workflow action", 400);
  if (!rule.from.includes(task.status))
    throw new AppError(
      `Cannot perform '${action}' from status '${task.status}'`,
      400,
    );

  const updated = await pageTasksRepo.update(taskId, {
    status: rule.to,
    updated_at: new Date().toISOString(),
  });

  if (action === "approve" || action === "reject") {
    if (task.assistant_id) {
      await createNotification(
        task.assistant_id,
        `Task ${action}d`,
        `Your task has been ${action}d.`,
        `task_${action}d`,
      );
    }
  }
  return updated;
};

const bulkUpdateTasks = async (taskIds, status, editorId, content) => {
  const updates = taskIds.map((id) =>
    supabase
      .from("page_task")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("task_id", id),
  );
  const results = await Promise.all(updates);
  // Check each Supabase result for errors
  for (const res of results) {
    if (res.error) {
      throw res.error;
    }
  }

  if (["rejected", "needs_revision"].includes(status) && content) {
    const { data: tasks } = await supabase
      .from("page_task")
      .select("task_id, assistant_id")
      .in("task_id", taskIds);
    const feedbacks = (tasks || []).map((t) => ({
      task_id: t.task_id,
      mangaka_id: editorId,
      assistant_id: t.assistant_id,
      feedback_content: content,
      feedback_type: "bulk_review",
      status: "pending",
    }));
    if (feedbacks.length) {
      const { data: fbData, error: fbError } = await supabase
        .from("page_task_feedback")
        .insert(feedbacks);
      if (fbError) throw fbError;
    }

    const notifs = (tasks || [])
      .filter((t) => t.assistant_id)
      .map((t) => ({
        userId: t.assistant_id,
        title: "Tasks updated",
        content: content || `Tasks have been ${status}.`,
        type: `task_${status}`,
      }));
    if (notifs.length) {
      await createNotifications(notifs);
    }
  }
};

module.exports = {
  listReviewTasks,
  getTaskById,
  getTaskDetail,
  performWorkflow,
  bulkUpdateTasks,
};
