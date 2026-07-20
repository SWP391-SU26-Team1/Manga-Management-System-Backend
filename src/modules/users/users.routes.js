const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./users.validation');
const controller = require('./users.controller');

router.get(
  "/",
  authenticateToken,
  requireRole(["admin", "mangaka"]),
  validate(v.listUsersSchema),
  controller.listUsers,
);

router.post(
  "/request-role",
  authenticateToken,
  validate(v.requestRoleSchema),
  controller.requestRole,
);

router.get(
  "/:userId",
  authenticateToken,
  validate(v.userIdParamSchema),
  controller.getUserById,
);
router.post(
  "/",
  authenticateToken,
  requireRole(["admin"]),
  validate(v.createUserSchema),
  controller.createUser,
);
router.patch(
  "/:userId",
  authenticateToken,
  validate(v.updateUserSchema),
  controller.updateUser,
);
router.patch(
  "/:userId/status",
  authenticateToken,
  requireRole(["admin"]),
  validate(v.updateUserStatusSchema),
  controller.updateUserStatus,
);
router.delete(
  "/:userId",
  authenticateToken,
  requireRole(["admin"]),
  validate(v.userIdParamSchema),
  controller.deleteUser,
);

module.exports = router;
