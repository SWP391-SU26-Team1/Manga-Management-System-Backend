const service = require('./mangakaExport.service');
const { sendSuccess } = require('../../utils/response');

const exportSeries = async (req, res, next) => {
  try {
    const data = await service.exportSeries(req.user.user_id, req.params.seriesId);
    return sendSuccess(res, 200, data, 'Export successful');
  } catch (e) { next(e); }
};

const exportChapter = async (req, res, next) => {
  try {
    const data = await service.exportChapter(req.user.user_id, req.params.seriesId, req.params.chapterId);
    return sendSuccess(res, 200, data, 'Export successful');
  } catch (e) { next(e); }
};

module.exports = { exportSeries, exportChapter };
