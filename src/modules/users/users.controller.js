const usersService = require('./users.service');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const AppError = require('../../utils/appError');

const listUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { role, status, keyword, sort, order } = req.query;
    const { data, total } = await usersService.listUsers({ role, status, keyword, page, limit, offset, sort, order });
    return res.status(200).json({
      success: true,
      message: 'Success',
      data,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
      return next(new AppError('Forbidden: access denied', 403));
    }
    const data = await usersService.getUserById(req.params.userId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const data = await usersService.createUser(req.body);
    return sendSuccess(res, 201, data, 'User created');
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
      return next(new AppError('Forbidden: access denied', 403));
    }
    // Non-admin cannot escalate their own role
    if (req.user.role !== 'admin' && req.body.role !== undefined) {
      return next(new AppError('Forbidden: cannot change role', 403));
    }
    const data = await usersService.updateUser(req.params.userId, req.body);
    return sendSuccess(res, 200, data, 'User updated');
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const data = await usersService.updateUserStatus(req.params.userId, req.body.status);
    return sendSuccess(res, 200, data, 'Status updated');
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await usersService.deleteUser(req.params.userId);
    return sendSuccess(res, 200, null, 'User deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { listUsers, getUserById, createUser, updateUser, updateUserStatus, deleteUser };
