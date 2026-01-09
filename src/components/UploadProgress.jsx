import { useState, useEffect } from 'react';
import './UploadProgress.css';

export default function UploadProgress({ progress, fileName, uploadSpeed, onCancel }) {
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [formattedSpeed, setFormattedSpeed] = useState('');

    useEffect(() => {
        if (uploadSpeed > 0 && progress > 0 && progress < 100) {
            // Estimate time remaining (very rough)
            const remainingProgress = 100 - progress;
            const estimatedSeconds = Math.ceil((remainingProgress / progress) * (Date.now() / 1000));
            setTimeRemaining(estimatedSeconds);

            // Format speed
            if (uploadSpeed >= 1024 * 1024) {
                setFormattedSpeed(`${(uploadSpeed / (1024 * 1024)).toFixed(1)} MB/s`);
            } else if (uploadSpeed >= 1024) {
                setFormattedSpeed(`${(uploadSpeed / 1024).toFixed(0)} KB/s`);
            } else {
                setFormattedSpeed(`${uploadSpeed.toFixed(0)} B/s`);
            }
        }
    }, [uploadSpeed, progress]);

    const formatTimeRemaining = (seconds) => {
        if (!seconds || seconds <= 0) return '';
        if (seconds < 60) return `${Math.ceil(seconds)} saniye`;
        if (seconds < 3600) return `${Math.ceil(seconds / 60)} dakika`;
        return `${Math.ceil(seconds / 3600)} saat`;
    };

    return (
        <div className="upload-progress-overlay">
            <div className="upload-progress-modal">
                <div className="upload-progress-header">
                    <div className="upload-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <h3>Dosya Yükleniyor</h3>
                </div>

                <div className="upload-file-info">
                    <span className="file-name">{fileName}</span>
                    {formattedSpeed && (
                        <span className="upload-speed">{formattedSpeed}</span>
                    )}
                </div>

                <div className="progress-container">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="progress-info">
                        <span className="progress-percent">{Math.round(progress)}%</span>
                        {timeRemaining && progress < 100 && (
                            <span className="time-remaining">
                                ~{formatTimeRemaining(timeRemaining)} kaldı
                            </span>
                        )}
                    </div>
                </div>

                {progress < 100 ? (
                    <div className="upload-actions">
                        {onCancel && (
                            <button className="btn btn-secondary btn-sm" onClick={onCancel}>
                                İptal
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="upload-complete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>Yükleme tamamlandı!</span>
                    </div>
                )}
            </div>
        </div>
    );
}
