const bookmarksRepo = require("./bookmarks.repository");
const AppError = require("../../utils/appError");

const createBookmark = async ({
  userId,
  seriesId,
  lastReadChapterId,
  pageId,
}) => {
  if (!userId || !seriesId) {
    throw new AppError("userId and seriesId are required", 400);
  }

  return bookmarksRepo.createOrUpdateBookmark({
    userId,
    seriesId,
    lastReadChapterId,
    pageId,
  });
};

const listBookmarks = async ({ userId, page, limit, offset }) => {
  if (!userId) throw new AppError("userId is required", 400);
  return bookmarksRepo.listBookmarksByUser({ userId, offset, limit });
};

module.exports = { createBookmark, listBookmarks };
