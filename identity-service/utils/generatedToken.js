const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const logger = require("./Logger");
const RefreshToken = require("../module/RefreshToken"); // ✅ import the model

const generateToken = async (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshTokenValue = crypto.randomBytes(40).toString("hex"); // ✅ renamed to avoid collision
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({         // ✅ call .create() on the Model, not the string
    token: refreshTokenValue,
    user: user._id,
    expiresAt,
  });

  return { accessToken, refreshToken: refreshTokenValue };
};

module.exports = generateToken;