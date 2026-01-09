import { getFileUrl } from '../../services/apiService';
import './VideoViewer.css';

export default function VideoViewer({ content }) {
    const { url, isUploaded, duration, description } = content.data || {};

    const getEmbedUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('data:') || url.startsWith('/uploads')) return url;
        if (url.includes('embed')) return url;

        const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
        if (videoIdMatch) {
            return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
        }

        return url;
    };

    const videoSrc = isUploaded ? getFileUrl(url) : getEmbedUrl(url);

    if (!url) {
        return (
            <div className="video-empty">
                <p>Video URL'si bulunamadı.</p>
            </div>
        );
    }

    return (
        <div className="video-viewer">
            <div className="video-container">
                {isUploaded || (videoSrc && videoSrc.startsWith('http://localhost')) ? (
                    <video
                        src={videoSrc}
                        controls
                        className="uploaded-video"
                    />
                ) : (
                    <iframe
                        src={videoSrc}
                        title={content.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                )}
            </div>

            {(duration || description) && (
                <div className="video-info">
                    {duration && (
                        <div className="video-duration">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>{duration}</span>
                        </div>
                    )}
                    {description && (
                        <p className="video-description">{description}</p>
                    )}
                </div>
            )}
        </div>
    );
}
