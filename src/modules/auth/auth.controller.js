const authService = require("./auth.service");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/appError");
const { OAuth2Client } = require("google-auth-library");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

if (!GOOGLE_CLIENT_ID) {
  console.warn(
    "⚠️ Missing GOOGLE_CLIENT_ID; Google login will be unavailable until it is configured",
  );
}

const googleClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

const verifyGoogleIdToken = async (idToken) => {
  if (!GOOGLE_CLIENT_ID) {
    throw new AppError("Google login is not configured on the server", 500);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  return ticket.getPayload();
};

const exchangeGoogleCode = async (code, redirectUri) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new AppError("Google OAuth server configuration is incomplete", 500);
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri || GOOGLE_CALLBACK_URL || "",
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await response.json();
  if (!response.ok || !tokenData.id_token) {
    throw new AppError("Failed to exchange Google authorization code", 400);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: tokenData.id_token,
    audience: GOOGLE_CLIENT_ID,
  });

  return ticket.getPayload();
};

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
        payload = await verifyGoogleIdToken(idToken);
      } else if (code) {
        payload = await exchangeGoogleCode(code, redirectUri);
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

module.exports = {
  register,
  login,
  loginWithGoogle,
  logout,
  getMe,
  changePassword,
};
