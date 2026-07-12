const express = require("express");
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require("../../middlewares/auth.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const v = require("./comments.validation");
const controller = require("./comments.controller");

router.get("/", validate(v.listCommentsSchema), controller.listComments);
router.post(
  "/",
  authenticateToken,
  validate(v.createCommentSchema),
  controller.createComment,
);

module.exports = router;
