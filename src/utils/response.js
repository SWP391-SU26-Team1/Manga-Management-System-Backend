class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

class ApiError extends Error {
  constructor(statusCode, message = 'Error') {
    super(message);
    this.statusCode = statusCode;
  }
}

const sendSuccess = (res, statusCode = 200, data = null, message = 'Success') => {
  res.status(statusCode).json(new ApiResponse(statusCode, data, message));
};

const sendError = (res, statusCode = 500, message = 'Error') => {
  res.status(statusCode).json(new ApiResponse(statusCode, null, message));
};

module.exports = {
  ApiResponse,
  ApiError,
  sendSuccess,
  sendError,
};
