const { verifyAccessToken } = require('../utils/jwt.helper');
const { sendError } = require('../utils/response');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 401, 'Access token required');
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    return sendError(res, err.statusCode || 401, err.message || 'Invalid or expired token');
  }
};

const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    req.user = verifyAccessToken(token);
  } catch {
    // invalid token — still continue as unauthenticated
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
};
