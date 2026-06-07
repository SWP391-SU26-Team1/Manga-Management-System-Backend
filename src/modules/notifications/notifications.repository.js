const supabase = require('../../config/supabase');

const findAll = async ({ userId, isRead } = {}) => {
  let query = supabase.from('notification').select('*');
  if (userId) query = query.eq('user_id', userId);
  if (isRead !== undefined) query = query.eq('is_read', isRead);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const findById = async (notificationId) => {
  const { data, error } = await supabase.from('notification').select('*').eq('notification_id', notificationId).maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('notification').insert(payload).select('*').single();
  if (error) throw error;
  return data;
};

const update = async (notificationId, payload) => {
  const { data, error } = await supabase.from('notification').update(payload).eq('notification_id', notificationId).select('*').single();
  if (error) throw error;
  return data;
};

const deleteById = async (notificationId) => {
  const { error } = await supabase.from('notification').delete().eq('notification_id', notificationId);
  if (error) throw error;
};

const markAllRead = async (userId) => {
  const { error } = await supabase.from('notification').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  if (error) throw error;
};

module.exports = { findAll, findById, create, update, deleteById, markAllRead };
