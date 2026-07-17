const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const usersRepo = require("../users/users.repository");
const AppError = require("../../utils/appError");
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

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
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

// Tạo payload token chỉ gồm thông tin cần thiết.
// Không nên để quá nhiều dữ liệu nhạy cảm vào token.
const createTokenPayload = (user) => ({
  user_id: user.user_id,
  email: user.email,
  role: user.role,
});

const signToken = (user) =>
  jwt.sign(createTokenPayload(user), process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

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

  const token = signToken(user);
  return { token, user };
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
  // Nếu không tìm thấy thì không thể đăng nhập.
  const user = await usersRepo.findByEmail(email);

  // Bước 2: Nếu user tồn tại thì so sánh mật khẩu.
  // Đây là bước quan trọng vì mật khẩu trên database là hash, không phải text.
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
  const token = signToken(safeUser);
  return { token, user: safeUser };
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

  // PHẢI KIỂM TRA TRẠNG THÁI - Điều này không được bỏ qua dù là Google hay Email
  checkUserStatus(user);

  const { password: _pw, ...safeUser } = user;
  const token = signToken(safeUser);
  return { token, user: safeUser };
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
};

module.exports = {
  register,
  verifyRegisterOtp,
  resendRegisterOtp,
  login,
  loginWithGoogle,
  getMe,
  changePassword,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
  verifyGoogleIdToken,
  exchangeGoogleCode,
};
