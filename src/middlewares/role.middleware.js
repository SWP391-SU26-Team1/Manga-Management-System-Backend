const AppError = require('../utils/appError');

const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }
  if (!roles.includes(req.user.role)) {
    return next(new AppError('Forbidden: insufficient role', 403));
  }
  next();
};

module.exports = { requireRole };
