import { useState } from 'react';
import './QuizViewer.css';

export default function QuizViewer({ content }) {
    const questions = content.data?.questions || [];
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);

    const handleAnswer = (questionIndex, optionIndex) => {
        if (showResults) return;

        // If clicking the same answer, deselect it
        if (selectedAnswers[questionIndex] === optionIndex) {
            const newAnswers = { ...selectedAnswers };
            delete newAnswers[questionIndex];
            setSelectedAnswers(newAnswers);
        } else {
            setSelectedAnswers({
                ...selectedAnswers,
                [questionIndex]: optionIndex
            });
        }
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmit = () => {
        setShowResults(true);
    };

    const handleReset = () => {
        setSelectedAnswers({});
        setShowResults(false);
        setCurrentQuestion(0);
    };

    const calculateScore = () => {
        let correct = 0;
        questions.forEach((q, idx) => {
            if (selectedAnswers[idx] === q.correctAnswer) {
                correct++;
            }
        });
        return correct;
    };

    const score = calculateScore();
    const percentage = ((score / questions.length) * 100).toFixed(0);

    if (questions.length === 0) {
        return (
            <div className="quiz-empty">
                <p>Bu pakette henüz test sorusu yok.</p>
            </div>
        );
    }

    if (showResults) {
        return (
            <div className="quiz-viewer">
                <div className="quiz-results animate-scale-in">
                    <div className={`result-circle ${percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'fail'}`}>
                        <span className="result-score">{percentage}%</span>
                        <span className="result-label">Başarı</span>
                    </div>

                    <div className="result-stats">
                        <div className="result-stat">
                            <span className="stat-number correct">{score}</span>
                            <span className="stat-label">Doğru</span>
                        </div>
                        <div className="result-stat">
                            <span className="stat-number wrong">{questions.length - score}</span>
                            <span className="stat-label">Yanlış</span>
                        </div>
                        <div className="result-stat">
                            <span className="stat-number total">{questions.length}</span>
                            <span className="stat-label">Toplam</span>
                        </div>
                    </div>

                    <div className="result-message">
                        {percentage >= 70 ? (
                            <p>🎉 Harika! Çok iyi bir performans gösterdin!</p>
                        ) : percentage >= 50 ? (
                            <p>👍 Fena değil! Biraz daha çalışmaya devam.</p>
                        ) : (
                            <p>💪 Konuyu tekrar gözden geçirmelisin.</p>
                        )}
                    </div>

                    <div className="answers-review">
                        <h4>Cevap Anahtarı</h4>
                        {questions.map((q, idx) => (
                            <div
                                key={idx}
                                className={`review-item ${selectedAnswers[idx] === q.correctAnswer ? 'correct' : 'wrong'}`}
                            >
                                <div className="review-question">
                                    <span className="review-number">{idx + 1}.</span>
                                    {q.question}
                                </div>
                                <div className="review-answers">
                                    <span className="your-answer">
                                        Senin cevabın: {q.options[selectedAnswers[idx]] || 'Cevaplanmadı'}
                                    </span>
                                    {selectedAnswers[idx] !== q.correctAnswer && (
                                        <span className="correct-answer">
                                            Doğru cevap: {q.options[q.correctAnswer]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="btn btn-primary" onClick={handleReset}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                            <path d="M8 16H3v5" />
                        </svg>
                        Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }

    const question = questions[currentQuestion];
    const isAnswered = selectedAnswers[currentQuestion] !== undefined;
    const allAnswered = Object.keys(selectedAnswers).length === questions.length;

    return (
        <div className="quiz-viewer">
            <div className="quiz-progress">
                <div className="progress-dots">
                    {questions.map((_, idx) => (
                        <button
                            key={idx}
                            className={`progress-dot ${currentQuestion === idx ? 'active' : ''} ${selectedAnswers[idx] !== undefined ? 'answered' : ''}`}
                            onClick={() => setCurrentQuestion(idx)}
                        />
                    ))}
                </div>
                <span className="progress-text">{currentQuestion + 1} / {questions.length}</span>
            </div>

            <div className="question-card animate-fade-in" key={currentQuestion}>
                <h3 className="question-text">{question.question}</h3>

                <div className="options-list">
                    {question.options.map((option, idx) => (
                        <button
                            key={idx}
                            className={`option-btn ${selectedAnswers[currentQuestion] === idx ? 'selected' : ''}`}
                            onClick={() => handleAnswer(currentQuestion, idx)}
                        >
                            <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                            <span className="option-text">{option}</span>
                            {selectedAnswers[currentQuestion] === idx && (
                                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="quiz-controls">
                <button
                    className="btn btn-secondary"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Önceki
                </button>

                {currentQuestion === questions.length - 1 ? (
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={!allAnswered}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Sonuçları Gör
                    </button>
                ) : (
                    <button
                        className="btn btn-primary"
                        onClick={handleNext}
                    >
                        Sonraki
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
