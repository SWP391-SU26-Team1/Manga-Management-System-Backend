const uploadsService = require('./uploads.service');
const { sendSuccess } = require('../../utils/response');

const uploadSingle = async (req, res, next) => {
  try {
    const folder = req.body.folder;
    const result = await uploadsService.uploadSingle(req.file, folder);
    return sendSuccess(res, 201, result, 'File uploaded successfully');
  } catch (error) {
    next(error);
  }
};

const uploadMultiple = async (req, res, next) => {
  try {
    const folder = req.body.folder;
    const result = await uploadsService.uploadMultiple(req.files, folder);
    return sendSuccess(res, 201, result, 'Files uploaded successfully');
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    await uploadsService.deleteFile(publicId);
    return sendSuccess(res, 200, null, 'File deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadSingle, uploadMultiple, deleteFile };
