const mongoose = require("mongoose");
const argon2 = require("argon2");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"], // ✅ email format validation
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
  },
  {
    timestamps: true, //  auto adds createdAt and updatedAt
  }
);

//  Hash password before saving
// ✅ Fix — remove next entirely, just use async/await
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await argon2.hash(this.password);
});

//  Method to verify password on login
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await argon2.verify(this.password, candidatePassword);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};




//  Hide password when sending user data as JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

userSchema.index({username:'text'})

const User = mongoose.model("User", userSchema);

module.exports = User;