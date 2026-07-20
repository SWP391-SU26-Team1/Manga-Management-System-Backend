const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middlewares/auth.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const v = require("./bookmarks.validation");
const controller = require("./bookmarks.controller");

router.get(
  "/",
  authenticateToken,
  validate(v.listBookmarksSchema),
  controller.listBookmarks,
);
router.post(
  "/",
  authenticateToken,
  validate(v.createBookmarkSchema),
  controller.createBookmark,
);

module.exports = router;
