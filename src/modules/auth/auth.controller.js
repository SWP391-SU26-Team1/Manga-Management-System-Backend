const authService = require('./auth.service');
const { sendSuccess } = require('../../utils/response');
const AppError = require('../../utils/appError');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

const loginWithGoogle = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return next(new AppError('ID token is required', 400));
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      throw new AppError('Invalid Google token payload', 400);
    }

    if (payload.email_verified === false) {
      throw new AppError('Google email must be verified', 400);
    }

    const data = await authService.loginWithGoogle({
      email: payload.email,
      googleId: payload.sub,
      name: payload.name || payload.email.split('@')[0],
      avatar_url: payload.picture,
    });

    return sendSuccess(res, 200, data, 'Google login successful');
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

module.exports = { register, login, loginWithGoogle, logout, getMe, changePassword };
