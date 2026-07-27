const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const usersRepo = require("../users/users.repository");
const authRepo = require("./auth.repository");
const AppError = require("../../utils/appError");
const { generateTokens, verifyRefreshToken, getRefreshExpiresAt } = require("../../utils/jwt.helper");
const { OAuth2Client } = require("google-auth-library");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

const googleClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

const passwordResetOtpStore = new Map();
const registerOtpStore = new Map();

const generatePasswordOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const normalizeEmail = (email) => email.trim().toLowerCase();

const sendOtpEmail = async (email, otp, type = "reset") => {
  const smtpHost = process.env.EMAIL_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.EMAIL_PORT || 587);
  const smtpSecure =
    process.env.EMAIL_SECURE === "true" || process.env.EMAIL_SECURE === "1";
  const smtpUser = process.env.EMAIL_USER;
  const smtpPass = process.env.EMAIL_PASS;

  const isPlaceholder = (val) => {
    if (!val) return true;
    const lower = val.trim().toLowerCase();
    const normalized = lower
      .replace(/^["']|["']$/g, "")
      .replace(/\s+#.*$/g, "")
      .replace(/[\s_]+/g, "-");

    return (
      normalized === "your-email@gmail.com" ||
      normalized === "your-app-password" ||
      normalized === "your-gmail-app-password" ||
      normalized === "email-cua-ban@gmail.com" ||
      normalized === "mat-khau-ung-dung-gmail-16-ky-tu" ||
      normalized.startsWith("your-") ||
      normalized.startsWith("change-me") ||
      normalized.startsWith("replace-with")
    );
  };

  const isConfigMissing =
    !smtpUser ||
    !smtpPass ||
    isPlaceholder(smtpUser) ||
    isPlaceholder(smtpPass);

  const devEmail = process.env.EMAIL_TO_DEV;
  const isDevMode = process.env.NODE_ENV !== "production";
  const recipient =
    isDevMode && devEmail && !isPlaceholder(devEmail) ? devEmail : email;

  if (isConfigMissing) {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("Email service is not configured", 500);
    }
    console.info(
      `[Local Test] SMTP credentials missing or placeholder; OTP for ${recipient}: ${otp}`,
    );
    return;
  }

  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch (error) {
    throw new AppError("Email service is not available", 500);
  }

  // Force IPv4 lookup for Railway environment
  const dns = require('dns');
  const { promisify } = require('util');
  let resolvedHost = smtpHost;
  try {
    const { address } = await promisify(dns.lookup)(smtpHost, { family: 4 });
    resolvedHost = address;
  } catch (err) {
    console.error("[auth] DNS lookup failed for SMTP host:", err);
  }

  const transporter = nodemailer.createTransport({
    host: resolvedHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
    tls: {
      // Required so TLS doesn't fail when connecting via IP address
      servername: smtpHost
    }
  });

  const subject = type === "register"
    ? "MangaFlow - Mã OTP xác thực đăng ký tài khoản"
    : "MangaFlow - Mã OTP khôi phục mật khẩu";

  const text = type === "register"
    ? `Mã OTP xác thực đăng ký tài khoản MangaFlow của bạn là ${otp}. Mã này sẽ hết hạn trong vòng 10 phút.`
    : `Mã OTP khôi phục mật khẩu tài khoản MangaFlow của bạn là ${otp}. Mã này sẽ hết hạn trong vòng 10 phút.`;

  try {
    if (isDevMode && recipient !== email) {
      console.info(
        `[Local Test] Redirecting OTP email from ${email} to developer test email: ${recipient}`,
      );
    }
    
    // 🚀 NEW: Fallback to HTTP API (Brevo) if configured (Bypasses Railway SMTP block)
    if (process.env.BREVO_API_KEY) {
      const brevoPayload = {
        sender: { name: "MangaFlow", email: process.env.EMAIL_FROM || smtpUser },
        to: [{ email: recipient }],
        subject: subject,
        textContent: text
      };

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json"
        },
        body: JSON.stringify(brevoPayload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Brevo API Error: ${response.status} - ${errorData}`);
      }
      return; // Exit successfully if Brevo works
    }

    // 📬 OLD: SMTP Nodemailer (Will be blocked on Railway Free/Hobby)
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || smtpUser,
      to: recipient,
      subject,
      text,
    });
  } catch (error) {
    if (isDevMode) {
      console.warn(
        `[Local Test] Failed to send actual email via SMTP to ${recipient}, falling back to console log. Error: ${error.message}`,
      );
      console.info(`[Local Test] OTP for ${recipient}: ${otp}`);
      return;
    }
    console.error("[auth] Failed to send OTP email:", error);
    throw new AppError("Failed to send password reset email", 500);
  }
};

const verifyGoogleIdToken = async (idToken) => {
  if (!GOOGLE_CLIENT_ID)
    throw new AppError("Google login is not configured on the server", 500);
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

const exchangeGoogleCode = async (code, redirectUri) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)
    throw new AppError("Google OAuth server configuration is incomplete", 500);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri || GOOGLE_CALLBACK_URL || "",
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await response.json();
  if (!response.ok || !tokenData.id_token)
    throw new AppError("Failed to exchange Google authorization code", 400);
  const ticket = await googleClient.verifyIdToken({
    idToken: tokenData.id_token,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

// Token generation is now handled by jwt.helper.js (generateTokens)
// which creates both Access Token (short-lived) and Refresh Token (long-lived).

// Kiểm tra trạng thái user - dùng chung cho cả Email và Google
const checkUserStatus = (user) => {
  if (user.status !== "active") {
    if (user.status === "inactive") {
      throw new AppError(
        "Account has been deactivated. Please contact support",
        403,
      );
    }
    if (user.status === "suspended") {
      throw new AppError(
        "Account is temporarily suspended due to violation",
        403,
      );
    }
    if (user.status === "banned") {
      throw new AppError("Account has been permanently banned", 403);
    }
    throw new AppError("Account is not active", 403);
  }
};

const register = async ({ username, email, password, name, role }) => {
  const normalizedEmail = normalizeEmail(email);
  const existingEmail = await usersRepo.findByEmail(normalizedEmail);
  if (existingEmail) throw new AppError("Email already in use", 409);

  const existingUsername = await usersRepo.findByUsername(username);
  if (existingUsername) throw new AppError("Username already in use", 409);

  const hashed = await bcrypt.hash(password, 10);
  const otp = generatePasswordOtp();
  registerOtpStore.set(normalizedEmail, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    payload: { username, email: normalizedEmail, password: hashed, name, role },
  });
  await sendOtpEmail(normalizedEmail, otp, "register");
  return { otpSent: true, email: normalizedEmail };
};

const verifyRegisterOtp = async (email, otp) => {
  const normalizedEmail = normalizeEmail(email);
  const entry = registerOtpStore.get(normalizedEmail);

  if (!entry || entry.otp !== otp) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  if (entry.expiresAt < Date.now()) {
    registerOtpStore.delete(normalizedEmail);
    throw new AppError("OTP has expired. Please register again", 400);
  }

  const existingEmail = await usersRepo.findByEmail(normalizedEmail);
  if (existingEmail) throw new AppError("Email already in use", 409);

  let user;
  if (entry.payload.isGoogle) {
    const { googleId, name, avatar_url, role } = entry.payload;

    const baseUsername = normalizedEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") || "googleuser";
    let finalUsername = baseUsername;
    let suffix = 1;
    while (await usersRepo.findByUsername(finalUsername)) {
      finalUsername = `${baseUsername}_${suffix}`;
      suffix += 1;
    }

    const randomPassword = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await usersRepo.create({
      email: normalizedEmail,
      username: finalUsername,
      password: hashedPassword,
      name,
      avatar_url,
      role,
      status: "active",
    });
  } else {
    const { username, password, name, role } = entry.payload;
    const existingUsername = await usersRepo.findByUsername(username);
    if (existingUsername) throw new AppError("Username already in use", 409);

    user = await usersRepo.create({
      username,
      email: normalizedEmail,
      password,
      name,
      role,
      status: "active",
    });
  }

  registerOtpStore.delete(normalizedEmail);

  const { token, refreshToken } = generateTokens(user);
  await authRepo.saveRefreshToken(user.user_id, refreshToken, getRefreshExpiresAt());
  return { token, refreshToken, user };
};

const resendRegisterOtp = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const entry = registerOtpStore.get(normalizedEmail);

  if (!entry) {
    throw new AppError("No registration in progress for this email", 400);
  }

  const otp = generatePasswordOtp();
  entry.otp = otp;
  entry.expiresAt = Date.now() + 10 * 60 * 1000;
  registerOtpStore.set(normalizedEmail, entry);

  await sendOtpEmail(normalizedEmail, otp, "register");
};


// Đăng nhập bằng Email - Kiểm tra mật khẩu trước, sau đó mới kiểm tra trạng thái
const login = async ({ email, password }) => {
  // Bước 1: Tìm user trong database theo email.
  const user = await usersRepo.findByEmail(email);

  // Bước 2: So sánh mật khẩu
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError("Invalid email or password", 401);
  }

  // Bước 3: Mật khẩu ĐÚNG rồi mới kiểm tra trạng thái
  checkUserStatus(user);

  const { password: _pw, ...safeUser } = user;
  const { token, refreshToken } = generateTokens(safeUser);
  await authRepo.saveRefreshToken(safeUser.user_id, refreshToken, getRefreshExpiresAt());
  return { token, refreshToken, user: safeUser };
};

const loginWithGoogle = async ({ email, googleId, name, avatar_url }) => {
  let user = await usersRepo.findByEmail(email);

  if (!user) {
    // Support preset emails from environment variable (comma-separated)
    const presetEmails = (process.env.PRESET_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const presetRole = process.env.PRESET_EMAIL_ROLE || "admin";
    const roleToAssign = presetEmails.includes(email.toLowerCase())
      ? presetRole
      : "mangaka";

    const normalizedEmail = normalizeEmail(email);
    const otp = generatePasswordOtp();
    registerOtpStore.set(normalizedEmail, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      payload: {
        isGoogle: true,
        email: normalizedEmail,
        googleId,
        name,
        avatar_url,
        role: roleToAssign,
      },
    });

    await sendOtpEmail(normalizedEmail, otp, "register");
    return { otpSent: true, email: normalizedEmail };
  }

  // PHẢI KIỂM TRA TRẠNG THÁI
  checkUserStatus(user);

  const { password: _pw, ...safeUser } = user;
  const { token, refreshToken } = generateTokens(safeUser);
  await authRepo.saveRefreshToken(safeUser.user_id, refreshToken, getRefreshExpiresAt());
  return { token, refreshToken, user: safeUser };
};

/**
 * Rotate a Refresh Token: verify old token, check DB, generate new pair, swap in DB
 */
const refresh = async (oldRefreshToken) => {
  if (!oldRefreshToken) throw new AppError('Refresh token is required', 401);

  // 1. Verify JWT signature & expiry first
  const decoded = verifyRefreshToken(oldRefreshToken);

  // 2. Check existence in DB (Stateful check — revoked tokens will not exist)
  const record = await authRepo.findRefreshToken(oldRefreshToken);
  if (!record) throw new AppError('Refresh token not found or already revoked', 403);

  // 3. Get latest user data & check status
  const user = await usersRepo.findById(decoded.user_id);
  if (!user) throw new AppError('User not found', 404);
  checkUserStatus(user);

  const { password: _pw, ...safeUser } = user;

  // 4. Rotate: delete old, generate new pair, save new
  await authRepo.deleteRefreshToken(oldRefreshToken);
  const { token, refreshToken: newRefreshToken } = generateTokens(safeUser);
  await authRepo.saveRefreshToken(safeUser.user_id, newRefreshToken, getRefreshExpiresAt());

  return { token, refreshToken: newRefreshToken, user: safeUser };
};

/**
 * Logout: remove the Refresh Token from DB
 */
const logout = async (refreshToken) => {
  if (refreshToken) {
    await authRepo.deleteRefreshToken(refreshToken).catch(() => {
      // ignore DB errors on logout — token may already be gone
    });
  }
};

const getMe = async (userId) => {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

const sendPasswordResetOtp = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await usersRepo.findByEmail(normalizedEmail);
  if (!user) {
    throw new AppError("No account found for this email address", 404);
  }

  checkUserStatus(user);

  const otp = generatePasswordOtp();
  passwordResetOtpStore.set(normalizedEmail, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    verified: false,
  });

  await sendOtpEmail(normalizedEmail, otp);
};

const verifyPasswordResetOtp = async (email, otp) => {
  const normalizedEmail = normalizeEmail(email);
  const entry = passwordResetOtpStore.get(normalizedEmail);

  if (!entry || entry.otp !== otp) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  if (entry.expiresAt < Date.now()) {
    passwordResetOtpStore.delete(normalizedEmail);
    throw new AppError("Invalid or expired OTP", 400);
  }

  entry.verified = true;
  passwordResetOtpStore.set(normalizedEmail, entry);
};

const resetPassword = async ({ email, otp, newPassword, confirmPassword }) => {
  const normalizedEmail = normalizeEmail(email);
  const entry = passwordResetOtpStore.get(normalizedEmail);

  if (!entry || entry.otp !== otp || !entry.verified) {
    throw new AppError(
      "OTP verification is required before resetting the password",
      400,
    );
  }

  if (entry.expiresAt < Date.now()) {
    passwordResetOtpStore.delete(normalizedEmail);
    throw new AppError("Invalid or expired OTP", 400);
  }

  if (newPassword !== confirmPassword) {
    throw new AppError("Passwords do not match", 400);
  }

  const user = await usersRepo.findByEmail(normalizedEmail);
  if (!user) throw new AppError("User not found", 404);

  checkUserStatus(user);

  const hashed = await bcrypt.hash(newPassword, 10);
  await usersRepo.update(user.user_id, { password: hashed });
  passwordResetOtpStore.delete(normalizedEmail);
  // Force logout all devices after password reset
  await authRepo.deleteAllRefreshTokensOfUser(user.user_id);
};

const changePassword = async (userId, { old_password, new_password }) => {
  const { data: user } = await require("../../config/supabase")
    .from("users")
    .select("password")
    .eq("user_id", userId)
    .single();

  if (!user) throw new AppError("User not found", 404);

  const valid = await bcrypt.compare(old_password, user.password);
  if (!valid) throw new AppError("Old password is incorrect", 400);

  const hashed = await bcrypt.hash(new_password, 10);
  await usersRepo.update(userId, { password: hashed });
  // Force logout all devices after password change
  await authRepo.deleteAllRefreshTokensOfUser(userId);
};

module.exports = {
  register,
  verifyRegisterOtp,
  resendRegisterOtp,
  login,
  loginWithGoogle,
  refresh,
  logout,
  getMe,
  changePassword,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
  verifyGoogleIdToken,
  exchangeGoogleCode,
};
