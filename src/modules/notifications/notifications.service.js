const notificationsRepo = require('./notifications.repository');
const usersRepo = require('../users/users.repository');
const AppError = require('../../utils/appError');

const listNotifications = async (filters) => notificationsRepo.findAll(filters);

const getNotificationById = async (notificationId) => {
  const n = await notificationsRepo.findById(notificationId);
  if (!n) throw new AppError('Notification not found', 404);
  return n;
};

const createNotification = async (payload) => {
  const userExists = await usersRepo.existsById(payload.user_id);
  if (!userExists) throw new AppError('User not found', 404);
  return notificationsRepo.create({ ...payload, is_read: false });
};

const updateNotification = async (notificationId, payload) => {
  const n = await notificationsRepo.findById(notificationId);
  if (!n) throw new AppError('Notification not found', 404);
  return notificationsRepo.update(notificationId, payload);
};

const markAsRead = async (notificationId) => {
  const n = await notificationsRepo.findById(notificationId);
  if (!n) throw new AppError('Notification not found', 404);
  return notificationsRepo.update(notificationId, { is_read: true });
};

const markAllRead = async (userId) => {
  const userExists = await usersRepo.existsById(userId);
  if (!userExists) throw new AppError('User not found', 404);
  await notificationsRepo.markAllRead(userId);
};

const deleteNotification = async (notificationId) => {
  const n = await notificationsRepo.findById(notificationId);
  if (!n) throw new AppError('Notification not found', 404);
  await notificationsRepo.deleteById(notificationId);
};

module.exports = { listNotifications, getNotificationById, createNotification, updateNotification, markAsRead, markAllRead, deleteNotification };
