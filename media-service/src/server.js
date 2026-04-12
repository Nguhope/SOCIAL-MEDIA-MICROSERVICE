require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const mediaRoutes = require("./routes/MediaRoutes");
const logger = require("./utils/logger");
const errorHandler = require("./middlewares/errorHandler");
const cors = require("cors");
const helmet = require("helmet");

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
    
  } catch (error) {
    
  }
  
}

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Handle unhandled promises
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
