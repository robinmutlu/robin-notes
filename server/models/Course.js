import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['note', 'flashcard', 'quiz', 'video'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    order: {
        type: Number,
        default: 0
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, {
    timestamps: true
});

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Başlık gerekli'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Açıklama gerekli'],
        trim: true
    },
    thumbnail: {
        type: String,
        default: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=250&fit=crop'
    },
    category: {
        type: String,
        required: [true, 'Kategori gerekli'],
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    contents: [contentSchema]
}, {
    timestamps: true
});

// Virtual for content count
courseSchema.virtual('contentCount').get(function () {
    return this.contents ? this.contents.length : 0;
});

// Ensure virtuals are included in JSON
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

export default mongoose.model('Course', courseSchema);
