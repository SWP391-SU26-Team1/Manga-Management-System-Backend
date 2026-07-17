const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middlewares/auth.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const v = require("./auth.validation");
const controller = require("./auth.controller");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, role]
 *             properties:
 *               username: { type: string, example: "john_doe" }
 *               email: { type: string, example: "john@example.com" }
 *               password: { type: string, example: "password123" }
 *               role: { type: string, enum: [mangaka, assistant, editor, board, admin], example: "mangaka" }
 *     responses:
 *       201: { description: User registered }
 *       400: { description: Validation error }
 *       409: { description: Email/username already exists }
 */
router.post("/register", validate(v.registerSchema), controller.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and get JWT token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "john@example.com" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       200:
 *         description: Login successful — copy the token and click Authorize (🔒) at top
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string }
 *                     user: { type: object }
 *       401: { description: Invalid credentials }
 */
router.post("/login", validate(v.loginSchema), controller.login);

/**
 * @swagger
 * /api/auth/login-google:
 *   post:
 *     tags: [Auth]
 *     summary: Login with Google account
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken: { type: string, description: "Google ID token from frontend" }
 *     responses:
 *       200: { description: Google login successful }
 *       400: { description: Missing or invalid idToken }
 *       403: { description: Account suspended or banned }
 */
router.post(
  "/login-google",
  validate(v.loginGoogleSchema),
  controller.loginWithGoogle,
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout
 *     responses:
 *       200: { description: Logged out }
 */
router.post("/logout", authenticateToken, controller.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current logged-in user
 *     responses:
 *       200: { description: Current user info }
 *       401: { description: Unauthorized }
 */
router.get("/me", authenticateToken, controller.getMe);

/**
 * @swagger
 * /api/auth/change-password:
 *   patch:
 *     tags: [Auth]
 *     summary: Change password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Password changed }
 */
router.patch(
  "/change-password",
  authenticateToken,
  validate(v.changePasswordSchema),
  controller.changePassword,
);

router.post(
  "/forgot-password",
  validate(v.forgotPasswordSchema),
  controller.forgotPassword,
);
router.post(
  "/verify-password-otp",
  validate(v.verifyPasswordOtpSchema),
  controller.verifyPasswordOtp,
);
router.post(
  "/reset-password",
  validate(v.resetPasswordSchema),
  controller.resetPassword,
);
router.post(
<<<<<<< HEAD
=======
  "/verify-register-otp",
  validate(v.verifyRegisterOtpSchema),
  controller.verifyRegisterOtp,
);
router.post(
>>>>>>> 15bf055 (Add Register by OTP)
  "/resend-register-otp",
  validate(v.forgotPasswordSchema), // Sử dụng schema kiểm tra email có sẵn
  controller.resendRegisterOtp,
);

module.exports = router;
