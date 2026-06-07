const express = require('express');
const router = express.Router();
const ctrl = require('./mangakaNotifications.controller');

router.get('/', ctrl.listMyNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.patch('/mark-all-read', ctrl.markAllRead);
router.patch('/:notificationId/read', ctrl.markAsRead);
router.delete('/:notificationId', ctrl.deleteNotification);

module.exports = router;
