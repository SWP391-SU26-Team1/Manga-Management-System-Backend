const supabase = require('../../config/supabase');

const ALLOWED_SORT_COLUMNS = ['username', 'email', 'role', 'status', 'created_at'];

const findAll = async ({ role, status, keyword, page, limit, offset, sort, order }) => {
  let query = supabase
    .from('users')
    .select('user_id, username, email, role, name, avatar_url, bio, gender, date_of_birth, status, created_at', { count: 'exact' });

  if (role) query = query.eq('role', role);
  if (status) query = query.eq('status', status);
  if (keyword) query = query.ilike('username', `%${keyword}%`);

  const sortCol = ALLOWED_SORT_COLUMNS.includes(sort) ? sort : 'created_at';
  query = query.order(sortCol, { ascending: order !== 'desc' });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const findById = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, username, email, role, name, avatar_url, bio, gender, date_of_birth, status, created_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const findByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const findByUsername = async (username) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id')
    .eq('username', username)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase
    .from('users')
    .insert(payload)
    .select('user_id, username, email, role, name, avatar_url, bio, gender, date_of_birth, status, created_at')
    .single();
  if (error) throw error;
  return data;
};

const update = async (userId, payload) => {
  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('user_id', userId)
    .select('user_id, username, email, role, name, avatar_url, bio, gender, date_of_birth, status, created_at')
    .single();
  if (error) throw error;
  return data;
};

const deleteById = async (userId) => {
  const { error } = await supabase.from('users').delete().eq('user_id', userId);
  if (error) throw error;
};

const existsById = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
};

module.exports = { findAll, findById, findByEmail, findByUsername, create, update, deleteById, existsById };
