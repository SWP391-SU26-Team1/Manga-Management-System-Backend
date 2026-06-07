const supabase = require('../../config/supabase');
const AppError = require('../../utils/appError');

const resolveSeriesId = async (req) => {
  if (req.params.seriesId) return req.params.seriesId;

  if (req.params.chapterId) {
    const { data } = await supabase
      .from('chapter')
      .select('series_id')
      .eq('chapter_id', req.params.chapterId)
      .maybeSingle();
    return data?.series_id;
  }

  if (req.params.pageId) {
    const { data } = await supabase
      .from('page')
      .select('chapter:chapter_id(series_id)')
      .eq('page_id', req.params.pageId)
      .maybeSingle();
    return data?.chapter?.series_id;
  }

  if (req.params.taskId) {
    const { data } = await supabase
      .from('page_task')
      .select('page:page_id(chapter:chapter_id(series_id))')
      .eq('task_id', req.params.taskId)
      .maybeSingle();
    return data?.page?.chapter?.series_id;
  }

  if (req.params.regionId) {
    const { data } = await supabase
      .from('page_region')
      .select('page:page_id(chapter:chapter_id(series_id))')
      .eq('region_id', req.params.regionId)
      .maybeSingle();
    return data?.page?.chapter?.series_id;
  }

  if (req.params.manuscriptId) {
    const { data } = await supabase
      .from('manuscript')
      .select('series_id')
      .eq('manuscript_id', req.params.manuscriptId)
      .maybeSingle();
    return data?.series_id;
  }

  return null;
};

const requireSeriesMembership = async (req, res, next) => {
  try {
    const seriesId = await resolveSeriesId(req);
    if (!seriesId) return next(new AppError('Cannot resolve series for this resource', 400));

    const { data } = await supabase
      .from('series_member')
      .select('series_member_id')
      .eq('series_id', seriesId)
      .eq('user_id', req.user.user_id)
      .maybeSingle();

    if (!data) return next(new AppError('Access denied: you are not a member of this series', 403));

    req.resolvedSeriesId = seriesId;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireSeriesMembership };
