require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("./utils/logger");
const errorHandler = require("./middlewares/errorHandler");
const { connectToRabbitMQ, consume } = require("./utils/rabbitmq");
const searchRoutes = require("./routes/search-routes");
const {
  handlePostCreated,
  handlePostDeleted,
} = require("./eventHandlers/search-event-handlers");

const app = express();
const PORT = process.env.PORT || 3004;

// MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => logger.error("Failed to connect to MongoDB", err));

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());

// Logger middleware
app.use((req, res, next) => {
  logger.info(`Received ${req.method} ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

//**** */ homework --> implement Ip baseed rate
// limitng for sensitive endpoints like create post, update post, delete post etc.
//  you can use redis to store the count of requests from each IP and reset it after a
//certain time period. this will help to prevent abuse and ensure fair usage of your API.


//***** homework  --->  pass redis client as pasrt of your req and then implement caching
//  */
app.use("/api/search", searchRoutes);

app.use(errorHandler);

async function startServer(params) {
  try {
    await connectToRabbitMQ();

    await consume("post.created", handlePostCreated);
    await consume("post.deleted", handlePostDeleted);

    app.listen(PORT, () => {
      logger.info(`Search service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start search service ", error);
    process.exit(1);
  }
}

startServer();
