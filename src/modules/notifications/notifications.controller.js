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
    
    // Check if it's a warning and try to notify the editor and extend deadline
    if (n.type === 'ranking_warning' || n.type === 'ranking_warning_acknowledged') {
      // 1. Trích xuất metadata seriesId và chapterId từ nội dung thông báo
      let seriesId = null;
      let chapterId = null;
      if (n.content && n.content.includes('[meta:')) {
        const metaMatch = n.content.match(/\[meta:([^:]+):([^\]]+)\]/);
        if (metaMatch) {
          seriesId = metaMatch[1];
          chapterId = metaMatch[2];
        }
      }
      
      let seriesTitle = '';
      let proposalType = '';
      
      if (n.title && n.title.includes('Deadline:')) {
        const seriesTitleMatch = n.title.match(/Deadline:\s*(.*)/);
        if (seriesTitleMatch) {
          seriesTitle = seriesTitleMatch[1].trim();
          proposalType = 'DEADLINE_REMINDER';
        }
      } else if (n.title && n.title.includes('Cảnh báo xếp hạng series:')) {
        const seriesTitleMatch = n.title.match(/Cảnh báo xếp hạng series:\s*(.*)/);
        if (seriesTitleMatch) {
          seriesTitle = seriesTitleMatch[1].trim();
          proposalType = 'RECOVERY';
        }
      }

      if (!seriesTitle && n.content && n.content.includes('của bộ truyện')) {
        const match = n.content.match(/của bộ truyện\s+["']([^"']+)["']/);
        if (match) {
          seriesTitle = match[1];
        }
      }
      if (!proposalType && n.title && n.title.includes('Cảnh báo')) {
        const typeMatch = n.title.match(/Cảnh báo\s+([^\-]+)/);
        if (typeMatch) {
          proposalType = typeMatch[1].trim();
        }
      }
      
      // 2. Thực hiện tự động gia hạn thêm 7 ngày từ thời điểm hiện tại
      if (seriesId && chapterId) {
        const newDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const scheduleStorage = require('../../utils/scheduleStorage');
        scheduleStorage.setChapterExtension(seriesId, chapterId, newDeadline.toISOString());
        console.log(`[Extension] Automatically extended chapter ${chapterId} to ${newDeadline.toISOString()}`);
      }
      
      // 3. Nếu tìm thấy seriesId trực tiếp từ metadata
      if (seriesId) {
        // Lấy danh sách Tantou Editor của bộ truyện để gửi thông báo
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
        
        // Cập nhật trạng thái đề xuất duyệt (proposal) sang APPROVED trong mock store
        if (seriesTitle && proposalType) {
          editorMockStore.updateProposalStatusBySeriesTitle(seriesTitle, proposalType, 'APPROVED');
          console.log(`Updated proposal status for ${seriesTitle} (${proposalType}) to APPROVED`);
        }
      } else if (seriesTitle && proposalType) {
        // Fallback: Tìm kiếm series dựa theo tiêu đề nếu không có metadata trực tiếp
        const { data: seriesList } = await supabase.from('series').select('series_id').eq('title', seriesTitle);
        if (seriesList && seriesList.length > 0) {
          const sId = seriesList[0].series_id;
          const { data: members } = await supabase.from('series_member').select('user_id').eq('series_id', sId).eq('role_in_series', 'editor');
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
