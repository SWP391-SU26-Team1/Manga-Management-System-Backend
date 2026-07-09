const authService = require("./auth.service");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/appError");
// Google token verification/exchange implemented in auth.service

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    return sendSuccess(res, 201, data, "Registered successfully");
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    return sendSuccess(res, 200, data, "Login successful");
  } catch (error) {
    next(error);
  }
};

const loginWithGoogle = async (req, res, next) => {
  try {
    const { idToken, code, redirectUri } = req.body;

    let payload;
    try {
      if (idToken) {
        payload = await authService.verifyGoogleIdToken(idToken);
      } else if (code) {
        payload = await authService.exchangeGoogleCode(code, redirectUri);
      } else {
        return next(new AppError("Either idToken or code is required", 400));
      }
    } catch (err) {
      if (err instanceof AppError) {
        return next(err);
      }
      return next(new AppError("Invalid Google authentication response", 400));
    }

    if (!payload || !payload.email || !payload.sub) {
      return next(new AppError("Invalid Google token payload", 400));
    }

    if (payload.email_verified === false) {
      return next(new AppError("Google email must be verified", 400));
    }

    const data = await authService.loginWithGoogle({
      email: payload.email,
      googleId: payload.sub,
      name: payload.name || payload.email.split("@")[0],
      avatar_url: payload.picture,
    });

    return sendSuccess(res, 200, data, "Google login successful");
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  return sendSuccess(res, 200, null, "Logged out successfully");
};

const getMe = async (req, res, next) => {
  try {
    const data = await authService.getMe(req.user.user_id);
    return sendSuccess(res, 200, data, "Success");
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.user_id, req.body);
    return sendSuccess(res, 200, null, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.sendPasswordResetOtp(req.body.email);
    return sendSuccess(
      res,
      200,
      null,
      "Password reset OTP has been sent to your email",
    );
  } catch (error) {
    next(error);
  }
};

const verifyPasswordOtp = async (req, res, next) => {
  try {
    await authService.verifyPasswordResetOtp(req.body.email, req.body.otp);
    return sendSuccess(res, 200, null, "OTP verified successfully");
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    return sendSuccess(res, 200, null, "Password reset successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  loginWithGoogle,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  verifyPasswordOtp,
  resetPassword,
};
