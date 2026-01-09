import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Allow images, videos, and documents
    const allowedMimes = [
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        // Videos
        'video/mp4',
        'video/webm',
        'video/ogg',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.log('Rejected file type:', file.mimetype);
        cb(new Error('Desteklenmeyen dosya türü: ' + file.mimetype), false);
    }
};

// Multer upload instance (no size limit for now - can add limit in production)
const upload = multer({
    storage,
    fileFilter
});

// Import document converter
import { isWordDocument, convertDocxToPdf } from '../services/documentConverter.js';
import { addWatermarkToPdf, isPdf } from '../services/pdfWatermark.js';

// @route   POST /api/uploads
// @desc    Upload a file
// @access  Private
router.post('/', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Dosya yüklenemedi' });
        }

        let fileUrl = `/uploads/${req.file.filename}`;
        let pdfUrl = null;
        let convertedToPdf = false;

        // If it's a Word document, convert to PDF
        if (isWordDocument(req.file.originalname)) {
            try {
                const pdfFilename = req.file.filename.replace(/\.(doc|docx)$/i, '.pdf');
                const outputPath = path.join(uploadsDir, pdfFilename);

                await convertDocxToPdf(req.file.path, outputPath);

                // Add watermark to converted PDF
                try {
                    await addWatermarkToPdf(outputPath);
                    console.log('Watermark added to converted PDF:', pdfFilename);
                } catch (wmError) {
                    console.error('Watermark failed:', wmError);
                }

                // Delete original DOCX file
                try {
                    fs.unlinkSync(req.file.path);
                    console.log('Deleted original DOCX:', req.file.filename);
                } catch (delError) {
                    console.error('Failed to delete DOCX:', delError);
                }

                pdfUrl = `/uploads/${pdfFilename}`;
                fileUrl = pdfUrl; // Use PDF URL as main URL
                convertedToPdf = true;
            } catch (convError) {
                console.error('PDF conversion failed:', convError);
                // Continue without PDF - Word file still uploaded
            }
        }

        // If it's a PDF, add watermark
        if (isPdf(req.file.originalname)) {
            try {
                await addWatermarkToPdf(req.file.path);
                console.log('Watermark added to PDF:', req.file.filename);
            } catch (wmError) {
                console.error('Watermark failed:', wmError);
            }
        }

        res.json({
            url: fileUrl,
            pdfUrl: pdfUrl,
            convertedToPdf: convertedToPdf,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Dosya yüklenirken hata oluştu' });
    }
});

// @route   POST /api/uploads/avatar
// @desc    Upload avatar
// @access  Private
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Dosya yüklenemedi' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        // Update user's avatar
        await User.findByIdAndUpdate(req.user._id, { avatar: fileUrl });

        res.json({
            url: fileUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ message: 'Avatar yüklenirken hata oluştu' });
    }
});

// @route   DELETE /api/uploads/:filename
// @desc    Delete a file
// @access  Private
router.delete('/:filename', protect, async (req, res) => {
    try {
        const filePath = path.join(uploadsDir, req.params.filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ message: 'Dosya silindi' });
        } else {
            res.status(404).json({ message: 'Dosya bulunamadı' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Dosya silinirken hata oluştu' });
    }
});

// @route   GET /api/uploads/download/:filename
// @desc    Download a file (forces download instead of opening)
// @access  Public
router.get('/download/:filename', (req, res) => {
    try {
        const filePath = path.join(uploadsDir, req.params.filename);

        if (fs.existsSync(filePath)) {
            const originalName = req.query.name || req.params.filename;
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.sendFile(filePath);
        } else {
            res.status(404).json({ message: 'Dosya bulunamadı' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Dosya indirilemedi' });
    }
});

export default router;

