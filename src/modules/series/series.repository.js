const supabase = require("../../config/supabase");

const ALLOWED_SORT = [
  "title",
  "status",
  "view_count",
  "created_at",
  "updated_at",
];

const findAll = async ({
  status,
  genre,
  keyword,
  user_id,
  offset,
  limit,
  sort,
  order,
}) => {
  let query = supabase
    .from("series")
    .select(
      `*, series_member(*, users:user_id(user_id, username, name, avatar_url, role))`,
      { count: "exact" },
    );

  if (user_id) {
    const { data: members, error: memErr } = await supabase
      .from("series_member")
      .select("series_id")
      .eq("user_id", user_id);
    if (memErr) throw memErr;
    
    const seriesIds = members.map((m) => m.series_id);
    if (seriesIds.length === 0) {
      return { data: [], total: 0 };
    }
    query = query.in("series_id", seriesIds);
  }

  if (status) query = query.eq("status", status);
  if (genre) query = query.ilike("genre", `%${genre}%`);
  if (keyword) query = query.ilike("title", `%${keyword}%`);

  const sortCol = ALLOWED_SORT.includes(sort) ? sort : "created_at";
  query = query.order(sortCol, { ascending: order !== "desc" });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const findById = async (seriesId) => {
  const { data, error } = await supabase
    .from("series")
    .select("*")
    .eq("series_id", seriesId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const findByIdWithDetail = async (seriesId) => {
  const { data, error } = await supabase
    .from("series")
    .select(
      `*, chapter(*, chapter_like(user_id)), series_member(*, users:user_id(user_id, username, name, avatar_url, role))`,
    )
    .eq("series_id", seriesId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (payload) => {
  const { data, error } = await supabase
    .from("series")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

const update = async (seriesId, payload) => {
  const { data, error } = await supabase
    .from("series")
    .update(payload)
    .eq("series_id", seriesId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

const deleteById = async (seriesId) => {
  const { error } = await supabase
    .from("series")
    .delete()
    .eq("series_id", seriesId);
  if (error) throw error;
};

const existsById = async (seriesId) => {
  const { data, error } = await supabase
    .from("series")
    .select("series_id")
    .eq("series_id", seriesId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
};

module.exports = {
  findAll,
  findById,
  findByIdWithDetail,
  create,
  update,
  deleteById,
  existsById,
};
