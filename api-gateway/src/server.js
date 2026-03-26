require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");
const helmet = require("helmet");
const { RedisStore } = require("rate-limit-redis");
const { rateLimit } = require("express-rate-limit");
const logger = require("./utils/logger");
const proxy = require("express-http-proxy");
const errorhandler = require("./middleware/errorhandler");

const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

//rate limiting

const ratelimitOptions = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res
      .status(429)
      .json({ message: "Too many requests, please try again later." });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use(ratelimitOptions);

app.use((req, res, next) => {
  logger.info(` Received${req.method} ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {  // ✅ removed "Opt"
    const newPath = req.originalUrl.replace(/^\/v1/, "/api");
    logger.info(`Proxying to: ${newPath}`);
    return newPath;
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: `Internal server error`,
      error: err.message,
    });
  },
};

// setting up proxy for our identity

app.use(
  "/v1/auth",
  proxy(process.env.INDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from identity service: ${proxyRes.statusCode}`,
      );
      return proxyResData;
    },
  }),
);

app.use(errorhandler);

app.listen(PORT, () => {
  logger.info(`API gateway is running on port ${PORT}`);
  logger.info(
    `Identity service is running on port ${process.env.INDENTITY_SERVICE_URL}`,
  );
  logger.info(`Redis Url service is running on port ${process.env.REDIS_URL}`);
});
