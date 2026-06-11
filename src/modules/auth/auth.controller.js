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

const loginWithGoogle = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'ID token is required' });
    }

    // TODO: Verify Google ID token using google-auth-library
    // const { OAuth2Client } = require('google-auth-library');
    // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    // const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    // const payload = ticket.getPayload();

    // Tạm thời giả lập dữ liệu từ Google (sẽ uncomment sau khi cài google-auth-library)
    const payload = {
      email: req.body.email,
      sub: req.body.googleId,
      name: req.body.name
    };

    const data = await authService.loginWithGoogle({
      email: payload.email,
      googleId: payload.sub,
      name: payload.name
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
