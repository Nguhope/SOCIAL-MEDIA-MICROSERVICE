const generateToken = require("../utils/generatedToken");
const logger = require("../utils/Logger");
const { validateRegistration } = require("../utils/validation");
const User = require("../module/User"); // ⬅️ You were missing this import entirely

// User registration
const registerUser = async (req, res) => {
  logger.info("Registration endpoint hit....");

  try {
    // ✅ FIX 1: Destructure { error, value } from validateRegistration
    // You had `const {} = ...` which captured nothing
    const { error, value } = validateRegistration(req.body);

    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // ✅ FIX 2: Use validated `value` from Joi instead of raw req.body
    const { email, password, username } = value;

    // ✅ FIX 3: `UserActivation` doesn't exist — use your actual model (User)
    // ✅ FIX 4: `findone` doesn't exist — it's `findOne` (capital O)
    let user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      logger.warn("User already exists", { email, username });
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // ✅ FIX 3 again: Use User, not UserActivation
    user = new User({ username, email, password });
    await user.save();

    logger.info("User registered successfully", user._id);

    const { accessToken, refreshToken } = await generateToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error occurred", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

module.exports = {
  registerUser,
};