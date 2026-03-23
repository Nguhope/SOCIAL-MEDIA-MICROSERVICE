const generateToken = require("../utils/generatedToken");
const logger = require("../utils/Logger");
const { validateRegistration } = require("../utils/validation");



//user registration
const registerUser = async (req, res) => {
  logger.info("Registration endpoint hit....");

  try {
    const {} = validateRegistration(req.body);

    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password, username } = req.body;

    let user = await UserActivation.findone({ $or: [{ email }, { username }] });

    if (user) {
      logger.warn("User already exists", { email, username });
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    user = new UserActivation({ username, email, password });
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

//user login

//refresh token

//logout


module.exports = {
  registerUser,
};