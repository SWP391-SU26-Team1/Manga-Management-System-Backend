const supabase = require('../../config/supabase');

const findAll = async ({ manuscriptId } = {}) => {
  let query = supabase.from('manuscript_file').select('*');
  if (manuscriptId) query = query.eq('manuscript_id', manuscriptId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const findById = async (fileId) => {
  const { data, error } = await supabase.from('manuscript_file').select('*').eq('file_id', fileId).maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('manuscript_file').insert(payload).select('*').single();
  if (error) throw error;
  return data;
};

const update = async (fileId, payload) => {
  const { data, error } = await supabase.from('manuscript_file').update(payload).eq('file_id', fileId).select('*').single();
  if (error) throw error;
  return data;
};

const deleteById = async (fileId) => {
  const { error } = await supabase.from('manuscript_file').delete().eq('file_id', fileId);
  if (error) throw error;
};

module.exports = { findAll, findById, create, update, deleteById };
