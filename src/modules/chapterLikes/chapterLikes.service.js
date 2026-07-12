const chapterLikesRepo = require("./chapterLikes.repository");
const AppError = require("../../utils/appError");

const toggleChapterLike = async ({ userId, chapterId }) => {
  if (!userId || !chapterId)
    throw new AppError("userId and chapterId are required", 400);
  return chapterLikesRepo.toggleLike({ userId, chapterId });
};

const getChapterLikeCount = async ({ chapterId }) => {
  if (!chapterId) throw new AppError("chapterId is required", 400);
  const count = await chapterLikesRepo.countLikes(chapterId);
  return { chapter_id: chapterId, like_count: count };
};

module.exports = { toggleChapterLike, getChapterLikeCount };
