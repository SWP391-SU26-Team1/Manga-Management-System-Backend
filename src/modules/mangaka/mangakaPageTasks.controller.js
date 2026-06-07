const service = require('./mangakaPageTasks.service');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const listTasks = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, task_type, assignee_id } = req.query;
    const { data, total } = await service.listTasks(req.params.pageId, { status, taskType: task_type, assigneeId: assignee_id, offset, limit });
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, total) });
  } catch (e) { next(e); }
};

const listAllSeriesTasks = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, task_type, assignee_id } = req.query;
    const { data, total } = await service.listAllSeriesTasks(req.params.seriesId, { status, taskType: task_type, assigneeId: assignee_id, offset, limit });
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, total) });
  } catch (e) { next(e); }
};

const getTaskById = async (req, res, next) => {
  try {
    const data = await service.getTaskById(req.params.taskId, req.params.pageId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (e) { next(e); }
};

const createTask = async (req, res, next) => {
  try {
    const data = await service.createTask(req.params.pageId, req.user.user_id, req.body);
    return sendSuccess(res, 201, data, 'Task created');
  } catch (e) { next(e); }
};

const bulkCreateTasks = async (req, res, next) => {
  try {
    const data = await service.bulkCreateTasks(req.params.pageId, req.user.user_id, req.body.tasks);
    return sendSuccess(res, 201, data, 'Tasks created');
  } catch (e) { next(e); }
};

const updateTask = async (req, res, next) => {
  try {
    const data = await service.updateTask(req.params.taskId, req.params.pageId, req.body);
    return sendSuccess(res, 200, data, 'Task updated');
  } catch (e) { next(e); }
};

const workflow = (action) => async (req, res, next) => {
  try {
    const data = await service.performWorkflow(req.params.taskId, req.params.pageId, action);
    return sendSuccess(res, 200, data, `Task ${action} successful`);
  } catch (e) { next(e); }
};

const reassignTask = async (req, res, next) => {
  try {
    const data = await service.reassignTask(req.params.taskId, req.params.pageId, req.body.assistant_id, req.user.user_id);
    return sendSuccess(res, 200, data, 'Task reassigned');
  } catch (e) { next(e); }
};

const transferTask = async (req, res, next) => {
  try {
    const data = await service.transferTask(req.params.taskId, req.params.pageId, req.body.assistant_id, req.user.user_id);
    return sendSuccess(res, 200, data, 'Task transferred');
  } catch (e) { next(e); }
};

const completeTask = async (req, res, next) => {
  try {
    const data = await service.completeTask(req.params.taskId, req.params.pageId);
    return sendSuccess(res, 200, data, 'Task completed');
  } catch (e) { next(e); }
};

const requestRevision = async (req, res, next) => {
  try {
    await service.requestRevision(req.params.taskId, req.params.pageId, req.user.user_id, req.body);
    return sendSuccess(res, 200, null, 'Revision requested');
  } catch (e) { next(e); }
};

const groupAllocate = async (req, res, next) => {
  try {
    await service.groupAllocate(req.params.seriesId, req.body.task_ids, req.body.assistant_ids, req.user.user_id);
    return sendSuccess(res, 200, null, 'Tasks allocated');
  } catch (e) { next(e); }
};

const autoAllocate = async (req, res, next) => {
  try {
    const result = await service.autoAllocate(req.params.seriesId, req.user.user_id);
    return sendSuccess(res, 200, result, `Auto-allocated ${result.assigned} tasks`);
  } catch (e) { next(e); }
};

const deleteTask = async (req, res, next) => {
  try {
    const data = await service.deleteTask(req.params.taskId, req.params.pageId);
    return sendSuccess(res, 200, data, 'Task cancelled');
  } catch (e) { next(e); }
};

module.exports = {
  listTasks, listAllSeriesTasks, getTaskById,
  createTask, bulkCreateTasks, updateTask, workflow,
  reassignTask, transferTask, completeTask, requestRevision,
  groupAllocate, autoAllocate, deleteTask,
};
