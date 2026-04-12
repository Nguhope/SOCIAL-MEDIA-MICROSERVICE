const logger = require("../utils/logger");
const Media = require("../models/Media");
const { uploadToCloudinary } = require("../utils/cloudinary");

const uploadMedia = async (req, res) => {
  logger.info("Received request to upload media");
  try {

    console.log(req.file,"req.filtereq.file");
    
    // Check for multer errors
    if (req.fileValidationError) {
      logger.error("File validation error:", req.fileValidationError);
      return res.status(400).json({ error: req.fileValidationError });
    }

    if (!req.file) {
      logger.warn("No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { originalname, mimetype, size } = req.file;
    const userId = req.user.userId;

    logger.info(
      `Uploading file: name= ${originalname}, type= ${mimetype}, size= ${size} bytes`,
    );
    logger.info("Uploading file to Cloudinary...");

    const result = await uploadToCloudinary(req.file);
    logger.info(
      `Cloudinary upload successful. Public Id: - ${result.public_id}`,
    );

    // ✅ save to DB first
    const newlyCreatedMedia = new Media({
      publicId: result.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: result.secure_url,
      userId,
      size,
    });
    await newlyCreatedMedia.save();

    // ✅ then send ONE response
    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: result.secure_url,
      message: "File uploaded successfully",
    });
  } catch (error) {
    logger.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
};

const getAllMedia = async (req, res) => {
  try {

    const result = await Media.find({})
    res.status(200).json(result);
    
  } catch (e) {
    logger.error("Error fetching media:", e);
    res.status(500).json({ error: "Failed to fetch media" });
    
  }
}

module.exports = { uploadMedia , getAllMedia};
