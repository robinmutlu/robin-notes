import mongoose from 'mongoose';
import crypto from 'crypto';

const emailVerificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create index on token for faster lookups
emailVerificationSchema.index({ token: 1 });

// Auto-delete expired tokens
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate verification token
emailVerificationSchema.statics.createVerification = async function (userId) {
    // Delete any existing verification for this user
    await this.deleteMany({ userId });

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');

    // Create verification record
    const verification = await this.create({
        userId,
        token
    });

    return token;
};

// Static method to verify token
emailVerificationSchema.statics.verifyToken = async function (token) {
    const verification = await this.findOne({
        token,
        expiresAt: { $gt: new Date() }
    });

    if (!verification) {
        return null;
    }

    return verification;
};

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);

export default EmailVerification;
