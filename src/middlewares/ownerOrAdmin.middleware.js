const AppError = require('../utils/appError');

/**
 * Allow access only if the authenticated user is admin OR owns the resource.
 * @param {string} paramName - req.params key that holds the owner's userId
 */
const requireOwnerOrAdmin = (paramName = 'userId') => (req, res, next) => {
  if (!req.user) return next(new AppError('Unauthorized', 401));
  if (req.user.role === 'admin') return next();
  if (req.user.id === req.params[paramName]) return next();
  return next(new AppError('Forbidden: access denied', 403));
};

module.exports = { requireOwnerOrAdmin };
