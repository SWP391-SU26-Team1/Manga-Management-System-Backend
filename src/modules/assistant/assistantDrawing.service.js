const supabase = require('../../config/supabase');
const AppError = require('../../utils/appError');

/**
 * List all pages in progress for drawing/editing by assistant
 */
const listDrawingPages = async (assistantId, filters = {}) => {
  try {
    let query = supabase
      .from('page')
      .select(`
        page_id,
        page_number,
        chapter_id,
        status,
        created_at,
        updated_at,
        chapter(chapter_id, chapter_number, title, series_id),
        page_version(version_id, version_number, version_type, image_url, created_at),
        page_task(task_id, task_type, status, deadline, content, assistant_id)
      `)
      .in('status', ['in_progress', 'review']);

    // Optionally filter by chapter
    if (filters.chapter_id) {
      query = query.eq('chapter_id', filters.chapter_id);
    }

    // Optionally filter by page status
    if (filters.page_status) {
      query = query.eq('status', filters.page_status);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw new AppError(error.message, 500);

    // Filter pages where assistant has assigned tasks
    const filtered = data?.filter(page => {
      const hasTask = page.page_task?.some(task => task.assistant_id === assistantId);
      return hasTask;
    }) || [];

    return filtered;
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(error.message, 500);
  }
};

/**
 * List all page versions (phiên bản vẽ) for a page
 */
const listPageVersions = async (pageId, assistantId) => {
  try {
    // First verify page exists and assistant has task on it
    const { data: page, error: pageError } = await supabase
      .from('page')
      .select('page_id, page_task(task_id, assistant_id)')
      .eq('page_id', pageId)
      .single();

    if (pageError) throw new AppError('Page not found', 404);

    const hasAccess = page.page_task?.some(task => task.assistant_id === assistantId);
    if (!hasAccess) throw new AppError('You do not have access to this page', 403);

    // Get all versions
    const { data, error } = await supabase
      .from('page_version')
      .select('*')
      .eq('page_id', pageId)
      .order('version_number', { ascending: true });

    if (error) throw new AppError(error.message, 500);
    return data || [];
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(error.message, 500);
  }
};

/**
 * Get drawing page detail with all versions and tasks
 */
const getDrawingPageDetail = async (pageId, assistantId) => {
  try {
    const { data, error } = await supabase
      .from('page')
      .select(`
        *,
        chapter(chapter_id, chapter_number, title, series_id),
        page_region(region_id, x, y, width, height),
        page_version(version_id, version_number, version_type, image_url, created_at),
        page_task(task_id, task_type, status, deadline, content, assistant_id),
        annotation(annotation_id, content, x, y, status, user_id, created_at)
      `)
      .eq('page_id', pageId)
      .single();

    if (error) throw new AppError('Page not found', 404);

    // Verify assistant has access (has task assigned)
    const hasTask = data.page_task?.some(task => task.assistant_id === assistantId);
    if (!hasTask) throw new AppError('You do not have access to this page', 403);

    return data;
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(error.message, 500);
  }
};

/**
 * Get version detail with submission info
 */
const getVersionDetail = async (versionId) => {
  try {
    const { data: version, error: vError } = await supabase
      .from('page_version')
      .select('*')
      .eq('version_id', versionId)
      .single();

    if (vError) throw new AppError('Version not found', 404);

    // Get submission for this version if exists
    const { data: submission } = await supabase
      .from('page_submission')
      .select('*, page_task_feedback(feedback_id, content, mangaka_id, created_at)')
      .eq('page_id', version.page_id)
      .eq('version_number', version.version_number)
      .maybeSingle();

    return {
      ...version,
      submission: submission || null
    };
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(error.message, 500);
  }
};

/**
 * List current drawing tasks by assistant
 */
const listMyDrawingTasks = async (assistantId, filters = {}) => {
  try {
    let query = supabase
      .from('page_task')
      .select(`
        *,
        page(page_id, page_number, chapter_id, status),
        page_region(region_id, x, y, width, height),
        page_submission(submission_id, file_url, version_number, submission_status, submitted_at)
      `)
      .eq('assistant_id', assistantId)
      .in('status', ['assigned', 'in_progress', 'submitted', 'review']);

    // Filter by task type if provided
    if (filters.task_type) {
      query = query.eq('task_type', filters.task_type);
    }

    // Filter by status if provided
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Filter overdue tasks
    if (filters.overdue === 'true') {
      query = query.lt('deadline', new Date().toISOString());
    }

    const { data, error } = await query.order('deadline', { ascending: true });

    if (error) throw new AppError(error.message, 500);
    return data || [];
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(error.message, 500);
  }
};

/**
 * Update page status during drawing
 */
const updatePageStatus = async (pageId, newStatus) => {
  try {
    const validStatuses = ['draft', 'in_progress', 'review', 'completed', 'published'];
    if (!validStatuses.includes(newStatus)) {
      throw new AppError('Invalid page status', 400);
    }

    const { data, error } = await supabase
      .from('page')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('page_id', pageId)
      .single();

    if (error) throw new AppError(error.message, 500);
    return data;
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(error.message, 500);
  }
};

module.exports = {
  listDrawingPages,
  listPageVersions,
  getDrawingPageDetail,
  getVersionDetail,
  listMyDrawingTasks,
  updatePageStatus
};
