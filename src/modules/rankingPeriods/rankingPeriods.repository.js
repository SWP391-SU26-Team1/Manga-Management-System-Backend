const supabase = require('../../config/supabase');

const findAll = async () => {
  const { data, error } = await supabase.from('ranking_period').select('*').order('start_date', { ascending: false });
  if (error) throw error;
  return data;
};

const findById = async (periodId) => {
  const { data, error } = await supabase.from('ranking_period').select('*').eq('period_id', periodId).maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('ranking_period').insert(payload).select('*').single();
  if (error) throw error;
  return data;
};

const update = async (periodId, payload) => {
  const { data, error } = await supabase.from('ranking_period').update(payload).eq('period_id', periodId).select('*').single();
  if (error) throw error;
  return data;
};

const deleteById = async (periodId) => {
  const { error } = await supabase.from('ranking_period').delete().eq('period_id', periodId);
  if (error) throw error;
};

const existsById = async (periodId) => {
  const { data, error } = await supabase.from('ranking_period').select('period_id').eq('period_id', periodId).maybeSingle();
  if (error) throw error;
  return !!data;
};

module.exports = { findAll, findById, create, update, deleteById, existsById };
