import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/apiService';
import './AuthPages.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.forgotPassword(email);
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
                            <div className="success-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <h2>E-posta Gönderildi! 📬</h2>
                            <p>
                                <strong>{email}</strong> adresine şifre sıfırlama linki gönderildi.
                                Lütfen gelen kutunuzu kontrol edin.
                            </p>
                            <div className="success-tips">
                                <p>🔍 E-postayı bulamıyor musunuz?</p>
                                <ul>
                                    <li>Spam/Gereksiz klasörünü kontrol edin</li>
                                    <li>E-posta adresini doğru yazdığınızdan emin olun</li>
                                    <li>Birkaç dakika bekleyin</li>
                                </ul>
                            </div>
                            <Link to="/login" className="btn btn-primary btn-full">
                                Giriş Sayfasına Dön
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
                        <h1>Şifremi Unuttum 🔐</h1>
                        <p>E-posta adresinizi girin, size şifre sıfırlama linki gönderelim.</p>
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
                            <label htmlFor="email">E-posta Adresi</label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                placeholder="ornek@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg btn-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Gönderiliyor...
                                </>
                            ) : (
                                '📧 Sıfırlama Linki Gönder'
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
