const logger = require("../utils/logger");
const Search = require("../models/search");

const searchPostController = async (req, res) => {
  logger.info("Search endpoint hints");
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, message: "Query parameter is required" });
    }

    const results = await Search.aggregate([
      {
        $match: {
          $text: { $search: query }
        }
      },
      {
        $addFields: {
          score: { $meta: "textScore" }
        }
      },
      {
        $sort: { score: { $meta: "textScore" } }
      },
      {
        $limit: 10
      }
    ]);

    res.json({ success: true, results });
  } catch (e) {
    logger.error("Error searching posts", e);
    res.status(500).json({ success: false, message: "Error searching posts" });
  }
};


module.exports = {
  searchPostController,
};