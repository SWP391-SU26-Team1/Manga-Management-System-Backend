const authService = require("./auth.service");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/appError");

/** Cookie options for the HttpOnly refresh token cookie */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

/** Helper to extract refresh token from incoming request cookie */
const getRefreshTokenFromCookie = (req) => req.cookies?.refreshToken;

const register = async (req, res, next) => {
  try {
    const { token, refreshToken, user } = await authService.register(req.body);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    return sendSuccess(res, 201, { token, user }, "Registered successfully");
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { token, refreshToken, user } = await authService.login(req.body);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    return sendSuccess(res, 200, { token, user }, "Login successful");
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

    const { token, refreshToken, user } = await authService.loginWithGoogle({
      email: payload.email,
      googleId: payload.sub,
      name: payload.name || payload.email.split("@")[0],
      avatar_url: payload.picture,
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    return sendSuccess(res, 200, { token, user }, "Google login successful");
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = getRefreshTokenFromCookie(req);
    await authService.logout(refreshToken);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return sendSuccess(res, 200, null, "Logged out successfully");
  } catch (error) { next(error); }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = getRefreshTokenFromCookie(req);
    if (!refreshToken) return next(new AppError('Refresh token cookie is missing', 401));
    const { token, refreshToken: newRefreshToken, user } = await authService.refresh(refreshToken);
    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
    return sendSuccess(res, 200, { token, user }, 'Token refreshed');
  } catch (error) { next(error); }
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

const verifyRegisterOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const data = await authService.verifyRegisterOtp(email, otp);
    return sendSuccess(res, 200, data, "OTP verified successfully. Registration complete");
  } catch (error) {
    next(error);
  }
};

const resendRegisterOtp = async (req, res, next) => {
  try {
    await authService.resendRegisterOtp(req.body.email);
    return sendSuccess(res, 200, null, "Registration OTP has been resent");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyRegisterOtp,
  resendRegisterOtp,
  login,
  loginWithGoogle,
  logout,
  refresh,
  getMe,
  changePassword,
  forgotPassword,
  verifyPasswordOtp,
  resetPassword,
};
