const supabase = require('../../config/supabase');

const findAll = async () => {
  const { data, error } = await supabase.from('page_region').select('*');
  if (error) throw error;
  return data;
};

const findById = async (regionId) => {
  const { data, error } = await supabase.from('page_region').select('*').eq('region_id', regionId).maybeSingle();
  if (error) throw error;
  return data;
};

const findByPageId = async (pageId) => {
  const { data, error } = await supabase.from('page_region').select('*').eq('page_id', pageId);
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase.from('page_region').insert(payload).select('*').single();
  if (error) throw error;
  return data;
};

const bulkCreate = async (payloads) => {
  const { data, error } = await supabase.from('page_region').insert(payloads).select('*');
  if (error) throw error;
  return data;
};

const update = async (regionId, payload) => {
  const { data, error } = await supabase.from('page_region').update(payload).eq('region_id', regionId).select('*').single();
  if (error) throw error;
  return data;
};

const deleteById = async (regionId) => {
  const { error } = await supabase.from('page_region').delete().eq('region_id', regionId);
  if (error) throw error;
};

const existsById = async (regionId) => {
  const { data, error } = await supabase.from('page_region').select('region_id').eq('region_id', regionId).maybeSingle();
  if (error) throw error;
  return !!data;
};

const existsByIdAndPageId = async (regionId, pageId) => {
  const { data, error } = await supabase
    .from('page_region')
    .select('region_id')
    .eq('region_id', regionId)
    .eq('page_id', pageId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
};

module.exports = { findAll, findById, findByPageId, create, bulkCreate, update, deleteById, existsById, existsByIdAndPageId };
