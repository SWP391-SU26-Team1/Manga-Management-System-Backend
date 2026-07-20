const bookmarksService = require("./bookmarks.service");
const { sendSuccess } = require("../../utils/response");
const {
  parsePagination,
  buildPaginationMeta,
} = require("../../utils/pagination");

const createBookmark = async (req, res, next) => {
  try {
    const data = await bookmarksService.createBookmark({
      userId: req.user.user_id,
      seriesId: req.body.series_id,
      lastReadChapterId: req.body.last_read_chapter_id,
      pageId: req.body.page_id,
    });
    return sendSuccess(res, 201, data, "Bookmark saved");
  } catch (error) {
    next(error);
  }
};

const listBookmarks = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await bookmarksService.listBookmarks({
      userId: req.user.user_id,
      page,
      limit,
      offset,
    });
    return res.status(200).json({
      success: true,
      message: "Success",
      data,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBookmark, listBookmarks };
