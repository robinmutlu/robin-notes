import { Link } from 'react-router-dom';
import { getFileUrl } from '../services/apiService';
import './CourseCard.css';

export default function CourseCard({ course, index = 0 }) {
    const contentCounts = course.contents?.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
    }, {}) || {};

    const typeIcons = {
        note: '📝',
        flashcard: '🎴',
        quiz: '❓',
        video: '🎬'
    };

    const typeLabels = {
        note: 'Not',
        flashcard: 'Kart',
        quiz: 'Test',
        video: 'Video'
    };

    const thumbnailSrc = getFileUrl(course.thumbnail);

    return (
        <Link
            to={`/course/${course._id || course.id}`}
            className="course-card animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <div className="course-thumbnail">
                <img src={thumbnailSrc} alt={course.title} />
                <div className="course-overlay">
                    <span className="course-category">{course.category}</span>
                </div>
            </div>

            <div className="course-content">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-description">{course.description}</p>

                <div className="course-meta">
                    <div className="content-badges">
                        {Object.entries(contentCounts).map(([type, count]) => (
                            <span key={type} className="content-badge" title={typeLabels[type]}>
                                {typeIcons[type]} {count}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="course-footer">
                    <div className="course-author">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>{course.authorName}</span>
                    </div>
                    <span className="course-arrow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
}
