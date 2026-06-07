const AppError = require('../utils/appError');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    // Zod v4 uses .issues; v3 used .errors — support both
    const issues = result.error.issues ?? result.error.errors ?? [];
    const message = issues.map((e) => e.message).join(', ');
    return next(new AppError(message, 400));
  }

  req.body = result.data.body ?? req.body;
  req.params = result.data.params ?? req.params;
  req.query = result.data.query ?? req.query;

  next();
};

module.exports = { validate };
