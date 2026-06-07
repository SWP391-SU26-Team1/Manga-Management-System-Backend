const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./notifications.validation');
const controller = require('./notifications.controller');

router.get('/', authenticateToken, controller.listNotifications);
router.get('/:notificationId', authenticateToken, validate(v.notificationIdParamSchema), controller.getNotificationById);
router.post('/', authenticateToken, requireRole(['admin']), validate(v.createNotificationSchema), controller.createNotification);
router.patch('/:notificationId', authenticateToken, validate(v.updateNotificationSchema), controller.updateNotification);
router.patch('/:notificationId/read', authenticateToken, validate(v.notificationIdParamSchema), controller.markAsRead);
router.delete('/:notificationId', authenticateToken, validate(v.notificationIdParamSchema), controller.deleteNotification);

module.exports = router;
