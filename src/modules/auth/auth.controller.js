const authService = require('./auth.service');
const { sendSuccess } = require('../../utils/response');

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    return sendSuccess(res, 201, data, 'Registered successfully');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    return sendSuccess(res, 200, data, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  return sendSuccess(res, 200, null, 'Logged out successfully');
};

const getMe = async (req, res, next) => {
  try {
    const data = await authService.getMe(req.user.user_id);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.user_id, req.body);
    return sendSuccess(res, 200, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe, changePassword };
