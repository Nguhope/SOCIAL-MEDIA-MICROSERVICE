const logger = require("../utils/logger");
const Post = require("../models/post"); // add this import
const { ValidateCreatePost } = require("../utils/validation"); // add this import
const { publishEvent } = require("../utils/rabbitmq");

async function invalidatePostcached(req, input) {
  const cacheKey = `post:${input}`;
  await req.redisClient.del(cacheKey);
  logger.info(`Cache invalidated for post:${input}`);

  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
    logger.info("Post cache invalidated");
  }
}

//create Post
const createPost = async (req, res) => {
  logger.info("Create post endpoint hit.....");
  try {
    const { error, value } = ValidateCreatePost(req.body);

    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { content, mediaIds } = value; // ✅ Use validated value from Joi
    const newlyCreatedPost = new Post({
      content,
      mediaIds: mediaIds || [],
      user: req.user.userId, // ✅ changed from req.user._id to req.user.userId
    });

    await newlyCreatedPost.save();
    await invalidatePostcached(req, newlyCreatedPost._id.toString()); // Invalidate cache after creating a post

    // Publish event to RabbitMQ
    await publishEvent("post.created", {
      postId: newlyCreatedPost._id.toString(),
      userId: newlyCreatedPost.user,
      content: newlyCreatedPost.content,
      mediaIds: newlyCreatedPost.mediaIds,
      createdAt: newlyCreatedPost.createdAt,
    });

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
// get all post
const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:page:${page}:limit:${limit}`;
    const cachedPost = await req.redisClient.get(cacheKey);

    if (cachedPost) {
      logger.info("Posts retrieved from cache");
      return res.status(200).json({
        success: true,
        message: "Posts retrieved successfully (from cache)",
        posts: JSON.parse(cachedPost),
      });
    }

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit); // ✅ added sorting by createdAt in descending order

    const totalPosts = await Post.countDocuments(); // ✅ get total count of posts

    const result = {
      posts,
      currentpage: page,
      totaltpages: Math.ceil(totalPosts / limit), // ✅ calculate total pages
      totalPosts: totalPosts, // ✅ include total posts in response
    };

    //save your result in cache for 1 hour

    await req.redisClient.setex(cacheKey, 3600, JSON.stringify(result)); // Cache for 1 hour
    logger.info("Posts retrieved from database");
    res.status(200).json({
      success: true,
      message: "Posts retrieved successfully",
      ...result,
    });
  } catch (e) {
    logger.error("Error getting all posts", e); // ✅ changed error to e
    res
      .status(500)
      .json({ success: false, message: "Error getting all posts" });
  }
};
// get single post
const getPost = async (req, res) => {
  logger.info("Get single post endpoint hit.....");
  try {
    const postId = req.params.id; // ✅ fixed: req.params.id not req.parms._id

    const cacheKey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cacheKey);

    if (cachedPost) {
      logger.info("Post retrieved from cache");
      return res.status(200).json({
        success: true,
        message: "Post retrieved successfully (from cache)",
        post: JSON.parse(cachedPost),
      });
    }

    const post = await Post.findById(postId); // ✅ inside try/catch now

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    await req.redisClient.setex(cacheKey, 3600, JSON.stringify(post));

    res.status(200).json({
      // ✅ consistent response shape
      success: true,
      message: "Post retrieved successfully",
      post,
    });
  } catch (e) {
    logger.error("Error getting post", e);
    res.status(500).json({ success: false, message: "Error getting post" });
  }
};

//delete post
const deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you are not authorized to delete this post",
      });
    }

    //publish post delete method

    await piblishEvent("post.deleted", {
      postId: post._id.toString(),
      userId: req.user.userId,
      mediaIds: post.mediaIds,
    });

    await invalidatePostcached(req, req.params.id);
    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (e) {
    logger.error("Error deleting post", e);
    res.status(500).json({ success: false, message: "Error deleting post" });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
};
