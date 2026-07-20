const supabase = require("../../config/supabase");

const toggleLike = async ({ userId, chapterId }) => {
  const { data: existing, error: findError } = await supabase
    .from("chapter_like")
    .select("*")
    .eq("user_id", userId)
    .eq("chapter_id", chapterId)
    .maybeSingle();

  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase
      .from("chapter_like")
      .delete()
      .eq("like_id", existing.like_id);
    if (error) throw error;
    return { liked: false };
  }

  const { data, error } = await supabase
    .from("chapter_like")
    .insert({ user_id: userId, chapter_id: chapterId })
    .select("*")
    .single();
  if (error) throw error;
  return { liked: true, like: data };
};

const countLikes = async (chapterId) => {
  const { count, error } = await supabase
    .from("chapter_like")
    .select("*", { count: "exact", head: true })
    .eq("chapter_id", chapterId);
  if (error) throw error;
  return count || 0;
};

module.exports = { toggleLike, countLikes };
