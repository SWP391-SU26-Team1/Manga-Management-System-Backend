const commentsRepo = require("./comments.repository");
const AppError = require("../../utils/appError");

const createComment = async ({
  userId,
  chapterId,
  parentCommentId,
  content,
  status,
}) => {
  if (!userId || !chapterId || !content) {
    throw new AppError("userId, chapterId and content are required", 400);
  }
  return commentsRepo.createComment({
    userId,
    chapterId,
    parentCommentId,
    content,
    status,
  });
};

const listComments = async ({ chapterId, page, limit, offset }) => {
  if (!chapterId) throw new AppError("chapterId is required", 400);
  return commentsRepo.listCommentsByChapter({ chapterId, offset, limit });
};

const listCommentsBySeries = async ({ seriesId, page, limit, offset }) => {
  if (!seriesId) throw new AppError("seriesId is required", 400);
  return commentsRepo.listCommentsBySeries({ seriesId, offset, limit });
};

const deleteComment = async ({ commentId, userId, userRole }) => {
  if (!commentId) throw new AppError("commentId is required", 400);

  const comment = await commentsRepo.findById(commentId);
  if (!comment) throw new AppError("Comment not found", 404);

  if (comment.user_id !== userId && userRole !== "admin") {
    throw new AppError(
      "Forbidden: You do not have permission to delete this comment",
      403
    );
  }

  await commentsRepo.deleteById(commentId);
};

module.exports = {
  createComment,
  listComments,
  listCommentsBySeries,
  deleteComment,
};
