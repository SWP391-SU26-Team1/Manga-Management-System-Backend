const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middlewares/auth.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const v = require("./chapterLikes.validation");
const controller = require("./chapterLikes.controller");

router.post(
  "/",
  authenticateToken,
  validate(v.toggleChapterLikeSchema),
  controller.toggleChapterLike,
);
router.get("/:chapterId/count", controller.getChapterLikeCount);

module.exports = router;
