import { useState, useEffect } from 'react';
import * as api from '../../services/apiService';
import './NoteViewer.css';

export default function NoteViewer({ content }) {
    const [documentContent, setDocumentContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Debug: log content structure
    console.log('NoteViewer content:', content);
    console.log('NoteViewer content.data:', content?.data);

    const isDocument = content?.data?.isDocument;
    const fileType = content?.data?.fileType;
    const fileUrl = content?.data?.fileUrl;
    const fileName = content?.data?.fileName;

    useEffect(() => {
        if (isDocument && fileUrl) {
            loadDocument();
        }
    }, [isDocument, fileUrl]);

    const loadDocument = async () => {
        setLoading(true);
        setError(null);

        try {
            const fullUrl = api.getFileUrl(fileUrl);
            console.log('Loading document from:', fullUrl);

            if (fileType === 'pdf') {
                // For PDF, use embedded viewer
                setDocumentContent(fullUrl);
            } else if (fileType === 'doc' || fileType === 'docx') {
                // For Word, use Google Docs viewer or download link
                setDocumentContent(fullUrl);
            }
        } catch (err) {
            console.error('Error loading document:', err);
            setError('Döküman yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const renderMarkdown = (text) => {
        if (!text) return '';

        let html = text
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code class="language-$1">$2</code></pre>')
            .replace(/`([^`]+)`/gim, '<code>$1</code>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
            .replace(/\n\n/gim, '</p><p>')
            .replace(/\n/gim, '<br>');

        html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');

        return `<p>${html}</p>`;
    };

    // Document view
    if (isDocument) {
        if (loading) {
            return (
                <div className="note-viewer">
                    <div className="document-loading">
                        <div className="loading-spinner"></div>
                        <p>Döküman yükleniyor...</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="note-viewer">
                    <div className="document-error">
                        <span className="error-icon">⚠️</span>
                        <p>{error}</p>
                        <button className="btn btn-secondary" onClick={loadDocument}>Tekrar Dene</button>
                    </div>
                </div>
            );
        }

        // PDF Viewer
        if (fileType === 'pdf' && documentContent) {
            // Ensure filename ends with .pdf for download, replacing original extension if needed
            const pdfFileName = fileName
                ? (fileName.toLowerCase().endsWith('.pdf') ? fileName : fileName.replace(/\.[^/.]+$/, "") + ".pdf")
                : 'Dokuman.pdf';

            const downloadUrl = api.getDownloadUrl(fileUrl, pdfFileName);

            return (
                <div className="note-viewer pdf-viewer">
                    <div className="document-header">
                        <span className="file-icon">📄</span>
                        <span className="file-name">{fileName || 'PDF Döküman'}</span>
                        <a href={downloadUrl} className="btn btn-secondary btn-sm">
                            İndir
                        </a>
                    </div>
                    <div className="pdf-container">
                        <iframe
                            src={documentContent}
                            title={fileName || 'PDF'}
                            style={{ width: '100%', height: '80vh', border: 'none', borderRadius: '8px' }}
                        />
                    </div>
                </div>
            );
        }

        // Word Viewer
        if ((fileType === 'doc' || fileType === 'docx') && documentContent) {
            // Use Google Docs Viewer for Word files
            const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(documentContent)}&embedded=true`;

            return (
                <div className="note-viewer word-viewer">
                    <div className="document-header">
                        <span className="file-icon">📘</span>
                        <span className="file-name">{fileName || 'Word Döküman'}</span>
                        <a href={documentContent} download className="btn btn-secondary btn-sm">
                            İndir
                        </a>
                    </div>
                    <div className="word-container">
                        <iframe
                            src={googleViewerUrl}
                            title={fileName || 'Word'}
                            style={{ width: '100%', height: '80vh', border: 'none', borderRadius: '8px' }}
                        />
                    </div>
                </div>
            );
        }

        // Fallback - show download link
        return (
            <div className="note-viewer">
                <div className="document-download">
                    <div className="file-icon" style={{ fontSize: '64px', marginBottom: '16px' }}>
                        {fileType === 'pdf' ? '📄' : '📘'}
                    </div>
                    <h3>{fileName || 'Döküman'}</h3>
                    <p>Bu dökümanı görüntülemek için indirin.</p>
                    <a href={api.getFileUrl(fileUrl)} download className="btn btn-primary">
                        Dökümanı İndir
                    </a>
                </div>
            </div>
        );
    }

    // Regular markdown note
    return (
        <div className="note-viewer">
            <div
                className="note-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content?.data?.content) }}
            />
        </div>
    );
}
