const jwt = require('jsonwebtoken');
const AppError = require('./appError');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Creates the JWT payload - only include stable, non-sensitive info
 */
const createPayload = (user) => ({
  user_id: user.user_id,
  email: user.email,
  role: user.role,
});

/**
 * Generate a pair of Access Token + Refresh Token for a user
 */
const generateTokens = (user) => {
  const payload = createPayload(user);
  const token = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
  return { token, refreshToken };
};

/**
 * Verify an Access Token. Throws AppError on failure.
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Access token expired', 401);
    }
    throw new AppError('Invalid or expired token', 401);
  }
};

/**
 * Verify a Refresh Token. Throws AppError on failure.
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expired', 403);
    }
    throw new AppError('Invalid refresh token', 403);
  }
};

/**
 * Calculate expiry date from REFRESH_EXPIRES string (e.g. "7d")
 */
const getRefreshExpiresAt = () => {
  const match = REFRESH_EXPIRES.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const ms = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return new Date(Date.now() + value * ms);
};

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshExpiresAt,
};
