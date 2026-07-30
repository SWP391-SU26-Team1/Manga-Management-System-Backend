const supabase = require("../../config/supabase");

const createComment = async ({
  userId,
  chapterId,
  parentCommentId,
  content,
  status,
}) => {
  const { data, error } = await supabase
    .from("comment")
    .insert({
      user_id: userId,
      chapter_id: chapterId,
      parent_comment_id: parentCommentId ?? null,
      content,
      status: status ?? "active",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

const listCommentsByChapter = async ({ chapterId, offset, limit }) => {
  const { data, error, count } = await supabase
    .from("comment")
    .select(`*, user: user_id (user_id, username, name, avatar_url)`, {
      count: "exact",
    })
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data, total: count };
};

const listCommentsBySeries = async ({ seriesId, offset, limit }) => {
  const { data, error, count } = await supabase
    .from("comment")
    .select(`
      *, 
      user: user_id (user_id, username, name, avatar_url),
      chapter!inner (series_id, chapter_number, title)
    `, { count: "exact" })
    .eq("chapter.series_id", seriesId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data, total: count };
};

const findById = async (commentId) => {
  const { data, error } = await supabase
    .from("comment")
    .select("*")
    .eq("comment_id", commentId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const deleteById = async (commentId) => {
  const { error } = await supabase
    .from("comment")
    .delete()
    .eq("comment_id", commentId);

  if (error) throw error;
};

module.exports = {
  createComment,
  listCommentsByChapter,
  listCommentsBySeries,
  findById,
  deleteById,
};
