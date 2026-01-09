import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../services/apiService';
import NoteViewer from '../components/viewers/NoteViewer';
import FlashcardViewer from '../components/viewers/FlashcardViewer';
import QuizViewer from '../components/viewers/QuizViewer';
import VideoViewer from '../components/viewers/VideoViewer';
import './CoursePage.css';

export default function CoursePage() {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [selectedContent, setSelectedContent] = useState(null);
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);

    useEffect(() => {
        const loadCourse = async () => {
            try {
                const courseData = await api.getCourseById(id);
                setCourse(courseData);

                if (courseData?.contents?.length > 0) {
                    const sortedContents = [...courseData.contents].sort((a, b) => (a.order || 0) - (b.order || 0));
                    setSelectedContent(sortedContents[0]);
                }
            } catch (error) {
                console.error('Failed to load course:', error);
            }
        };
        loadCourse();
    }, [id]);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            const newWidth = e.clientX;
            if (newWidth >= 250 && newWidth <= 500) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const getContentIcon = (type) => {
        const icons = {
            note: '📝',
            flashcard: '🎴',
            quiz: '❓',
            video: '🎬'
        };
        return icons[type] || '📄';
    };

    const getContentLabel = (type) => {
        const labels = {
            note: 'Ders Notu',
            flashcard: 'Bilgi Kartı',
            quiz: 'Test',
            video: 'Video'
        };
        return labels[type] || 'İçerik';
    };

    const renderViewer = () => {
        if (!selectedContent) return null;

        switch (selectedContent.type) {
            case 'note':
                return <NoteViewer content={selectedContent} />;
            case 'flashcard':
                return <FlashcardViewer content={selectedContent} />;
            case 'quiz':
                return <QuizViewer content={selectedContent} />;
            case 'video':
                return <VideoViewer content={selectedContent} />;
            default:
                return <div className="no-viewer">Bu içerik türü desteklenmiyor.</div>;
        }
    };

    const getNeighbors = () => {
        if (!selectedContent || !course?.contents) return { prev: null, next: null };
        const sorted = [...course.contents].sort((a, b) => (a.order || 0) - (b.order || 0));
        const index = sorted.findIndex(c => (c._id || c.id) === (selectedContent._id || selectedContent.id));
        return {
            prev: index > 0 ? sorted[index - 1] : null,
            next: index < sorted.length - 1 ? sorted[index + 1] : null
        };
    };

    const navigateContent = (direction) => {
        const { prev, next } = getNeighbors();
        if (direction === 'prev' && prev) setSelectedContent(prev);
        if (direction === 'next' && next) setSelectedContent(next);
    };

    if (!course) {
        return (
            <div className="course-loading">
                <div className="loading-spinner"></div>
                <p>Yükleniyor...</p>
            </div>
        );
    }

    const sortedContents = [...(course.contents || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

    const thumbnailSrc = api.getFileUrl(course.thumbnail);

    return (
        <div className={`course-page ${isResizing ? 'resizing' : ''}`}>
            <div className="course-mobile-header">
                <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <h2 className="mobile-title">{selectedContent?.title || course.title}</h2>
            </div>

            <aside
                ref={sidebarRef}
                className={`course-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}
                style={{ width: window.innerWidth > 768 ? sidebarWidth : undefined }}
            >
                <div className="sidebar-header">
                    <Link to="/" className="back-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Geri
                    </Link>
                    <button
                        className="close-sidebar btn btn-ghost btn-icon"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="sidebar-course-info">
                    <img src={thumbnailSrc} alt={course.title} className="course-thumb" />
                    <h1 className="course-name">{course.title}</h1>
                    <span className="badge badge-primary">{course.category}</span>
                </div>

                <div className="sidebar-content-list">
                    {sortedContents.length > 0 ? (
                        <div className="content-items-list">
                            {sortedContents.map((content, index) => {
                                const contentId = content._id || content.id;
                                const selectedId = selectedContent?._id || selectedContent?.id;
                                const isSelected = contentId === selectedId;
                                return (
                                    <button
                                        key={content._id || content.id}
                                        className="content-list-item"
                                        style={{
                                            background: isSelected ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                            borderColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                                            opacity: isSelected ? 1 : 0.7,
                                            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                            boxShadow: isSelected ? '0 4px 16px rgba(99, 102, 241, 0.4)' : 'none'
                                        }}
                                        onClick={() => {
                                            setSelectedContent(content);
                                            setIsMobileSidebarOpen(false);
                                        }}
                                    >
                                        <span
                                            className="item-number"
                                            style={{
                                                background: isSelected ? 'white' : 'var(--bg-secondary)',
                                                color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)'
                                            }}
                                        >
                                            {index + 1}
                                        </span>
                                        <span className="item-icon">{getContentIcon(content.type)}</span>
                                        <div className="item-info">
                                            <span
                                                className="item-title"
                                                style={{ color: isSelected ? 'white' : 'var(--text-primary)' }}
                                            >
                                                {content.title}
                                            </span>
                                            <span
                                                className="item-type"
                                                style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)' }}
                                            >
                                                {getContentLabel(content.type)}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-sidebar">
                            <p>Henüz içerik eklenmemiş.</p>
                        </div>
                    )}
                </div>
            </aside>

            <div
                className="resize-handle"
                onMouseDown={handleMouseDown}
                style={{ left: window.innerWidth > 768 ? sidebarWidth : 0 }}
            >
                <div className="handle-line"></div>
            </div>

            <main className="course-main" style={{ marginLeft: window.innerWidth > 768 ? sidebarWidth : 0 }}>
                {selectedContent ? (
                    <div className="content-viewer animate-fade-in">
                        <div className="content-header">
                            <div className="content-meta">
                                <span className="content-type-badge">
                                    {getContentIcon(selectedContent.type)} {getContentLabel(selectedContent.type)}
                                </span>
                            </div>
                            <h2 className="content-title">{selectedContent.title}</h2>
                        </div>
                        <div className="content-body">
                            {renderViewer()}

                            <div className="content-navigation">
                                <button
                                    className="btn btn-nav btn-prev"
                                    onClick={() => navigateContent('prev')}
                                    disabled={!getNeighbors().prev}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                    Önceki İçerik
                                </button>
                                <button
                                    className="btn btn-nav btn-next"
                                    onClick={() => navigateContent('next')}
                                    disabled={!getNeighbors().next}
                                >
                                    Sonraki İçerik
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="no-content-selected">
                        <div className="empty-icon">📚</div>
                        <h3>İçerik Seçin</h3>
                        <p>Görüntülemek istediğiniz bir içerik seçin.</p>
                    </div>
                )}
            </main>

            {isMobileSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}
        </div>
    );
}
