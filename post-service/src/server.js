require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const postRoutes = require("./routes/post-routes");
const logger = require("./utils/logger");
const errorHandler = require("./middlewares/errorHandler");
const helmet = require("helmet");
const { connectToRabbitMQ } = require("./utils/rabbitmq");

const app = express();
const PORT = process.env.PORT || 3002;

// Redis 
const redis = new Redis(process.env.REDIS_URL);

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());

// MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => logger.error("Failed to connect to MongoDB", err));

// homework --> implement Ip baseed rate limitng for sensitive endpoints like create post, update post, delete post etc.
//  you can use redis to store the count of requests from each IP and reset it after a certain time period. this will help to prevent abuse and ensure fair usage of your API.

// Logger middleware
app.use((req, res, next) => {
  logger.info(`Received ${req.method} ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

// Routes
app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redis; // ✅ FIXED
    next();
  },
  postRoutes,
);



// Error handler (ALWAYS LAST)
app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (e) {
    logger.error("Failed to start server:", e);
    process.exit(1);
  }
}

// Start server
startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down server...");
  process.exit(0);
});

// Handle unhandled promises
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
