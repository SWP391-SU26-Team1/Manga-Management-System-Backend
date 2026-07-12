const viewLogsRepo = require("./viewLogs.repository");
const AppError = require("../../utils/appError");

const createViewLog = async ({ chapterId }) => {
  if (!chapterId) throw new AppError("chapterId is required", 400);
  return viewLogsRepo.createViewLog({ chapterId });
};

module.exports = { createViewLog };
