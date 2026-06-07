const service = require('./pageTasks.service');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const listTasks = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, sort, order } = req.query;
    const pageId = req.params.pageId;
    const assistantId = req.params.assistantId;
    const { data, total } = await service.listTasks({ pageId, assistantId, status, offset, limit, sort, order });
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, total) });
  } catch (error) { next(error); }
};

const getTaskById = async (req, res, next) => {
  try {
    const data = await service.getTaskById(req.params.taskId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const createTask = async (req, res, next) => {
  try {
    const payload = req.params.pageId ? { ...req.body, page_id: req.params.pageId } : req.body;
    const data = await service.createTask(payload);
    return sendSuccess(res, 201, data, 'Task created');
  } catch (error) { next(error); }
};

const updateTask = async (req, res, next) => {
  try {
    const data = await service.updateTask(req.params.taskId, req.body);
    return sendSuccess(res, 200, data, 'Task updated');
  } catch (error) { next(error); }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const data = await service.updateTaskStatus(req.params.taskId, req.body.status);
    return sendSuccess(res, 200, data, 'Status updated');
  } catch (error) { next(error); }
};

const workflowAction = (action) => async (req, res, next) => {
  try {
    const data = await service.performWorkflow(req.params.taskId, action);
    return sendSuccess(res, 200, data, `Task ${action} successful`);
  } catch (error) { next(error); }
};

const deleteTask = async (req, res, next) => {
  try {
    await service.deleteTask(req.params.taskId);
    return sendSuccess(res, 200, null, 'Task deleted');
  } catch (error) { next(error); }
};

module.exports = { listTasks, getTaskById, createTask, updateTask, updateTaskStatus, workflowAction, deleteTask };
