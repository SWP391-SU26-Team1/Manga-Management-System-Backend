const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.statusCode) {
    return sendError(res, err.statusCode, err.message);
  }

  if (err.name === 'ValidationError') {
    return sendError(res, 400, err.message);
  }

  sendError(res, 500, 'Internal server error');
};

module.exports = {
  errorHandler,
};
