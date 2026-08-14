const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Uploads an in-memory buffer to Cloudinary CDN.
 * Overwrites existing image if publicId is specified.
 * Fallback to Base64 data URI if Cloudinary credentials are not configured yet.
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {String} mimetype - File mimetype (e.g., 'image/png')
 * @param {String} folder - Cloudinary folder name
 * @param {String} publicId - Optional public ID (e.g., 'garage_12_logo') for overwriting
 * @returns {Promise<String>} - Returns HTTPS Cloudinary URL or Base64 Data URI
 */
const uploadImageToCloud = async (buffer, mimetype = 'image/png', folder = 'garage_logos', publicId = null) => {
  const isCloudinaryConfigured = 
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET;

  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: folder,
        resource_type: 'auto'
      };

      // If publicId is specified, overwrite the existing file on Cloudinary
      if (publicId) {
        uploadOptions.public_id = publicId;
        uploadOptions.overwrite = true;
        uploadOptions.invalidate = true; // Invalidate CDN cache so new image shows instantly
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          resolve(result.secure_url);
        }
      );

      uploadStream.end(buffer);
    });
  } else {
    // Fallback to Base64 string if Cloudinary keys are not yet provided
    console.warn('⚠️ Cloudinary keys not found in .env — Falling back to Base64 database storage.');
    const base64Data = buffer.toString('base64');
    return `data:${mimetype};base64,${base64Data}`;
  }
};

module.exports = {
  cloudinary,
  uploadImageToCloud
};
