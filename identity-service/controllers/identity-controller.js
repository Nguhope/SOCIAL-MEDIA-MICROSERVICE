const generateToken = require("../utils/generatedToken");
const logger = require("../utils/Logger");
const { validateRegistration, validateLogin } = require("../utils/validation");
const User = require("../module/User"); // ⬅️ You were missing this import entirely
const RefreshToken = require("../module/RefreshToken");

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

//login user

const loginUser = async (req, res) => {
  logger.info("Login enpoint hint...");
  try {
    const { error, value } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // ✅ FIX 2: Use validated `value` from Joi instead of raw req.body
    const { email, password } = value;

    const user = await User.findOne({ email });

    //if the user is not present

    if (!user) {
      logger.warn("invalid user");
      return res.status(400).json({
        success: false,
        message: "invalid credentials",
      });
    }

    //if the user is present or not

    const isValidePassword = await user.comparePassword(password);
    if (!isValidePassword) {
      logger.warn("invalid password");
      return res.status(400).json({
        success: false,
        message: "invalid password",
      });
    }

    const { accessToken, refreshToken } = await generateToken(user);
    res.json({
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Login error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal error",
    });
  }
};

//refesh token

const refreshTokenUser = async (req, res) => {
  logger.info("refresh Token endpoint hit.....");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storeToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storeToken || storeToken.expiresAt < new Date()) {
      logger.warn("Invalide or expired refresh token");

      return res.status(401).json({
        success: false,
        messsage: `Invalide or expired refresh token`,
      });
    }

    const user = await User.findById(storeToken.user);

    if (!user) {
      logger.warn("user not found");

      return res.status(401).json({
        success: false,
        messsage: `user not found`,
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);

    await RefreshToken.deleteOne({ _id: storeToken._id });
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Refresh token error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal error",
    });
  }
};

//logout

const logoutUser = async (req, res) => {
  logger.info("Logout endpoint hit...");

  try {
    const { refreshToken } = eq.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    await RefreshToken.deleteOne({
      token: refreshToken,
    });
    logger.info("Refresh token deleted for logout");

    return res.status(401).json({
      success: true,
      messsage: `Logged out successfully`,
    });
  } catch (e) {
    logger.error("Error while logging out   ", e);
    res.status(500).json({
      success: false,
      message: "Internal error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshTokenUser,
  logoutUser
};
