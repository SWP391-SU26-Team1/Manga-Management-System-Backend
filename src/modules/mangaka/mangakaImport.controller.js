const service = require('./mangakaImport.service');
const { sendSuccess } = require('../../utils/response');

const importChapter = async (req, res, next) => {
  try {
    const data = await service.importChapter(req.user.user_id, req.params.seriesId, req.body);
    return sendSuccess(res, 201, data, 'Chapter imported successfully');
  } catch (e) { next(e); }
};

const importFromExport = async (req, res, next) => {
  try {
    const data = await service.importFromExport(req.user.user_id, req.params.seriesId, req.body);
    return sendSuccess(res, 201, data, 'Import successful');
  } catch (e) { next(e); }
};

module.exports = { importChapter, importFromExport };
