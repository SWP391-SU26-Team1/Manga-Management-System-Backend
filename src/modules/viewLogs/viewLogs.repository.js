const supabase = require("../../config/supabase");

const createViewLog = async ({ chapterId }) => {
  const { data, error } = await supabase
    .from("view_log")
    .insert({ chapter_id: chapterId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

module.exports = { createViewLog };
