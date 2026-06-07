const cloudinary = require('../config/cloudinary');

const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'manga-management',
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

const deleteFromCloudinary = (publicId, options = {}) => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
    ...options,
  });
};

module.exports = {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
};
