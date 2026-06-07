const multer = require('multer');
const { ApiError } = require('../utils/response');

const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new ApiError(400, 'Only image files are allowed'));
  }

  cb(null, true);
};

const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  uploadImage,
};
