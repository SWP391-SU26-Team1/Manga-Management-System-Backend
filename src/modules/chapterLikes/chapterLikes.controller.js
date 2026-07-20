const chapterLikesService = require("./chapterLikes.service");
const { sendSuccess } = require("../../utils/response");

const toggleChapterLike = async (req, res, next) => {
  try {
    const data = await chapterLikesService.toggleChapterLike({
      userId: req.user.user_id,
      chapterId: req.body.chapter_id,
    });
    return sendSuccess(res, 200, data, "Success");
  } catch (error) {
    next(error);
  }
};

const getChapterLikeCount = async (req, res, next) => {
  try {
    const data = await chapterLikesService.getChapterLikeCount({
      chapterId: req.params.chapterId,
    });
    return sendSuccess(res, 200, data, "Success");
  } catch (error) {
    next(error);
  }
};

module.exports = { toggleChapterLike, getChapterLikeCount };
