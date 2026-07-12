const viewLogsService = require("./viewLogs.service");
const { sendSuccess } = require("../../utils/response");

const createViewLog = async (req, res, next) => {
  try {
    const data = await viewLogsService.createViewLog({
      chapterId: req.body.chapter_id,
    });
    return sendSuccess(res, 201, data, "View logged");
  } catch (error) {
    next(error);
  }
};

module.exports = { createViewLog };
