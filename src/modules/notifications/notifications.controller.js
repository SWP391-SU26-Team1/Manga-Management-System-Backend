const service = require('./notifications.service');
const { sendSuccess } = require('../../utils/response');
const AppError = require('../../utils/appError');
const editorMockStore = require('../editor/editorMockStore');
const supabase = require('../../config/supabase');
const { createNotification: emitCreateNotification } = require('../../utils/notification.helper'); // reload trigger

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

const acknowledgeNotification = async (req, res, next) => {
  try {
    const n = await service.getNotificationById(req.params.notificationId);
    if (req.user.role !== 'admin' && n.user_id !== req.user.user_id) {
      return next(new AppError('Forbidden: access denied', 403));
    }
    const data = await service.updateNotification(req.params.notificationId, { 
      is_read: true,
      type: 'ranking_warning_acknowledged'
    });
    
    // Check if it's a warning and try to notify the editor
    if (n.type === 'ranking_warning' || n.type === 'ranking_warning_acknowledged') {
      let seriesTitle = '';
      let proposalType = '';
      
      if (n.title.includes('Deadline:')) {
        const seriesTitleMatch = n.title.match(/Deadline:\s*(.*)/);
        if (seriesTitleMatch) {
          seriesTitle = seriesTitleMatch[1].trim();
          proposalType = 'DEADLINE_REMINDER';
        }
      } else if (n.title.includes('Cảnh báo xếp hạng series:')) {
        const seriesTitleMatch = n.title.match(/Cảnh báo xếp hạng series:\s*(.*)/);
        if (seriesTitleMatch) {
          seriesTitle = seriesTitleMatch[1].trim();
          proposalType = 'RECOVERY';
        }
      }
      
      if (seriesTitle && proposalType) {
        const { data: seriesList } = await supabase.from('series').select('series_id').eq('title', seriesTitle);
        if (seriesList && seriesList.length > 0) {
          const seriesId = seriesList[0].series_id;
          const { data: members } = await supabase.from('series_member').select('user_id').eq('series_id', seriesId).eq('role_in_series', 'editor');
          if (members && members.length > 0) {
            for (const m of members) {
              await emitCreateNotification(
                m.user_id,
                'Mangaka đã xác nhận rủi ro',
                `Tác giả đã xác nhận thông tin: ${n.title}`,
                'SYSTEM'
              );
            }
          }
          
          // Update the proposal status in editor mock store
          editorMockStore.updateProposalStatusBySeriesTitle(seriesTitle, proposalType, 'APPROVED');
          console.log(`Updated proposal status for ${seriesTitle} (${proposalType}) to APPROVED`);
        }
      }
    }
    
    return sendSuccess(res, 200, data, 'Acknowledged successfully');
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

module.exports = { listNotifications, getNotificationById, createNotification, updateNotification, markAsRead, acknowledgeNotification, markAllRead, deleteNotification };
