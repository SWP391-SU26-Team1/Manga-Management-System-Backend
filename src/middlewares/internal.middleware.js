const { sendError } = require('../utils/response');

/**
 * Guard for /api/internal routes.
 * Caller must send header: x-internal-secret: <INTERNAL_SERVICE_SECRET>
 */
const requireInternalSecret = (req, res, next) => {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== process.env.INTERNAL_SERVICE_SECRET) {
    return sendError(res, 401, 'Unauthorized: internal access only');
  }
  next();
};

module.exports = { requireInternalSecret };
