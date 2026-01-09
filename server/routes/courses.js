import express from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { protect, canUpload } from '../middleware/auth.js';
import { deleteCourseFiles, deleteFile } from '../services/fileCleanup.js';

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all public courses
// @access  Public
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find({ isPublic: true }).sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Dersler alınamadı' });
    }
});

// @route   GET /api/courses/all
// @desc    Get all courses (admin only)
// @access  Private/Admin
router.get('/all', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin yetkisi gerekli' });
        }
        const courses = await Course.find().sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Dersler alınamadı' });
    }
});

// @route   GET /api/courses/my
// @desc    Get current user's courses
// @access  Private
router.get('/my', protect, async (req, res) => {
    try {
        const courses = await Course.find({ author: req.user._id }).sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Dersler alınamadı' });
    }
});

// @route   GET /api/courses/admin/stats
// @desc    Get course statistics (admin only)
// @access  Private/Admin
router.get('/admin/stats', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin yetkisi gerekli' });
        }

        const courses = await Course.find();
        const users = await User.find();

        let totalContents = 0;
        const contentsByType = {};

        courses.forEach(course => {
            course.contents.forEach(content => {
                totalContents++;
                contentsByType[content.type] = (contentsByType[content.type] || 0) + 1;
            });
        });

        res.json({
            totalUsers: users.length,
            totalCourses: courses.length,
            totalContents,
            contentsByType,
            publicCourses: courses.filter(c => c.isPublic).length,
            privateCourses: courses.filter(c => !c.isPublic).length
        });
    } catch (error) {
        res.status(500).json({ message: 'İstatistikler alınamadı' });
    }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Public (for public courses) / Private (for private)
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Ders bulunamadı' });
        }

        res.json(course);
    } catch (error) {
        res.status(500).json({ message: 'Ders alınamadı' });
    }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (canUpload)
router.post('/', protect, canUpload, async (req, res) => {
    try {
        const { title, description, thumbnail, category, isPublic } = req.body;

        const course = await Course.create({
            title,
            description,
            thumbnail,
            category,
            isPublic: isPublic !== false,
            author: req.user._id,
            authorName: req.user.name,
            contents: []
        });

        res.status(201).json(course);
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ message: 'Ders oluşturulamadı' });
    }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private (owner or admin)
router.put('/:id', protect, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Ders bulunamadı' });
        }

        // Check ownership
        if (course.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bu dersi düzenleme yetkiniz yok' });
        }

        const { title, description, thumbnail, category, isPublic } = req.body;

        if (title) course.title = title;
        if (description) course.description = description;
        if (thumbnail) course.thumbnail = thumbnail;
        if (category) course.category = category;
        if (typeof isPublic === 'boolean') course.isPublic = isPublic;

        await course.save();
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: 'Ders güncellenemedi' });
    }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private (owner or admin)
router.delete('/:id', protect, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Ders bulunamadı' });
        }

        // Check ownership
        if (course.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bu dersi silme yetkiniz yok' });
        }

        // Delete all associated files
        deleteCourseFiles(course);

        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Ders silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Ders silinemedi' });
    }
});

// @route   POST /api/courses/:id/contents
// @desc    Add content to a course
// @access  Private (owner)
router.post('/:id/contents', protect, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Ders bulunamadı' });
        }

        if (course.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'İçerik ekleme yetkiniz yok' });
        }

        const { type, title, data } = req.body;

        const newContent = {
            type,
            title,
            data,
            order: course.contents.length
        };

        course.contents.push(newContent);
        await course.save();

        res.status(201).json(course.contents[course.contents.length - 1]);
    } catch (error) {
        res.status(500).json({ message: 'İçerik eklenemedi' });
    }
});

// @route   PUT /api/courses/:id/contents/:contentId
// @desc    Update content in a course
// @access  Private (owner)
router.put('/:id/contents/:contentId', protect, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Ders bulunamadı' });
        }

        if (course.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'İçerik düzenleme yetkiniz yok' });
        }

        const content = course.contents.id(req.params.contentId);
        if (!content) {
            return res.status(404).json({ message: 'İçerik bulunamadı' });
        }

        const { title, data } = req.body;
        if (title) content.title = title;
        if (data) content.data = data;

        await course.save();
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: 'İçerik güncellenemedi' });
    }
});

// @route   DELETE /api/courses/:id/contents/:contentId
// @desc    Delete content from a course
// @access  Private (owner)
router.delete('/:id/contents/:contentId', protect, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Ders bulunamadı' });
        }

        if (course.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'İçerik silme yetkiniz yok' });
        }

        // Find content to delete and cleanup its files
        const contentToDelete = course.contents.find(
            c => c._id.toString() === req.params.contentId
        );
        if (contentToDelete && contentToDelete.data) {
            if (contentToDelete.data.fileUrl) deleteFile(contentToDelete.data.fileUrl);
            if (contentToDelete.data.url && contentToDelete.data.isUploaded) deleteFile(contentToDelete.data.url);
        }

        course.contents = course.contents.filter(
            c => c._id.toString() !== req.params.contentId
        );

        await course.save();
        res.json({ message: 'İçerik silindi' });
    } catch (error) {
        res.status(500).json({ message: 'İçerik silinemedi' });
    }
});

// @route   PUT /api/courses/:id/reorder
// @desc    Reorder contents
// @access  Private (owner)
router.put('/:id/reorder', protect, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Ders bulunamadı' });
        }

        if (course.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Sıralama değiştirme yetkiniz yok' });
        }

        const { contentIds } = req.body;

        // Create a map for quick lookup
        const contentMap = {};
        course.contents.forEach(c => { contentMap[c._id.toString()] = c; });

        // Reorder
        course.contents = contentIds.map((id, index) => {
            const content = contentMap[id];
            if (content) {
                content.order = index;
            }
            return content;
        }).filter(Boolean);

        await course.save();
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: 'Sıralama değiştirilemedi' });
    }
});

export default router;
