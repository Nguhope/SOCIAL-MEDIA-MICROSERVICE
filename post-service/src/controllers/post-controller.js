const logger = require("../utils/logger");
const Post = require("../models/post"); // add this import

const createPost = async (req, res) => {
  try {
    const { content, mediaIds } = req.body;
    const newlyCreatedPost = new Post({
      content,
      mediaIds: mediaIds || [],
      user: req.user.userId, // ✅ changed from req.user._id to req.user.userId
    });

    await newlyCreatedPost.save();
    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: newlyCreatedPost,
    });
  } catch (e) {
    logger.error("Error creating post", e); // ✅ changed error to e
    res.status(500).json({ success: false, message: "Error creating post" });
  }
};

const getAllPosts = async (req, res) => {
  try {
  } catch (e) {
    logger.error("Error getting all posts", e); // ✅ changed error to e
    res.status(500).json({ success: false, message: "Error getting all posts" });
  }
};

const getPost = async (req, res) => {
  try {
  } catch (e) {
    logger.error("Error getting post", e); // ✅ changed error to e
    res.status(500).json({ success: false, message: "Error getting post" });
  }
};

const deletePost = async (req, res) => {
  try {
  } catch (e) {
    logger.error("Error deleting post", e); // ✅ changed error to e
    res.status(500).json({ success: false, message: "Error deleting post" });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
};