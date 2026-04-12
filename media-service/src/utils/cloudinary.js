const cloudinary = require("cloudinary").v2;
const logger = require("./logger");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) {
          logger.error("Error  while uploading media to Cloudinary:", error);
          reject(error);
        } else {
          logger.info("File uploaded to Cloudinary:", result.secure_url);
          resolve(result);
        }
      },
    );
    uploadStream.end(file.buffer);
  });
};




const deleteFromCloudinary = async (publicId) => {
  try {

    const result =  await cloudinary.uploader.destroy(publicId);
    logger.info("File deleted from Cloudinary:", publicId);
    return result;
    
  } catch (error) {
      logger.error("Error while deleting media from Cloudinary:", error);
      throw error;
  }
}



module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
