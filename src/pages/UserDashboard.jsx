import { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../services/apiService';
import './UserDashboard.css';

export default function UserDashboard() {
    const { user, isAuthenticated, canUpload, updateProfile, getAvatarUrl, isLoading: authLoading } = useAuth();
    const { theme, toggleTheme, setSystemTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('courses');
    const [courses, setCourses] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showContentModal, setShowContentModal] = useState(false);
    const [showEditContentModal, setShowEditContentModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [selectedCourseForContent, setSelectedCourseForContent] = useState(null);
    const [editingContent, setEditingContent] = useState(null);
    const [profileForm, setProfileForm] = useState({ name: '', email: '' });
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [thumbnailUrl, setThumbnailUrl] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [contentType, setContentType] = useState('note');
    const [flashcards, setFlashcards] = useState([{ front: '', back: '' }]);
    const [quizQuestions, setQuizQuestions] = useState([{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [documentFile, setDocumentFile] = useState(null);
    const [documentUrl, setDocumentUrl] = useState(null);
    const [noteInputMode, setNoteInputMode] = useState('text'); // 'text' or 'file'
    const [uploadProgress, setUploadProgress] = useState(null); // { percent, speed, fileName }
    const [draggedItem, setDraggedItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const avatarInputRef = useRef(null);
    const documentInputRef = useRef(null);

    useEffect(() => {
        if (!authLoading && user) {
            loadCourses();
            setProfileForm({ name: user.name, email: user.email });
            setAvatarPreview(getAvatarUrl());
        }
    }, [user, authLoading]);

    const loadCourses = async () => {
        try {
            const data = await api.getMyCourses();
            setCourses(data);
        } catch (error) {
            console.error('Failed to load courses:', error);
        }
        setIsLoading(false);
    };

    if (authLoading) {
        return (
            <div className="loading-state" style={{ minHeight: '100vh' }}>
                <div className="loading-spinner"></div>
                <p>Oturum kontrol ediliyor...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const refreshCourses = async () => {
        const data = await api.getMyCourses();
        setCourses(data);
    };

    const handleThumbnailChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const result = await api.uploadFile(file);
                setThumbnailUrl(result.url);
                setThumbnailPreview(api.getFileUrl(result.url));
            } catch (error) {
                alert('Görsel yüklenemedi: ' + error.message);
            }
        }
    };

    const handleVideoChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                setUploadProgress({ percent: 0, speed: '0 KB/s', fileName: file.name });
                const result = await api.uploadFileWithProgress(file, (progress) => {
                    setUploadProgress(progress);
                });
                setVideoUrl(result.url);
                setVideoPreview(api.getFileUrl(result.url));
                setUploadProgress(null);
            } catch (error) {
                setUploadProgress(null);
                alert('Video yüklenemedi: ' + error.message);
            }
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const result = await api.uploadAvatar(file);
                setAvatarPreview(api.getFileUrl(result.url));
                await updateProfile({ avatar: result.url });
            } catch (error) {
                alert('Avatar yüklenemedi: ' + error.message);
            }
        }
    };

    const handleDocumentChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const ext = file.name.split('.').pop().toLowerCase();
            if (!['pdf', 'doc', 'docx'].includes(ext)) {
                alert('Sadece PDF ve Word dosyaları desteklenir!');
                return;
            }
            try {
                setUploadProgress({ percent: 0, speed: '0 KB/s', fileName: file.name });
                const result = await api.uploadFileWithProgress(file, (progress) => {
                    setUploadProgress(progress);
                });

                // Use PDF URL for Word docs if conversion was successful
                const finalUrl = result.pdfUrl || result.url;
                const finalType = result.pdfUrl ? 'pdf' : ext;
                const finalName = result.convertedToPdf ? file.name.replace(/\.(doc|docx)$/i, '.pdf') : file.name;

                setDocumentUrl(finalUrl);
                setDocumentFile({
                    name: finalName,
                    type: finalType,
                    originalType: ext,
                    convertedToPdf: result.convertedToPdf
                });
                setUploadProgress(null);
            } catch (error) {
                setUploadProgress(null);
                alert('Dosya yüklenemedi: ' + error.message);
            }
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        const form = e.target;

        const courseData = {
            title: form.title.value,
            description: form.description.value,
            category: form.category.value,
            thumbnail: thumbnailUrl || form.thumbnail.value || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=250&fit=crop',
            isPublic: form.isPublic.checked
        };

        try {
            if (editingCourse) {
                await api.updateCourse(editingCourse._id || editingCourse.id, courseData);
            } else {
                await api.createCourse(courseData);
            }

            setShowCreateModal(false);
            setEditingCourse(null);
            setThumbnailPreview(null);
            setThumbnailUrl(null);
            await refreshCourses();
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    };

    const handleDeleteCourse = async (id) => {
        if (confirm('Bu ders paketini silmek istediğinize emin misiniz?')) {
            try {
                await api.deleteCourse(id);
                await refreshCourses();
            } catch (error) {
                alert('Hata: ' + error.message);
            }
        }
    };

    const addFlashcard = () => {
        setFlashcards([...flashcards, { front: '', back: '' }]);
    };

    const removeFlashcard = (index) => {
        if (flashcards.length > 1) {
            setFlashcards(flashcards.filter((_, i) => i !== index));
        }
    };

    const updateFlashcard = (index, field, value) => {
        const updated = [...flashcards];
        updated[index][field] = value;
        setFlashcards(updated);
    };

    const addQuizQuestion = () => {
        setQuizQuestions([...quizQuestions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
    };

    const removeQuizQuestion = (index) => {
        if (quizQuestions.length > 1) {
            setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
        }
    };

    const updateQuizQuestion = (index, field, value) => {
        const updated = [...quizQuestions];
        if (field === 'question') {
            updated[index].question = value;
        } else if (field.startsWith('option')) {
            const optIndex = parseInt(field.replace('option', ''));
            updated[index].options[optIndex] = value;
        } else if (field === 'correct') {
            updated[index].correctAnswer = parseInt(value);
        }
        setQuizQuestions(updated);
    };

    const handleAddContent = async (e) => {
        e.preventDefault();
        const form = e.target;
        const type = contentType;

        let data = {};
        let title = form.contentTitle.value;

        if (type === 'note') {
            if (noteInputMode === 'file' && documentUrl) {
                data = {
                    fileUrl: documentUrl,
                    fileName: documentFile?.name,
                    fileType: documentFile?.type,
                    isDocument: true
                };
            } else {
                data = { content: form.content?.value || '' };
            }
        } else if (type === 'flashcard') {
            const validCards = flashcards.filter(c => c.front && c.back);
            if (validCards.length === 0) {
                alert('En az bir geçerli kart ekleyin!');
                return;
            }
            data = { cards: validCards.map((c, i) => ({ id: `fc_${Date.now()}_${i}`, ...c })) };
        } else if (type === 'quiz') {
            const validQuestions = quizQuestions.filter(q => q.question && q.options.every(o => o));
            if (validQuestions.length === 0) {
                alert('En az bir geçerli soru ekleyin!');
                return;
            }
            data = { questions: validQuestions.map((q, i) => ({ id: `q_${Date.now()}_${i}`, ...q })) };
        } else if (type === 'video') {
            const youtubeUrl = form.videoUrl?.value;
            if (videoUrl) {
                data = { url: videoUrl, isUploaded: true, description: form.videoDesc?.value || '' };
            } else if (youtubeUrl) {
                data = { url: youtubeUrl, isUploaded: false, description: form.videoDesc?.value || '' };
            } else {
                alert('Video URL\'si girin veya dosya yükleyin!');
                return;
            }
        }

        try {
            await api.addContent(selectedCourseForContent._id || selectedCourseForContent.id, { type, title, data });
            resetContentForm();
            setShowContentModal(false);
            setSelectedCourseForContent(null);
            await refreshCourses();
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    };

    const resetContentForm = () => {
        setContentType('note');
        setNoteInputMode('text');
        setFlashcards([{ front: '', back: '' }]);
        setQuizQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
        setVideoFile(null);
        setVideoPreview(null);
        setVideoUrl(null);
        setDocumentFile(null);
        setDocumentUrl(null);
    };

    const openEditContent = (course, content) => {
        setSelectedCourseForContent(course);
        setEditingContent(content);
        setContentType(content.type);

        if (content.type === 'flashcard') {
            setFlashcards(content.data.cards || [{ front: '', back: '' }]);
        } else if (content.type === 'quiz') {
            setQuizQuestions(content.data.questions || [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
        } else if (content.type === 'video' && content.data.isUploaded) {
            setVideoPreview(api.getFileUrl(content.data.url));
        }

        setShowEditContentModal(true);
    };

    const handleEditContent = async (e) => {
        e.preventDefault();
        const form = e.target;

        let data = { ...editingContent.data };
        let title = form.contentTitle.value;

        if (contentType === 'note') {
            data = { content: form.content.value };
        } else if (contentType === 'flashcard') {
            const validCards = flashcards.filter(c => c.front && c.back);
            data = { cards: validCards.map((c, i) => ({ id: c.id || `fc_${Date.now()}_${i}`, ...c })) };
        } else if (contentType === 'quiz') {
            const validQuestions = quizQuestions.filter(q => q.question && q.options.every(o => o));
            data = { questions: validQuestions.map((q, i) => ({ id: q.id || `q_${Date.now()}_${i}`, ...q })) };
        } else if (contentType === 'video') {
            const youtubeUrl = form.videoUrl?.value;
            if (videoUrl) {
                data = { url: videoUrl, isUploaded: true, description: form.videoDesc?.value || '' };
            } else if (youtubeUrl) {
                data = { url: youtubeUrl, isUploaded: false, description: form.videoDesc?.value || '' };
            }
        }

        try {
            await api.updateContent(
                selectedCourseForContent._id || selectedCourseForContent.id,
                editingContent._id || editingContent.id,
                { title, data }
            );
            resetContentForm();
            setShowEditContentModal(false);
            setEditingContent(null);
            setSelectedCourseForContent(null);
            await refreshCourses();
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    };

    const handleDeleteContent = async (courseId, contentId) => {
        if (confirm('Bu içeriği silmek istediğinize emin misiniz?')) {
            try {
                await api.deleteContent(courseId, contentId);
                await refreshCourses();
            } catch (error) {
                alert('Hata: ' + error.message);
            }
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        await updateProfile(profileForm);
    };

    const openCourseModal = (course = null) => {
        setEditingCourse(course);
        if (course) {
            setThumbnailPreview(api.getFileUrl(course.thumbnail));
            setThumbnailUrl(course.thumbnail);
        } else {
            setThumbnailPreview(null);
            setThumbnailUrl(null);
        }
        setShowCreateModal(true);
    };

    // Drag and drop handlers
    const handleDragStart = (e, content, course) => {
        setDraggedItem({ content, course });
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
        setDraggedItem(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = async (e, targetContent, targetCourse) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        const courseId = targetCourse._id || targetCourse.id;
        if (!draggedItem || (draggedItem.course._id || draggedItem.course.id) !== courseId) return;

        const draggedId = draggedItem.content._id || draggedItem.content.id;
        const targetId = targetContent._id || targetContent.id;
        if (draggedId === targetId) return;

        const contents = [...targetCourse.contents];
        const draggedIndex = contents.findIndex(c => (c._id || c.id) === draggedId);
        const targetIndex = contents.findIndex(c => (c._id || c.id) === targetId);

        const [removed] = contents.splice(draggedIndex, 1);
        contents.splice(targetIndex, 0, removed);

        const contentIds = contents.map(c => c._id || c.id);

        try {
            await api.reorderContents(courseId, contentIds);
            await refreshCourses();
        } catch (error) {
            console.error('Reorder failed:', error);
        }
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-container">
                <aside className="dashboard-sidebar">
                    <div className="sidebar-user">
                        <div className="avatar-upload-wrapper" onClick={() => avatarInputRef.current?.click()}>
                            <img src={avatarPreview || getAvatarUrl()} alt={user?.name} className="user-avatar-lg" />
                            <div className="avatar-upload-overlay">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                            </div>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <h2>{user?.name}</h2>
                        <div className="user-badges">
                            <span className="badge badge-primary">{user?.role === 'admin' ? 'Admin' : 'Kullanıcı'}</span>
                            {canUpload && user?.role !== 'admin' && (
                                <span className="badge badge-success">Upload İzni</span>
                            )}
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <button
                            className={`nav-btn ${activeTab === 'courses' ? 'active' : ''}`}
                            onClick={() => setActiveTab('courses')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                            Ders Paketlerim
                        </button>
                        <button
                            className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            Profil
                        </button>
                        <button
                            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            Ayarlar
                        </button>
                    </nav>
                </aside>

                <main className="dashboard-main">
                    {activeTab === 'courses' && (
                        <div className="tab-content animate-fade-in">
                            <div className="content-header">
                                <h1>Ders Paketlerim</h1>
                                {canUpload ? (
                                    <button className="btn btn-primary" onClick={() => openCourseModal()}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        Yeni Paket
                                    </button>
                                ) : (
                                    <div className="no-permission-badge">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        Yükleme izniniz yok
                                    </div>
                                )}
                            </div>

                            {isLoading ? (
                                <div className="loading-state">
                                    <div className="loading-spinner"></div>
                                    <p>Yükleniyor...</p>
                                </div>
                            ) : courses.length > 0 ? (
                                <div className="courses-list">
                                    {courses.map(course => (
                                        <CourseItem
                                            key={course._id || course.id}
                                            course={course}
                                            onEdit={() => openCourseModal(course)}
                                            onDelete={() => handleDeleteCourse(course._id || course.id)}
                                            onAddContent={() => {
                                                setSelectedCourseForContent(course);
                                                resetContentForm();
                                                setShowContentModal(true);
                                            }}
                                            onEditContent={(content) => openEditContent(course, content)}
                                            onDeleteContent={(contentId) => handleDeleteContent(course._id || course.id, contentId)}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">📚</div>
                                    <h3>Henüz ders paketiniz yok</h3>
                                    <p>
                                        {canUpload
                                            ? 'İlk ders paketinizi oluşturun ve içerik eklemeye başlayın.'
                                            : 'Ders paketi oluşturmak için admin\'den izin almanız gerekiyor.'}
                                    </p>
                                    {canUpload && (
                                        <button className="btn btn-primary" onClick={() => openCourseModal()}>
                                            İlk Paketimi Oluştur
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="tab-content animate-fade-in">
                            <div className="content-header">
                                <h1>Profil Bilgileri</h1>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="profile-form card">
                                <div className="form-group">
                                    <label>Profil Fotoğrafı</label>
                                    <div className="avatar-edit-area">
                                        <img src={avatarPreview || getAvatarUrl()} alt="Avatar" className="avatar-preview" />
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => avatarInputRef.current?.click()}>
                                            Fotoğraf Değiştir
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Ad Soyad</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={profileForm.name}
                                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>E-posta</label>
                                    <input
                                        type="email"
                                        className="input"
                                        value={profileForm.email}
                                        disabled
                                    />
                                    <small>E-posta değiştirilemez.</small>
                                </div>
                                <button type="submit" className="btn btn-primary">Kaydet</button>
                            </form>

                            <PasswordChangeSection />
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="tab-content animate-fade-in">
                            <div className="content-header">
                                <h1>Ayarlar</h1>
                            </div>

                            <div className="settings-card card">
                                <h3>Tema Tercihi</h3>
                                <p>Uygulama temasını tercihlerinize göre ayarlayın.</p>

                                <div className="theme-options">
                                    <button
                                        className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                                        onClick={() => toggleTheme()}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="5" />
                                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                        </svg>
                                        Açık Tema
                                    </button>
                                    <button
                                        className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                                        onClick={() => toggleTheme()}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                        </svg>
                                        Koyu Tema
                                    </button>
                                    <button
                                        className="theme-option"
                                        onClick={() => setSystemTheme()}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="3" width="20" height="14" rx="2" />
                                            <line x1="8" y1="21" x2="16" y2="21" />
                                            <line x1="12" y1="17" x2="12" y2="21" />
                                        </svg>
                                        Sistem Teması
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Modals (simplified - keeping the same structure) */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingCourse(null); setThumbnailPreview(null); }}>
                    <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCourse ? 'Paketi Düzenle' : 'Yeni Ders Paketi'}</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => { setShowCreateModal(false); setEditingCourse(null); }}>×</button>
                        </div>
                        <form onSubmit={handleCreateCourse} className="modal-form">
                            <div className="form-group">
                                <label>Başlık</label>
                                <input type="text" name="title" className="input" defaultValue={editingCourse?.title} required />
                            </div>
                            <div className="form-group">
                                <label>Açıklama</label>
                                <textarea name="description" className="input" rows="3" defaultValue={editingCourse?.description} required />
                            </div>
                            <div className="form-group">
                                <label>Kategori</label>
                                <input type="text" name="category" className="input" defaultValue={editingCourse?.category} placeholder="örn: Matematik, Yazılım" required />
                            </div>

                            <div className="form-group">
                                <label>Kapak Görseli</label>
                                <div className="upload-area">
                                    {thumbnailPreview ? (
                                        <div className="upload-preview">
                                            <img src={thumbnailPreview} alt="Önizleme" />
                                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setThumbnailPreview(null); setThumbnailUrl(null); }}>Kaldır</button>
                                        </div>
                                    ) : (
                                        <div className="upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                            <span>Görsel yüklemek için tıklayın</span>
                                        </div>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleThumbnailChange} style={{ display: 'none' }} />
                                </div>
                                <input type="hidden" name="thumbnail" value={thumbnailUrl || editingCourse?.thumbnail || ''} />
                            </div>

                            <div className="form-group checkbox-group">
                                <label>
                                    <input type="checkbox" name="isPublic" defaultChecked={editingCourse?.isPublic ?? true} />
                                    Herkese açık
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreateModal(false); setEditingCourse(null); }}>İptal</button>
                                <button type="submit" className="btn btn-primary">{editingCourse ? 'Kaydet' : 'Oluştur'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showContentModal && (
                <div className="modal-overlay" onClick={() => { setShowContentModal(false); resetContentForm(); }}>
                    <div className="modal modal-lg animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>İçerik Ekle: {selectedCourseForContent?.title}</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => { setShowContentModal(false); resetContentForm(); }}>×</button>
                        </div>
                        <form onSubmit={handleAddContent} className="modal-form">
                            <div className="form-group">
                                <label>İçerik Türü</label>
                                <select name="type" className="input" value={contentType} onChange={(e) => setContentType(e.target.value)}>
                                    <option value="note">📝 Ders Notu</option>
                                    <option value="flashcard">🎴 Bilgi Kartları</option>
                                    <option value="quiz">❓ Test Soruları</option>
                                    <option value="video">🎬 Video</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Başlık</label>
                                <input type="text" name="contentTitle" className="input" required />
                            </div>

                            {contentType === 'note' && (
                                <div className="form-group">
                                    <label>Giriş Yöntemi</label>
                                    <div className="input-mode-toggle">
                                        <button
                                            type="button"
                                            className={`mode-btn ${noteInputMode === 'text' ? 'active' : ''}`}
                                            onClick={() => setNoteInputMode('text')}
                                        >
                                            ✏️ Metin Yaz
                                        </button>
                                        <button
                                            type="button"
                                            className={`mode-btn ${noteInputMode === 'file' ? 'active' : ''}`}
                                            onClick={() => setNoteInputMode('file')}
                                        >
                                            📄 Dosya Yükle
                                        </button>
                                    </div>

                                    {noteInputMode === 'text' ? (
                                        <>
                                            <label style={{ marginTop: '16px' }}>İçerik (Markdown destekli)</label>
                                            <textarea name="content" className="input" rows="8" />
                                        </>
                                    ) : (
                                        <>
                                            <label style={{ marginTop: '16px' }}>PDF veya Word Dosyası</label>
                                            <div className="upload-area">
                                                {uploadProgress ? (
                                                    <div className="upload-progress">
                                                        <div className="upload-progress-info">
                                                            <span className="upload-filename">{uploadProgress.fileName}</span>
                                                            <span className="upload-speed">{uploadProgress.speed}</span>
                                                        </div>
                                                        <div className="upload-progress-bar">
                                                            <div
                                                                className="upload-progress-fill"
                                                                style={{ width: `${uploadProgress.percent}%` }}
                                                            />
                                                        </div>
                                                        <span className="upload-percent">{uploadProgress.percent}%</span>
                                                    </div>
                                                ) : documentFile ? (
                                                    <div className="upload-preview">
                                                        <div className="file-preview">
                                                            <span className="file-icon">
                                                                {documentFile.type === 'pdf' ? '📕' : '📘'}
                                                            </span>
                                                            <span className="file-name">{documentFile.name}</span>
                                                        </div>
                                                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setDocumentFile(null); setDocumentUrl(null); }}>Kaldır</button>
                                                    </div>
                                                ) : (
                                                    <div className="upload-placeholder" onClick={() => documentInputRef.current?.click()}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                            <line x1="12" y1="18" x2="12" y2="12" />
                                                            <line x1="9" y1="15" x2="15" y2="15" />
                                                        </svg>
                                                        <span>PDF veya Word dosyası yükleyin</span>
                                                        <small>.pdf, .doc, .docx</small>
                                                    </div>
                                                )}
                                                <input
                                                    ref={documentInputRef}
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                    onChange={handleDocumentChange}
                                                    style={{ display: 'none' }}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {contentType === 'flashcard' && (
                                <div className="form-group">
                                    <label>Kartlar</label>
                                    <div className="dynamic-list">
                                        {flashcards.map((card, index) => (
                                            <div key={index} className="dynamic-item">
                                                <div className="dynamic-item-header">
                                                    <span>Kart {index + 1}</span>
                                                    {flashcards.length > 1 && <button type="button" className="btn-remove" onClick={() => removeFlashcard(index)}>×</button>}
                                                </div>
                                                <input type="text" className="input" placeholder="Ön yüz" value={card.front} onChange={(e) => updateFlashcard(index, 'front', e.target.value)} />
                                                <input type="text" className="input" placeholder="Arka yüz" value={card.back} onChange={(e) => updateFlashcard(index, 'back', e.target.value)} />
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={addFlashcard}>+ Kart Ekle</button>
                                    </div>
                                </div>
                            )}

                            {contentType === 'quiz' && (
                                <div className="form-group">
                                    <label>Sorular</label>
                                    <div className="dynamic-list">
                                        {quizQuestions.map((q, index) => (
                                            <div key={index} className="dynamic-item quiz-item">
                                                <div className="dynamic-item-header">
                                                    <span>Soru {index + 1}</span>
                                                    {quizQuestions.length > 1 && <button type="button" className="btn-remove" onClick={() => removeQuizQuestion(index)}>×</button>}
                                                </div>
                                                <input type="text" className="input" placeholder="Soru" value={q.question} onChange={(e) => updateQuizQuestion(index, 'question', e.target.value)} />
                                                <div className="quiz-options">
                                                    {q.options.map((opt, optIndex) => (
                                                        <div key={optIndex} className="quiz-option">
                                                            <input type="radio" name={`correct_${index}`} checked={q.correctAnswer === optIndex} onChange={() => updateQuizQuestion(index, 'correct', optIndex)} />
                                                            <input type="text" className="input" placeholder={`${String.fromCharCode(65 + optIndex)} şıkkı`} value={opt} onChange={(e) => updateQuizQuestion(index, `option${optIndex}`, e.target.value)} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={addQuizQuestion}>+ Soru Ekle</button>
                                    </div>
                                </div>
                            )}

                            {contentType === 'video' && (
                                <>
                                    <div className="form-group">
                                        <label>Video Yükle</label>
                                        <div className="upload-area">
                                            {uploadProgress && contentType === 'video' ? (
                                                <div className="upload-progress">
                                                    <div className="upload-progress-info">
                                                        <span className="upload-filename">{uploadProgress.fileName}</span>
                                                        <span className="upload-speed">{uploadProgress.speed}</span>
                                                    </div>
                                                    <div className="upload-progress-bar">
                                                        <div
                                                            className="upload-progress-fill"
                                                            style={{ width: `${uploadProgress.percent}%` }}
                                                        />
                                                    </div>
                                                    <span className="upload-percent">{uploadProgress.percent}%</span>
                                                </div>
                                            ) : videoPreview ? (
                                                <div className="upload-preview video-preview">
                                                    <video src={videoPreview} controls style={{ maxWidth: '100%', maxHeight: '200px' }} />
                                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setVideoUrl(null); setVideoPreview(null); }}>Kaldır</button>
                                                </div>
                                            ) : (
                                                <div className="upload-placeholder" onClick={() => videoInputRef.current?.click()}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                                                        <polygon points="23 7 16 12 23 17 23 7" />
                                                        <rect x="1" y="5" width="15" height="14" rx="2" />
                                                    </svg>
                                                    <span>Video yüklemek için tıklayın</span>
                                                </div>
                                            )}
                                            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoChange} style={{ display: 'none' }} />
                                        </div>
                                    </div>
                                    <div className="form-divider">veya</div>
                                    <div className="form-group">
                                        <label>YouTube URL</label>
                                        <input type="url" name="videoUrl" className="input" placeholder="https://youtube.com/watch?v=..." disabled={!!videoUrl} />
                                    </div>
                                    <div className="form-group">
                                        <label>Açıklama (opsiyonel)</label>
                                        <textarea name="videoDesc" className="input" rows="2" />
                                    </div>
                                </>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowContentModal(false); resetContentForm(); }}>İptal</button>
                                <button type="submit" className="btn btn-primary">Ekle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditContentModal && editingContent && (
                <div className="modal-overlay" onClick={() => { setShowEditContentModal(false); setEditingContent(null); resetContentForm(); }}>
                    <div className="modal modal-lg animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>İçeriği Düzenle</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => { setShowEditContentModal(false); setEditingContent(null); resetContentForm(); }}>×</button>
                        </div>
                        <form onSubmit={handleEditContent} className="modal-form">
                            <div className="form-group">
                                <label>Başlık</label>
                                <input type="text" name="contentTitle" className="input" defaultValue={editingContent.title} required />
                            </div>

                            {contentType === 'note' && (
                                <div className="form-group">
                                    <label>İçerik</label>
                                    <textarea name="content" className="input" rows="8" defaultValue={editingContent.data?.content} required />
                                </div>
                            )}

                            {contentType === 'flashcard' && (
                                <div className="form-group">
                                    <label>Kartlar</label>
                                    <div className="dynamic-list">
                                        {flashcards.map((card, index) => (
                                            <div key={index} className="dynamic-item">
                                                <div className="dynamic-item-header">
                                                    <span>Kart {index + 1}</span>
                                                    {flashcards.length > 1 && <button type="button" className="btn-remove" onClick={() => removeFlashcard(index)}>×</button>}
                                                </div>
                                                <input type="text" className="input" placeholder="Ön yüz" value={card.front} onChange={(e) => updateFlashcard(index, 'front', e.target.value)} />
                                                <input type="text" className="input" placeholder="Arka yüz" value={card.back} onChange={(e) => updateFlashcard(index, 'back', e.target.value)} />
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={addFlashcard}>+ Kart Ekle</button>
                                    </div>
                                </div>
                            )}

                            {contentType === 'quiz' && (
                                <div className="form-group">
                                    <label>Sorular</label>
                                    <div className="dynamic-list">
                                        {quizQuestions.map((q, index) => (
                                            <div key={index} className="dynamic-item quiz-item">
                                                <div className="dynamic-item-header">
                                                    <span>Soru {index + 1}</span>
                                                    {quizQuestions.length > 1 && <button type="button" className="btn-remove" onClick={() => removeQuizQuestion(index)}>×</button>}
                                                </div>
                                                <input type="text" className="input" placeholder="Soru" value={q.question} onChange={(e) => updateQuizQuestion(index, 'question', e.target.value)} />
                                                <div className="quiz-options">
                                                    {q.options.map((opt, optIndex) => (
                                                        <div key={optIndex} className="quiz-option">
                                                            <input type="radio" name={`edit_correct_${index}`} checked={q.correctAnswer === optIndex} onChange={() => updateQuizQuestion(index, 'correct', optIndex)} />
                                                            <input type="text" className="input" placeholder={`${String.fromCharCode(65 + optIndex)} şıkkı`} value={opt} onChange={(e) => updateQuizQuestion(index, `option${optIndex}`, e.target.value)} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={addQuizQuestion}>+ Soru Ekle</button>
                                    </div>
                                </div>
                            )}

                            {contentType === 'video' && (
                                <>
                                    <div className="form-group">
                                        <label>YouTube URL</label>
                                        <input type="url" name="videoUrl" className="input" defaultValue={!editingContent.data?.isUploaded ? editingContent.data?.url : ''} />
                                    </div>
                                    <div className="form-group">
                                        <label>Açıklama</label>
                                        <textarea name="videoDesc" className="input" rows="2" defaultValue={editingContent.data?.description} />
                                    </div>
                                </>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowEditContentModal(false); setEditingContent(null); resetContentForm(); }}>İptal</button>
                                <button type="submit" className="btn btn-primary">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Password Change Section Component
function PasswordChangeSection() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const passwordValidation = {
        minLength: newPassword.length >= 8,
        hasUpperCase: /[A-Z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword)
    };

    const isPasswordValid = passwordValidation.minLength && passwordValidation.hasUpperCase;

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!isPasswordValid) {
            setError('Yeni şifre gereksinimleri karşılamıyor');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Yeni şifreler eşleşmiyor');
            return;
        }

        setLoading(true);
        try {
            await api.changeMyPassword(currentPassword, newPassword);
            setSuccess('Şifreniz başarıyla güncellendi!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-card card" style={{ marginTop: '24px' }}>
            <h3>🔒 Şifre Değiştir</h3>
            <p>Hesap güvenliğiniz için şifrenizi düzenli olarak değiştirin.</p>

            {error && (
                <div className="alert alert-error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {success}
                </div>
            )}

            <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-group">
                    <label>Mevcut Şifre</label>
                    <input
                        type="password"
                        className="input"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Yeni Şifre</label>
                    <input
                        type="password"
                        className="input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="En az 8 karakter, 1 büyük harf"
                        required
                    />
                    {newPassword && (
                        <div className="password-requirements" style={{ marginTop: '8px' }}>
                            <div className={`requirement ${passwordValidation.minLength ? 'valid' : ''}`}>
                                <span className="indicator">{passwordValidation.minLength ? '✓' : '○'}</span>
                                En az 8 karakter
                            </div>
                            <div className={`requirement ${passwordValidation.hasUpperCase ? 'valid' : ''}`}>
                                <span className="indicator">{passwordValidation.hasUpperCase ? '✓' : '○'}</span>
                                En az 1 büyük harf
                            </div>
                            <div className={`requirement ${passwordValidation.hasNumber ? 'valid' : ''}`}>
                                <span className="indicator">{passwordValidation.hasNumber ? '✓' : '○'}</span>
                                En az 1 rakam (önerilen)
                            </div>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>Yeni Şifre (Tekrar)</label>
                    <input
                        type="password"
                        className={`input ${confirmPassword && (newPassword === confirmPassword ? 'input-valid' : 'input-error')}`}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                        <span className="field-error">Şifreler eşleşmiyor</span>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !isPasswordValid || !currentPassword}
                >
                    {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
            </form>
        </div>
    );
}

function CourseItem({ course, onEdit, onDelete, onAddContent, onEditContent, onDeleteContent, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop }) {
    const thumbnailSrc = api.getFileUrl(course.thumbnail);
    const sortedContents = [...(course.contents || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
        <div className="course-item">
            <img src={thumbnailSrc} alt={course.title} className="course-thumb-sm" />
            <div className="course-info">
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="course-stats">
                    <span>{course.contents?.length || 0} içerik</span>
                    <span className={`badge ${course.isPublic ? 'badge-success' : ''}`}>
                        {course.isPublic ? 'Herkese Açık' : 'Özel'}
                    </span>
                </div>

                {sortedContents.length > 0 && (
                    <div className="course-contents-mini">
                        {sortedContents.map((content, index) => (
                            <div
                                key={content._id || content.id}
                                className="content-mini-item"
                                draggable
                                onDragStart={(e) => onDragStart(e, content, course)}
                                onDragEnd={onDragEnd}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={(e) => onDrop(e, content, course)}
                            >
                                <span className="drag-handle">⋮⋮</span>
                                <span className="content-order-num">{index + 1}</span>
                                <span className="content-type-icon">
                                    {content.type === 'note' && '📝'}
                                    {content.type === 'flashcard' && '🎴'}
                                    {content.type === 'quiz' && '❓'}
                                    {content.type === 'video' && '🎬'}
                                </span>
                                <span className="content-mini-title">{content.title}</span>
                                <div className="content-mini-actions">
                                    <button className="btn-mini" onClick={() => onEditContent(content)} title="Düzenle">✏️</button>
                                    <button className="btn-mini btn-mini-danger" onClick={() => onDeleteContent(content._id || content.id)} title="Sil">🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="course-actions">
                <Link to={`/course/${course._id || course.id}`} className="btn btn-view btn-sm">Görüntüle</Link>
                <button className="btn btn-add btn-sm" onClick={onAddContent}>İçerik Ekle</button>
                <button className="btn btn-edit btn-sm" onClick={onEdit}>Düzenle</button>
                <button className="btn btn-delete btn-sm" onClick={onDelete}>Sil</button>
            </div>
        </div>
    );
}
