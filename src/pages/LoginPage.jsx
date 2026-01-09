import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password, rememberMe);

            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message || 'Giriş yapılırken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card animate-fade-in-up">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">
                            <img src="/logo.png" alt="Robin Notes" className="logo-img" />
                            <span>Robin Notes</span>
                        </Link>
                        <h1>Hoş Geldin!</h1>
                        <p>Hesabına giriş yap ve öğrenmeye devam et.</p>
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
                            <label htmlFor="email">E-posta</label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                placeholder="ornek@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Şifre</label>
                            <input
                                id="password"
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="checkbox-custom">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </span>
                                <span>Beni hatırla</span>
                            </label>
                            <Link to="/forgot-password" className="forgot-link">Şifremi unuttum</Link>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg btn-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Giriş yapılıyor...
                                </>
                            ) : (
                                'Giriş Yap'
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Hesabın yok mu? <Link to="/register">Kayıt Ol</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
