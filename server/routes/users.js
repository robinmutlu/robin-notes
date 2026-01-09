import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { deleteUserFiles, deleteCourseFiles } from '../services/fileCleanup.js';

const router = express.Router();

// ... existing code ...

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Delete user's avatar
        deleteUserFiles(user);

        // Find and delete user's courses and their files
        const courses = await Course.find({ author: req.params.id });
        courses.forEach(course => {
            deleteCourseFiles(course);
        });

        // Delete user's courses
        await Course.deleteMany({ author: req.params.id });

        // Delete user
        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'Kullanıcı silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcı silinemedi' });
    }
});
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcılar alınamadı' });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        // Users can only update themselves, admins can update anyone
        if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Yetkiniz yok' });
        }

        const { name, avatar } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (avatar) updateData.avatar = avatar;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcı güncellenemedi' });
    }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (admin only)
// @access  Private/Admin
router.put('/:id/role', protect, adminOnly, async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Geçersiz rol' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role, canUpload: role === 'admin' ? true : undefined },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Rol güncellenemedi' });
    }
});

// @route   PUT /api/users/:id/upload-permission
// @desc    Update user upload permission (admin only)
// @access  Private/Admin
router.put('/:id/upload-permission', protect, adminOnly, async (req, res) => {
    try {
        const { canUpload } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { canUpload },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'İzin güncellenemedi' });
    }
});



// @route   PUT /api/users/:id/reset-password
// @desc    Reset user password (admin only)
// @access  Private/Admin
router.put('/:id/reset-password', protect, adminOnly, async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Şifre en az 6 karakter olmalı' });
        }

        const bcrypt = await import('bcryptjs');
        const salt = await bcrypt.default.genSalt(10);
        const hashedPassword = await bcrypt.default.hash(newPassword, salt);

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { password: hashedPassword },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        res.json({ message: 'Şifre başarıyla güncellendi' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Şifre güncellenemedi' });
    }
});

export default router;
