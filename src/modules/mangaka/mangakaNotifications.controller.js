const supabase = require('../../config/supabase');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const listMyNotifications = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { is_read } = req.query;
    let query = supabase.from('notification').select('*', { count: 'exact' }).eq('user_id', req.user.user_id);
    if (is_read !== undefined) query = query.eq('is_read', is_read === 'true');
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, count) });
  } catch (e) { next(e); }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const { count, error } = await supabase.from('notification').select('*', { count: 'exact', head: true }).eq('user_id', req.user.user_id).eq('is_read', false);
    if (error) throw error;
    return sendSuccess(res, 200, { unread_count: count }, 'Success');
  } catch (e) { next(e); }
};

const markAsRead = async (req, res, next) => {
  try {
    const { error } = await supabase.from('notification').update({ is_read: true }).eq('notification_id', req.params.notificationId).eq('user_id', req.user.user_id);
    if (error) throw error;
    return sendSuccess(res, 200, null, 'Notification marked as read');
  } catch (e) { next(e); }
};

const markAllRead = async (req, res, next) => {
  try {
    const { error } = await supabase.from('notification').update({ is_read: true }).eq('user_id', req.user.user_id).eq('is_read', false);
    if (error) throw error;
    return sendSuccess(res, 200, null, 'All notifications marked as read');
  } catch (e) { next(e); }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { error } = await supabase.from('notification').delete().eq('notification_id', req.params.notificationId).eq('user_id', req.user.user_id);
    if (error) throw error;
    return sendSuccess(res, 200, null, 'Notification deleted');
  } catch (e) { next(e); }
};

module.exports = { listMyNotifications, getUnreadCount, markAsRead, markAllRead, deleteNotification };
