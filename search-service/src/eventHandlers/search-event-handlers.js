
const logger = require("../utils/Logger");
const Search = require("../models/Search");

async function handlePostCreated(event) {
  try {
    const newSearchPost = new Search({
      postId: event.postId,
      content: event.content,
      userId: event.userId,
      authorId: event.authorId,
      createdAt: event.createdAt,
    });

    await newSearchPost.save();

    logger.info(
      `search post created event handled for postId:
       ${event.postId},${newSearchPost._id.toString()}`,
    );
  } catch (e) {
    logger.error("Error handling post.created event", e);
  }
}

async function handlePostDeleted(event) {


  try{
  await Search.findOneAndDelete({ postId: event.postId });

  logger.info(
    `search post deleted: ${event.postId}`,
  );


  }

  catch (e) {
    logger.error("Error handling post deleted event", e);
  }
  
}


module.exports = {
  handlePostCreated,
  handlePostDeleted,
};