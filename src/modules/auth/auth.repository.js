const supabase = require('../../config/supabase');

/**
 * Save a new Refresh Token for a user
 */
const saveRefreshToken = async (userId, token, expiresAt) => {
  const { data, error } = await supabase
    .from('user_refresh_token')
    .insert({ user_id: userId, token, expires_at: expiresAt.toISOString() })
    .select('token_id, user_id, expires_at, created_at')
    .single();
  if (error) throw error;
  return data;
};

/**
 * Find a Refresh Token record by token string
 */
const findRefreshToken = async (token) => {
  const { data, error } = await supabase
    .from('user_refresh_token')
    .select('token_id, user_id, token, expires_at')
    .eq('token', token)
    .maybeSingle();
  if (error) throw error;
  return data;
};

/**
 * Delete a single Refresh Token (used during rotation or logout)
 */
const deleteRefreshToken = async (token) => {
  const { error } = await supabase
    .from('user_refresh_token')
    .delete()
    .eq('token', token);
  if (error) throw error;
};

/**
 * Delete ALL Refresh Tokens for a given user (force logout all devices)
 * Used when user changes password or resets password
 */
const deleteAllRefreshTokensOfUser = async (userId) => {
  const { error } = await supabase
    .from('user_refresh_token')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
};

/**
 * Delete all expired tokens (optional cleanup job)
 */
const deleteExpiredTokens = async () => {
  const { error } = await supabase
    .from('user_refresh_token')
    .delete()
    .lt('expires_at', new Date().toISOString());
  if (error) throw error;
};

module.exports = {
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteAllRefreshTokensOfUser,
  deleteExpiredTokens,
};
