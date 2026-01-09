import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import EmailVerification from '../models/EmailVerification.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı' });
        }

        // Check if first user (make admin)
        const userCount = await User.countDocuments();
        const isFirstUser = userCount === 0;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate avatar
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

        // Create user (unverified)
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: isFirstUser ? 'admin' : 'user',
            canUpload: isFirstUser,
            isVerified: isFirstUser, // First user is auto-verified
            avatar
        });

        // Send verification email for non-first users
        if (!isFirstUser) {
            try {
                const verificationToken = await EmailVerification.createVerification(user._id);
                await sendVerificationEmail(email, name, verificationToken);
            } catch (emailError) {
                console.error('Failed to send verification email:', emailError);
                // Continue even if email fails - user can request resend
            }
        }

        // If first user, return token for immediate login
        if (isFirstUser) {
            const token = generateToken(user._id);
            return res.status(201).json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    canUpload: user.canUpload,
                    isVerified: user.isVerified,
                    avatar: user.avatar,
                    createdAt: user.createdAt
                }
            });
        }

        // For other users, return success with verification required message
        res.status(201).json({
            message: 'Kayıt başarılı! E-posta adresinize gönderilen doğrulama linkine tıklayın.',
            requiresVerification: true
        });
    } catch (error) {
        console.error('Register error:', error.message);
        res.status(500).json({ message: 'Kayıt sırasında hata oluştu: ' + error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Geçersiz e-posta veya şifre' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Geçersiz e-posta veya şifre' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                message: 'E-posta adresiniz doğrulanmamış. Lütfen e-postanızı kontrol edin.',
                requiresVerification: true,
                email: user.email
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                canUpload: user.canUpload,
                isVerified: user.isVerified,
                avatar: user.avatar,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Giriş sırasında hata oluştu' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            canUpload: user.canUpload,
            avatar: user.avatar,
            createdAt: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcı bilgisi alınamadı' });
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change own password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate new password
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: 'Yeni şifre en az 8 karakter olmalı' });
        }

        if (!/[A-Z]/.test(newPassword)) {
            return res.status(400).json({ message: 'Yeni şifre en az 1 büyük harf içermeli' });
        }

        // Get user with password
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mevcut şifre yanlış' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await User.findByIdAndUpdate(req.user._id, { password: hashedPassword });

        res.json({ message: 'Şifre başarıyla güncellendi' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Şifre güncellenirken hata oluştu' });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'E-posta adresi gerekli' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        // Don't reveal if email exists for security
        if (!user) {
            return res.json({ message: 'E-posta adresinize şifre sıfırlama linki gönderildi' });
        }

        // Import dynamically to avoid circular dependencies
        const { default: PasswordReset } = await import('../models/PasswordReset.js');
        const { sendPasswordResetEmail } = await import('../services/emailService.js');

        // Generate token
        const resetToken = await PasswordReset.createToken(user._id);

        // Send email
        await sendPasswordResetEmail(user.email, user.name, resetToken);

        res.json({ message: 'E-posta adresinize şifre sıfırlama linki gönderildi' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: error.message || 'Şifre sıfırlama e-postası gönderilemedi' });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token ve yeni şifre gerekli' });
        }

        // Validate password
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Şifre en az 8 karakter olmalı' });
        }

        if (!/[A-Z]/.test(newPassword)) {
            return res.status(400).json({ message: 'Şifre en az 1 büyük harf içermeli' });
        }

        const { default: PasswordReset } = await import('../models/PasswordReset.js');

        // Verify token
        const resetToken = await PasswordReset.verifyToken(token);

        if (!resetToken) {
            return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await User.findByIdAndUpdate(resetToken.userId, { password: hashedPassword });

        // Mark token as used
        resetToken.used = true;
        await resetToken.save();

        res.json({ message: 'Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Şifre güncellenirken hata oluştu' });
    }
});

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Find verification record
        const verification = await EmailVerification.verifyToken(token);
        if (!verification) {
            return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş doğrulama linki' });
        }

        // Update user as verified
        const user = await User.findByIdAndUpdate(
            verification.userId,
            { isVerified: true },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Delete verification record
        await EmailVerification.deleteOne({ _id: verification._id });

        res.json({
            message: 'E-posta adresiniz başarıyla doğrulandı! Artık giriş yapabilirsiniz.',
            email: user.email
        });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ message: 'Doğrulama sırasında hata oluştu' });
    }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if user exists
            return res.json({ message: 'Eğer bu e-posta kayıtlıysa, doğrulama linki gönderildi.' });
        }

        // Check if already verified
        if (user.isVerified) {
            return res.status(400).json({ message: 'Bu e-posta zaten doğrulanmış.' });
        }

        // Create new verification token and send email
        const verificationToken = await EmailVerification.createVerification(user._id);
        await sendVerificationEmail(email, user.name, verificationToken);

        res.json({ message: 'Doğrulama linki e-posta adresinize gönderildi.' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: 'E-posta gönderilirken hata oluştu' });
    }
});

export default router;

