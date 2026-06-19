const supabase = require("../../config/supabase");

const SELECT = `*`;

const findAll = async ({ userId, seriesId } = {}) => {
  let query = supabase
    .from("recovery_proposal")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (userId) query = query.eq("created_by_user_id", userId);
  if (seriesId) query = query.eq("series_id", seriesId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

const findById = async (proposalId) => {
  const { data, error } = await supabase
    .from("recovery_proposal")
    .select(SELECT)
    .eq("proposal_id", proposalId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase
    .from("recovery_proposal")
    .insert(payload)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
};

const update = async (proposalId, payload) => {
  const { data, error } = await supabase
    .from("recovery_proposal")
    .update(payload)
    .eq("proposal_id", proposalId)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
};
