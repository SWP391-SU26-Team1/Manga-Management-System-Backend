const supabase = require('../../config/supabase');

const SELECT = `*, page:page_id(page_id, page_number, chapter_id)`;

const findByPageId = async (pageId) => {
  const { data, error } = await supabase
    .from('page_version')
    .select(SELECT)
    .eq('page_id', pageId)
    .order('version_number', { ascending: true });
  if (error) throw error;
  return data;
};

const findById = async (versionId) => {
  const { data, error } = await supabase
    .from('page_version')
    .select(SELECT)
    .eq('version_id', versionId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const findByPageAndNumber = async (pageId, versionNumber) => {
  const { data, error } = await supabase
    .from('page_version')
    .select(SELECT)
    .eq('page_id', pageId)
    .eq('version_number', versionNumber)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase
    .from('page_version')
    .insert(payload)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
};

const update = async (versionId, payload) => {
  const { data, error } = await supabase
    .from('page_version')
    .update(payload)
    .eq('version_id', versionId)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
};

const updateByPageAndNumber = async (pageId, versionNumber, payload) => {
  const { data, error } = await supabase
    .from('page_version')
    .update(payload)
    .eq('page_id', pageId)
    .eq('version_number', versionNumber)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
};

const getNextVersionNumber = async (pageId) => {
  const { data, error } = await supabase
    .from('page_version')
    .select('version_number')
    .eq('page_id', pageId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? data.version_number + 1 : 1;
};

module.exports = { findByPageId, findById, findByPageAndNumber, create, update, updateByPageAndNumber, getNextVersionNumber };
