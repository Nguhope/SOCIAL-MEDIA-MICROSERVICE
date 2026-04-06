require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const postRoutes = require("./routes/post-routes");
const logger = require("./utils/logger");
const errorHandler = require("./middlewares/errorHandler");
const helmet = require("helmet");

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

// Routes
app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redis; // ✅ FIXED
    next();
  },
  postRoutes
);

// Logger middleware
app.use((req, res, next) => {
  logger.info(`Received ${req.method} ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

// Error handler (ALWAYS LAST)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Handle unhandled promises
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});