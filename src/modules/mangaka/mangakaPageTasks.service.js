const supabase = require("../../config/supabase");
const pageTasksRepo = require("../pageTasks/pageTasks.repository");
const pageTaskFeedbacksRepo = require("../pageTaskFeedbacks/pageTaskFeedbacks.repository");
const seriesMembersRepo = require("../seriesMembers/seriesMembers.repository");
const {
  createNotification,
  createNotifications,
} = require("../../utils/notification.helper");
const AppError = require("../../utils/appError");

const TASK_WORKFLOW = {
  assign: { from: ["pending"], to: "assigned" },
  start: { from: ["assigned"], to: "in_progress" },
  submit: { from: ["in_progress"], to: "submitted" },
  approve: { from: ["submitted"], to: "approved" },
  reject: { from: ["submitted"], to: "rejected" },
  complete: { from: ["approved"], to: "completed" },
  cancel: { from: ["pending", "assigned", "in_progress"], to: "cancelled" },
  reopen: { from: ["cancelled", "rejected"], to: "pending" },
};

const buildTaskQuery = (filters) => {
  let query = supabase
    .from("page_task")
    .select(
      `*, users!fk_page_task_assistant(user_id, username, email), users!fk_page_task_assigned_by(user_id, username, email)`,
      { count: "exact" },
    );
  if (filters.pageId) query = query.eq("page_id", filters.pageId);
  if (filters.seriesId) {
    // filter via page→chapter→series join
    query = query.eq("page.chapter.series_id", filters.seriesId);
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.taskType) query = query.eq("task_type", filters.taskType);
  if (filters.assigneeId) query = query.eq("assistant_id", filters.assigneeId);
  if (filters.assignedById)
    query = query.eq("assigned_by_id", filters.assignedById);
  return query;
};

