require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const mediaRoutes = require("./routes/MediaRoutes");
const logger = require("./utils/logger");
const errorHandler = require("./middlewares/errorHandler");
const cors = require("cors");
const helmet = require("helmet");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const { handlePostDeleted } = require("./eventsHandlers/media-events-handlers");

const app = express();
const PORT = process.env.PORT || 3003;

//connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => logger.error("Failed to connect to MongoDB", err));

//middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());

//***** Homework - implement Ip based rate limiting for sensitive endpoint */

//
app.use("/api/media", mediaRoutes);

app.use(errorHandler); // Error handler (ALWAYS LAST)

async function startServer() {
  try {
    await connectToRabbitMQ();

    //consume all the events related to media service

    await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      logger.info(`Media Service is running on port ${PORT}`);
    });
  } catch (e) {
    logger.error("Failed to start server:", e);
    process.exit(1);
  }
}

startServer();

// Handle unhandled promises
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
