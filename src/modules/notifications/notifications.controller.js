const service = require('./notifications.service');
const { sendSuccess } = require('../../utils/response');
const AppError = require('../../utils/appError');

const listNotifications = async (req, res, next) => {
  try {
    // Non-admin can only see their own notifications. Admin can query another user or fall back to their own.
    const userId = req.user.role === 'admin'
      ? (req.params.userId || req.query.user_id || req.query.userId || req.user.user_id)
      : req.user.user_id;
    const isRead = req.query.is_read !== undefined ? req.query.is_read === 'true' : undefined;
    const data = await service.listNotifications({ userId, isRead });
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getNotificationById = async (req, res, next) => {
  try {
    const data = await service.getNotificationById(req.params.notificationId);
    if (req.user.role !== 'admin' && data.user_id !== req.user.user_id) {
      return next(new AppError('Forbidden: access denied', 403));
    }
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const createNotification = async (req, res, next) => {
  try {
    const data = await service.createNotification(req.body);
    return sendSuccess(res, 201, data, 'Notification created');
  } catch (error) { next(error); }
};

const updateNotification = async (req, res, next) => {
  try {
    const n = await service.getNotificationById(req.params.notificationId);
    if (req.user.role !== 'admin' && n.user_id !== req.user.user_id) {
      return next(new AppError('Forbidden: access denied', 403));
    }
    const data = await service.updateNotification(req.params.notificationId, req.body);
    return sendSuccess(res, 200, data, 'Notification updated');
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    const n = await service.getNotificationById(req.params.notificationId);
    if (req.user.role !== 'admin' && n.user_id !== req.user.user_id) {
      return next(new AppError('Forbidden: access denied', 403));
    }
    const data = await service.markAsRead(req.params.notificationId);
    return sendSuccess(res, 200, data, 'Marked as read');
  } catch (error) { next(error); }
};

const markAllRead = async (req, res, next) => {
  try {
    // Users can only mark their own notifications as read. Admin can query another user or fall back to their own.
    const userId = req.user.role === 'admin'
      ? (req.params.userId || req.query.user_id || req.query.userId || req.user.user_id)
      : req.user.user_id;
    await service.markAllRead(userId);
    return sendSuccess(res, 200, null, 'All notifications marked as read');
  } catch (error) { next(error); }
};

const deleteNotification = async (req, res, next) => {
  try {
    const n = await service.getNotificationById(req.params.notificationId);
    if (req.user.role !== 'admin' && n.user_id !== req.user.user_id) {
      return next(new AppError('Forbidden: access denied', 403));
    }
    await service.deleteNotification(req.params.notificationId);
    return sendSuccess(res, 200, null, 'Notification deleted');
  } catch (error) { next(error); }
};

module.exports = { listNotifications, getNotificationById, createNotification, updateNotification, markAsRead, markAllRead, deleteNotification };
