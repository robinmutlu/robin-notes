import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Yetkilendirme gerekli' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Geçersiz token' });
    }
};

// Admin only middleware
export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Admin yetkisi gerekli' });
    }
};

// Can upload middleware
export const canUpload = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.canUpload)) {
        next();
    } else {
        res.status(403).json({ message: 'Yükleme izniniz yok' });
    }
};
