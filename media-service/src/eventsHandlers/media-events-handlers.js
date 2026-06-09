const { deleteFromCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");
const Media = require("../models/Media"); // ✅ import Media model

const handlePostDeleted = async (event) => {
  logger.info("Handling post deleted event", event);
  const { postId, mediaIds } = event;

  try {
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });

    for (const media of mediaToDelete) {
      await deleteFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id); // ✅ call on Model not instance

      logger.info(`Deleted media ${media._id} associated with deleted post ${postId}`);
    }

    logger.info(`Finished handling post deleted event for post ${postId}`);
  } catch (e) {
    logger.error("Error handling post deleted event", e);
  }
};

module.exports = { handlePostDeleted };