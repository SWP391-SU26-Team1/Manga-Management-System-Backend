const supabase = require("../../config/supabase");
const AppError = require("../../utils/appError");

/**
 * List all draft manuscripts (nháp script) assigned to assistant
 */
const listDraftManuscripts = async (assistantId, filters = {}) => {
  try {
    let query = supabase
      .from("manuscript")
      .select(
        "*, series(series_id, title), chapter(chapter_id, chapter_number, title)",
      )
      .eq("status", "draft");

    // Optionally filter by series
    if (filters.series_id) {
      query = query.eq("series_id", filters.series_id);
    }

    // Optionally filter by chapter
    if (filters.chapter_id) {
      query = query.eq("chapter_id", filters.chapter_id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw new AppError(error.message, 500);
    return data || [];
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(error.message, 500);
  }
};

/**
 * List all draft pages (trang ở trạng thái draft) assigned to assistant
 */
const listDraftPages = async (assistantId, filters = {}) => {
  try {
    let query = supabase
      .from("page")
      .select(
        `
        page_id,
        page_number,
        chapter_id,
        status,
        created_at,
        updated_at,
        chapter(chapter_id, chapter_number, title, series_id),
        page_region(region_id, x, y, width, height),
        page_version(version_id, version_number, version_type, image_url)
      `,
      )
      .eq("status", "draft");

    // Optionally filter by chapter
    if (filters.chapter_id) {
      query = query.eq("chapter_id", filters.chapter_id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw new AppError(error.message, 500);
    return data || [];
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(error.message, 500);
  }
};

/**
 * Get manuscript detail with files
 */
const getManuscriptDetail = async (manuscriptId) => {
  try {
    const { data, error } = await supabase
      .from("manuscript")
      .select(
        `
        *,
        series(series_id, title),
        chapter(chapter_id, chapter_number, title),
        manuscript_file(file_id, file_url, file_name, file_type, description, uploaded_at)
      `,
      )
      .eq("manuscript_id", manuscriptId)
      .single();

    if (error) throw new AppError("Manuscript not found", 404);
    return data;
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(error.message, 500);
  }
};

/**
 * Get draft page detail with regions and versions
 */
const getDraftPageDetail = async (pageId) => {
  try {
    const { data, error } = await supabase
      .from("page")
      .select(
        `
        *,
        chapter(chapter_id, chapter_number, title, series_id),
        page_region(region_id, x, y, width, height),
        page_version(version_id, version_number, version_type, image_url, created_at),
        page_task(task_id, task_type, status, deadline, content)
      `,
      )
      .eq("page_id", pageId)
      .single();

    if (error) throw new AppError("Page not found", 404);
    if (data.status !== "draft")
      throw new AppError("Page is not in draft status", 400);

    return data;
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(error.message, 500);
  }
};

/**
 * Update manuscript draft
 */
const updateManuscript = async (manuscriptId, updates) => {
  try {
    const { data, error } = await supabase
      .from("manuscript")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("manuscript_id", manuscriptId)
      .single();

    if (error) throw new AppError(error.message, 500);
    return data;
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(error.message, 500);
  }
};

/**
 * Delete draft manuscript
 */
const deleteManuscript = async (manuscriptId) => {
  try {
    const { error } = await supabase
      .from("manuscript")
      .delete()
      .eq("manuscript_id", manuscriptId);

    if (error) throw new AppError(error.message, 500);
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(error.message, 500);
  }
};

module.exports = {
  listDraftManuscripts,
  listDraftPages,
  getManuscriptDetail,
  getDraftPageDetail,
  updateManuscript,
  deleteManuscript,
};
