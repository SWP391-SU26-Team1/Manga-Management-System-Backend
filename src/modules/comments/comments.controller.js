const commentsService = require("./comments.service");
const { sendSuccess } = require("../../utils/response");
const {
  parsePagination,
  buildPaginationMeta,
} = require("../../utils/pagination");

const createComment = async (req, res, next) => {
  try {
    const data = await commentsService.createComment({
      userId: req.user.user_id,
      chapterId: req.body.chapter_id,
      parentCommentId: req.body.parent_comment_id,
      content: req.body.content,
      status: req.body.status,
    });
    return sendSuccess(res, 201, data, "Comment created");
  } catch (error) {
    next(error);
  }
};

const listComments = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await commentsService.listComments({
      chapterId: req.params.chapterId,
      page,
      limit,
      offset,
    });
    return res
      .status(200)
      .json({
        success: true,
        message: "Success",
        data,
        pagination: buildPaginationMeta(page, limit, total),
      });
  } catch (error) {
    next(error);
  }
};

module.exports = { createComment, listComments };
