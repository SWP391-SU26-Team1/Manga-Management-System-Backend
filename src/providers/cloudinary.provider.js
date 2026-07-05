const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const AppError = require('../utils/appError');

const extractPublicIdFromUrl = (url) => {
  if (!url || !url.startsWith('http')) {
    return url; // Assume it's already a public_id if it doesn't start with http
  }

  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    let pathPart = parts[1];
    // Strip version number if present (e.g., v1234567890/)
    pathPart = pathPart.replace(/^v\d+\//, '');
    
    // Strip file extension
    const lastDotIdx = pathPart.lastIndexOf('.');
    if (lastDotIdx !== -1) {
      pathPart = pathPart.slice(0, lastDotIdx);
    }

    return pathPart;
  } catch (err) {
    return null;
  }
};

const uploadAIImage = async (buffer, folder = 'manga-ai-suggestions') => {
  try {
    const result = await uploadBufferToCloudinary(buffer, { folder });
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('❌ Cloudinary Upload Error:', error.message || error);
    throw new AppError(`Failed to upload AI result image to Cloudinary: ${error.message || 'Unknown error'}`, 502);
  }
};

const deleteAIImage = async (publicIdOrUrl) => {
  if (!publicIdOrUrl) return;

  const publicId = extractPublicIdFromUrl(publicIdOrUrl);
  if (!publicId) {
    console.warn('⚠️ Could not extract Cloudinary public_id from:', publicIdOrUrl);
    return;
  }

  try {
    await deleteFromCloudinary(publicId);
  } catch (error) {
    console.error(`❌ Cloudinary Delete Error for public_id (${publicId}):`, error.message || error);
    throw new AppError(`Failed to delete image from Cloudinary: ${error.message || 'Unknown error'}`, 502);
  }
};

module.exports = {
  uploadAIImage,
  deleteAIImage,
  extractPublicIdFromUrl,
};
