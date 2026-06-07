const supabase = require('../config/supabase');

const createNotification = async (userId, title, content, type = null) => {
  const { error } = await supabase.from('notification').insert({
    user_id: userId,
    title,
    content,
    type,
    is_read: false,
  });
  if (error) console.error('[Notification] Failed to create:', error.message);
};

const createNotifications = async (notifications) => {
  const rows = notifications.map((n) => ({
    user_id: n.userId,
    title: n.title,
    content: n.content || null,
    type: n.type || null,
    is_read: false,
  }));
  const { error } = await supabase.from('notification').insert(rows);
  if (error) console.error('[Notification] Bulk create failed:', error.message);
};

module.exports = { createNotification, createNotifications };
