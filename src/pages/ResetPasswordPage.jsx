import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/apiService';
import './AuthPages.css';

export default function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const passwordValidation = useMemo(() => ({
        minLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasNumber: /[0-9]/.test(password)
    }), [password]);

    const isPasswordValid = passwordValidation.minLength && passwordValidation.hasUpperCase;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isPasswordValid) {
            setError('Şifre gereksinimlerini karşılamıyor');
            return;
        }

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor');
            return;
        }

        setLoading(true);

        try {
            await api.resetPassword(token, password);
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card animate-fade-in-up">
                        <div className="success-state">
                            <div className="success-icon success">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <h2>Şifre Güncellendi! 🎉</h2>
                            <p>
                                Şifreniz başarıyla güncellendi. Artık yeni şifrenizle giriş yapabilirsiniz.
                            </p>
                            <Link to="/login" className="btn btn-primary btn-lg btn-full">
                                🚀 Giriş Yap
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card animate-fade-in-up">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">
                            <img src="/logo.png" alt="Robin Notes" className="logo-img" />
                            <span>Robin Notes</span>
                        </Link>
                        <h1>Yeni Şifre Belirle 🔑</h1>
                        <p>Hesabınız için güçlü bir şifre oluşturun.</p>
                    </div>

                    {error && (
                        <div className="auth-error animate-fade-in">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="password">Yeni Şifre</label>
                            <input
                                id="password"
                                type="password"
                                className="input"
                                placeholder="Güçlü bir şifre oluşturun"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {password && (
                                <div className="password-requirements">
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
                            <label htmlFor="confirmPassword">Şifre Tekrar</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className={`input ${confirmPassword && (password === confirmPassword ? 'input-valid' : 'input-error')}`}
                                placeholder="Şifreyi tekrar girin"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            {confirmPassword && password !== confirmPassword && (
                                <span className="field-error">Şifreler eşleşmiyor</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg btn-full"
                            disabled={loading || !isPasswordValid}
                        >
                            {loading ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Güncelleniyor...
                                </>
                            ) : (
                                '🔐 Şifremi Güncelle'
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Şifrenizi hatırlıyor musunuz? <Link to="/login">Giriş Yap</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
