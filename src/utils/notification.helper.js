const supabase = require('../config/supabase');
const { emitNewNotification } = require('../realtime/notification.socket');

const createNotification = async (userId, title, content, type = null) => {
  const { data, error } = await supabase
    .from('notification')
    .insert({ user_id: userId, title, content, type, is_read: false })
    .select()
    .single();
  if (error) {
    console.error('[Notification] Failed to create:', error.message);
    return;
  }
  emitNewNotification(userId, data);
};

const createNotifications = async (notifications) => {
  const rows = notifications.map((n) => ({
    user_id: n.userId,
    title: n.title,
    content: n.content || null,
    type: n.type || null,
    is_read: false,
  }));
  const { data, error } = await supabase.from('notification').insert(rows).select();
  if (error) {
    console.error('[Notification] Bulk create failed:', error.message);
    return;
  }
  data.forEach((n) => emitNewNotification(n.user_id, n));
};

module.exports = { createNotification, createNotifications };
