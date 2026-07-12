const supabase = require("../../config/supabase");

const createOrUpdateBookmark = async ({
  userId,
  seriesId,
  lastReadChapterId,
  pageId,
}) => {
  const payload = {
    user_id: userId,
    series_id: seriesId,
    last_read_chapter_id: lastReadChapterId ?? null,
    page_id: pageId ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("bookmark")
    .upsert(payload, { onConflict: "user_id,series_id" })
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data;
};

const listBookmarksByUser = async ({ userId, offset, limit }) => {
  const { data, error, count } = await supabase
    .from("bookmark")
    .select(`*, series(*), chapter:last_read_chapter_id(*)`, { count: "exact" })
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data, total: count };
};

module.exports = { createOrUpdateBookmark, listBookmarksByUser };
