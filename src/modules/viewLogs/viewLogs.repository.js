const supabase = require("../../config/supabase");

const createViewLog = async ({ chapterId, seriesId, userId }) => {
  const { data, error } = await supabase
    .from("view_log")
    .insert({ 
      chapter_id: chapterId,
      series_id: seriesId ?? null,
      user_id: userId ?? null
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

module.exports = { createViewLog };