const listTasks = async (pageId, filters) => {
  let query = supabase
    .from("page_task")
    .select(
      "*, users!fk_page_task_assistant(user_id,username,email), users!fk_page_task_assigned_by(user_id,username,email)",
      { count: "exact" },
    )
    .eq("page_id", pageId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.taskType) query = query.eq("task_type", filters.taskType);
  if (filters.assigneeId) query = query.eq("assistant_id", filters.assigneeId);
  query = query
    .order("created_at", { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const listAllSeriesTasks = async (seriesId, filters) => {
  // join page→chapter→series
  let query = supabase
    .from("page_task")
    .select(
      "*, page:page_id(chapter:chapter_id(series_id)), users!fk_page_task_assistant(user_id,username,email)",
      { count: "exact" },
    );
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.taskType) query = query.eq("task_type", filters.taskType);
  if (filters.assigneeId) query = query.eq("assistant_id", filters.assigneeId);
  query = query
    .order("created_at", { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  // filter by seriesId in JS since deep joins are complex in supabase-js
  const filtered = (data || []).filter(
    (t) => t.page?.chapter?.series_id === seriesId,
  );
  return { data: filtered, total: filtered.length };
};

const getTaskById = async (taskId, pageId) => {
  const task = await pageTasksRepo.findById(taskId);
  if (!task || task.page_id !== pageId)
    throw new AppError("Task not found", 404);
  return task;
};

const createTask = async (pageId, assignedBy, payload) => {
  const task = await pageTasksRepo.create({
    ...payload,
    page_id: pageId,
    assigned_by_id: assignedBy,
    status: "pending",
  });
  if (payload.assistant_id) {
    await createNotification(
      payload.assistant_id,
      "New task assigned",
      `You have been assigned a new ${payload.task_type || "task"}.`,
      "task_assigned",
    );
  }
  return task;
};

const bulkCreateTasks = async (pageId, assignedBy, tasks) => {
  const rows = tasks.map((t) => ({
    ...t,
    page_id: pageId,
    assigned_by_id: assignedBy,
    status: "pending",
  }));
  const { data, error } = await supabase
    .from("page_task")
    .insert(rows)
    .select();
  if (error) throw error;

  const notifications = data
    .filter((t) => t.assistant_id)
    .map((t) => ({
      userId: t.assistant_id,
      title: "New task assigned",
      content: `You have a new ${t.task_type || "task"}.`,
      type: "task_assigned",
    }));
  if (notifications.length > 0) await createNotifications(notifications);

  return data;
};

const updateTask = async (taskId, pageId, payload) => {
  await getTaskById(taskId, pageId);
  return pageTasksRepo.update(taskId, {
    ...payload,
    updated_at: new Date().toISOString(),
  });
};

const performWorkflow = async (taskId, pageId, action) => {
  const task = await getTaskById(taskId, pageId);
  const rule = TASK_WORKFLOW[action];
  if (!rule) throw new AppError("Unknown workflow action", 400);
  if (!rule.from.includes(task.status))
    throw new AppError(
      `Cannot perform '${action}' from status '${task.status}'`,
      400,
    );
  return pageTasksRepo.update(taskId, {
    status: rule.to,
    updated_at: new Date().toISOString(),
  });
};

const reassignTask = async (taskId, pageId, newAssistantId, assignedBy) => {
  await getTaskById(taskId, pageId);
  const updated = await pageTasksRepo.update(taskId, {
    assistant_id: newAssistantId,
    assigned_by_id: assignedBy,
    status: "assigned",
    updated_at: new Date().toISOString(),
  });
  await createNotification(
    newAssistantId,
    "Task reassigned to you",
    "A task has been reassigned to you.",
    "task_reassigned",
  );
  return updated;
};

const transferTask = async (taskId, pageId, newAssistantId, requestedBy) => {
  await getTaskById(taskId, pageId);
  const updated = await pageTasksRepo.update(taskId, {
    assistant_id: newAssistantId,
    updated_at: new Date().toISOString(),
  });
  await createNotification(
    newAssistantId,
    "Task transferred to you",
    "A task has been transferred to you.",
    "task_transferred",
  );
  return updated;
};

const completeTask = async (taskId, pageId) => {
  const task = await getTaskById(taskId, pageId);
  if (task.status !== "approved")
    throw new AppError("Task must be 'approved' before completing", 400);
  return pageTasksRepo.update(taskId, {
    status: "completed",
    updated_at: new Date().toISOString(),
  });
};

const requestRevision = async (
  taskId,
  pageId,
  requesterId,
  { feedback_content, feedback_type },
) => {
  const task = await getTaskById(taskId, pageId);
  if (task.status !== "submitted")
    throw new AppError("Task must be 'submitted' to request revision", 400);

  await pageTasksRepo.update(taskId, {
    status: "rejected",
    updated_at: new Date().toISOString(),
  });

  // create feedback record
  await pageTaskFeedbacksRepo.create({
    task_id: taskId,
    mangaka_id: requesterId,
    assistant_id: task.assistant_id,
    feedback_content,
    feedback_type: feedback_type || "revision_request",
    status: "pending",
  });

  if (task.assistant_id) {
    await createNotification(
      task.assistant_id,
      "Revision requested",
      `Revision requested for your task. Feedback: ${feedback_content}`,
      "revision_request",
    );
  }
};

// Group allocate: assign tasks from multiple pages to assistants round-robin
const groupAllocate = async (seriesId, taskIds, assistantIds, assignedBy) => {
  if (!taskIds.length || !assistantIds.length)
    throw new AppError("taskIds and assistantIds are required", 400);

  const updates = taskIds.map((taskId, i) => {
    const assistantId = assistantIds[i % assistantIds.length];
    return supabase
      .from("page_task")
      .update({
        assistant_id: assistantId,
        assigned_by_id: assignedBy,
        status: "assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("task_id", taskId);
  });
  await Promise.all(updates);

  const notifications = taskIds.map((taskId, i) => ({
    userId: assistantIds[i % assistantIds.length],
    title: "Group task assigned",
    content: "You have been assigned tasks via group allocation.",
    type: "task_assigned",
  }));
  await createNotifications(notifications);
};

// Auto-allocate: assign all pending tasks for a series to series members equally
const autoAllocate = async (seriesId, assignedBy) => {
  const { data: pendingTasks, error: tErr } = await supabase
    .from("page_task")
    .select("task_id, page:page_id(chapter:chapter_id(series_id))")
    .eq("status", "pending");
  if (tErr) throw tErr;

  const seriesTasks = pendingTasks.filter(
    (t) => t.page?.chapter?.series_id === seriesId,
  );
  if (seriesTasks.length === 0) return { assigned: 0 };

  const members = await seriesMembersRepo.findBySeriesId(seriesId);
  if (members.length === 0)
    throw new AppError("No series members to allocate to", 400);

  const taskIds = seriesTasks.map((t) => t.task_id);
  const assistantIds = members.map((m) => m.user_id);
  await groupAllocate(seriesId, taskIds, assistantIds, assignedBy);

  return { assigned: taskIds.length };
};

const deleteTask = async (taskId, pageId) => {
  await getTaskById(taskId, pageId);
  return pageTasksRepo.update(taskId, {
    status: "cancelled",
    updated_at: new Date().toISOString(),
  });
};

module.exports = {
  listTasks,
  listAllSeriesTasks,
  getTaskById,
  createTask,
  bulkCreateTasks,
  updateTask,
  performWorkflow,
  reassignTask,
  transferTask,
  completeTask,
  requestRevision,
  groupAllocate,
  autoAllocate,
  deleteTask,
};
