const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true, // ✅ fixed typo
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',      // ✅ links to User model
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
});

// ✅ Fixed syntax + correct option name — auto deletes expired tokens from MongoDB!
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema); // ✅ fixed
module.exports = RefreshToken;