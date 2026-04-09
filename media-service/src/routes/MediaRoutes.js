const express = require("express");
const multer = require("multer");
const { uploadMedia, getAllMedia } = require("../controllers/media-controller");
const { authenticate } = require("../middlewares/authMiddleware");

const logger = require("../utils/logger");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB file size limit
  },
}).single("file");

router.post("/upload", authenticate, upload, uploadMedia);

router.get("/get", authenticate, getAllMedia);

module.exports = router;
