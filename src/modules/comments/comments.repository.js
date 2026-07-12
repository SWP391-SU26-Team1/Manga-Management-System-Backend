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
    .is("parent_comment_id", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data, total: count };
};

module.exports = { createComment, listCommentsByChapter };
