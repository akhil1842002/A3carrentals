const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary from environment variables
const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('☁️ Cloudinary configured successfully for A3 Car Rentals');
}

/**
 * Upload a local file to Cloudinary
 * @param {string} localFilePath - Path to file saved on disk (e.g. by multer)
 * @param {string} folder - Destination folder on Cloudinary (e.g. 'cars', 'tyres')
 * @returns {Promise<string>} - Cloudinary secure_url, or original local path if Cloudinary is not configured
 */
async function uploadToCloudinary(localFilePath, folder = 'cars') {
  if (!isConfigured) {
    return null; // Fallback to local storage path
  }

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: `a3carrentals/${folder}`,
      resource_type: 'image',
      use_filename: true,
      unique_filename: true
    });

    // Optionally cleanup local file after successful upload to Cloudinary
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (cleanupErr) {
      // Non-fatal cleanup error
    }

    return result.secure_url;
  } catch (err) {
    console.error('❌ Cloudinary upload error:', err.message);
    return null;
  }
}

module.exports = {
  isConfigured,
  uploadToCloudinary
};
