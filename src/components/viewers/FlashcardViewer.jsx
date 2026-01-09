import { useState, useEffect, useCallback } from 'react';
import './FlashcardViewer.css';

export default function FlashcardViewer({ content }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [knownCards, setKnownCards] = useState(new Set());

    const cards = content.data?.cards || [];
    const currentCard = cards[currentIndex];

    const goToNext = useCallback(() => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        }
    }, [currentIndex, cards.length]);

    const goToPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsFlipped(false);
        }
    }, [currentIndex]);

    const toggleFlip = useCallback(() => {
        setIsFlipped(prev => !prev);
    }, []);

    const toggleKnown = useCallback(() => {
        setKnownCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(currentCard?.id)) {
                newSet.delete(currentCard?.id);
            } else {
                newSet.add(currentCard?.id);
            }
            return newSet;
        });
    }, [currentCard?.id]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    goToPrev();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    goToNext();
                    break;
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    toggleFlip();
                    break;
                case '1':
                    e.preventDefault();
                    toggleKnown();
                    break;
                case 'k':
                case 'K':
                    e.preventDefault();
                    toggleKnown();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNext, goToPrev, toggleFlip, toggleKnown]);

    if (!cards.length) {
        return (
            <div className="flashcard-empty">
                <p>Bu içerikte henüz kart yok.</p>
            </div>
        );
    }

    const progress = ((currentIndex + 1) / cards.length) * 100;
    const knownCount = knownCards.size;

    return (
        <div className="flashcard-viewer">
            <div className="flashcard-header">
                <div className="progress-info">
                    <span>{currentIndex + 1} / {cards.length}</span>
                    <span className="known-count">✓ {knownCount} biliyorum</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="flashcard-container">
                <div
                    className={`flashcard ${isFlipped ? 'flipped' : ''} ${knownCards.has(currentCard?.id) ? 'known' : ''}`}
                    onClick={toggleFlip}
                >
                    <div className="flashcard-inner">
                        <div className="flashcard-front">
                            <div className="card-content">
                                <span className="card-label">Soru</span>
                                <p>{currentCard?.front}</p>
                            </div>
                            <div className="flip-hint">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 1l4 4-4 4" />
                                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                    <path d="M7 23l-4-4 4-4" />
                                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                </svg>
                                Çevirmek için tıkla (veya Space/Enter)
                            </div>
                        </div>
                        <div className="flashcard-back">
                            <div className="card-content">
                                <span className="card-label">Cevap</span>
                                <p>{currentCard?.back}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flashcard-controls">
                <button
                    className="btn btn-ghost btn-lg"
                    onClick={goToPrev}
                    disabled={currentIndex === 0}
                    title="Önceki (← Sol Ok)"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Önceki
                </button>

                <button
                    className={`btn btn-known ${knownCards.has(currentCard?.id) ? 'active' : ''}`}
                    onClick={toggleKnown}
                    title="Biliyorum olarak işaretle (K tuşu)"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {knownCards.has(currentCard?.id) ? 'Biliyorum' : 'Bilmiyorum'}
                </button>

                <button
                    className="btn btn-ghost btn-lg"
                    onClick={goToNext}
                    disabled={currentIndex === cards.length - 1}
                    title="Sonraki (→ Sağ Ok)"
                >
                    Sonraki
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <div className="keyboard-hints">
                <span>← → Geçiş</span>
                <span>Space/Enter Çevir</span>
                <span>K Biliyorum</span>
            </div>
        </div>
    );
}
