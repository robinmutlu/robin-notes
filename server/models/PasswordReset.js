import mongoose from 'mongoose';
import crypto from 'crypto';

const passwordResetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    used: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Generate a secure reset token
passwordResetSchema.statics.createToken = async function (userId) {
    // Delete any existing tokens for this user
    await this.deleteMany({ userId });

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.create({
        userId,
        token: hashedToken,
        expiresAt
    });

    return token; // Return unhashed token for email
};

// Verify token
passwordResetSchema.statics.verifyToken = async function (token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await this.findOne({
        token: hashedToken,
        expiresAt: { $gt: new Date() },
        used: false
    });

    return resetToken;
};

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

export default PasswordReset;
