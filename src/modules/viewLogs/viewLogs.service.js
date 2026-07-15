const viewLogsRepo = require("./viewLogs.repository");
const chaptersRepo = require("../chapters/chapters.repository");
const AppError = require("../../utils/appError");

const createViewLog = async ({ chapterId, seriesId, userId }) => {
  if (!chapterId) throw new AppError("chapterId is required", 400);
  const log = await viewLogsRepo.createViewLog({ chapterId, seriesId, userId });
  
  const chapter = await chaptersRepo.findById(chapterId);
  if (chapter) {
    await chaptersRepo.update(chapterId, { view_count: (chapter.view_count || 0) + 1 });
  }

  return log;
};

module.exports = { createViewLog };
