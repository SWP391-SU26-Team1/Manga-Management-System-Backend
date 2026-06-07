const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../../utils/cloudinary');
const AppError = require('../../utils/appError');

const uploadSingle = async (file, folder) => {
  if (!file) throw new AppError('No file provided', 400);
  const result = await uploadBufferToCloudinary(file.buffer, { folder });
  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    resource_type: result.resource_type,
    format: result.format,
  };
};

const uploadMultiple = async (files, folder) => {
  if (!files || files.length === 0) throw new AppError('No files provided', 400);
  const results = await Promise.all(files.map((f) => uploadBufferToCloudinary(f.buffer, { folder })));
  return results.map((r) => ({
    secure_url: r.secure_url,
    public_id: r.public_id,
    resource_type: r.resource_type,
    format: r.format,
  }));
};

const deleteFile = async (publicId) => {
  if (!publicId) throw new AppError('publicId is required', 400);
  return deleteFromCloudinary(publicId);
};

module.exports = { uploadSingle, uploadMultiple, deleteFile };
