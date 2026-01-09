import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    // Password validation
    const passwordValidation = useMemo(() => {
        return {
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasNumber: /[0-9]/.test(password)
        };
    }, [password]);

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
            const result = await register(name, email, password);

            if (result.success) {
                if (result.requiresVerification) {
                    // Show verification message
                    setVerificationSent(true);
                } else {
                    // First user, direct login
                    navigate('/dashboard');
                }
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message || 'Kayıt olurken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // Show verification message if registration successful
    if (verificationSent) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card animate-fade-in-up">
                        <div className="auth-header">
                            <Link to="/" className="auth-logo">
                                <img src="/logo.png" alt="Robin Notes" className="logo-img" />
                                <span>Robin Notes</span>
                            </Link>
                            <h1>📧 E-postanızı Kontrol Edin</h1>
                        </div>
                        <div className="verification-message">
                            <div className="success-icon">✅</div>
                            <p><strong>{email}</strong> adresine bir doğrulama linki gönderdik.</p>
                            <p>Hesabınızı aktifleştirmek için e-postadaki linke tıklayın.</p>
                            <div className="verification-tips">
                                <p>💡 E-posta gelmedi mi?</p>
                                <ul>
                                    <li>Spam/gereksiz klasörünü kontrol edin</li>
                                    <li>Birkaç dakika bekleyin</li>
                                </ul>
                            </div>
                            <Link to="/login" className="btn btn-primary btn-lg btn-full">
                                Giriş Sayfasına Git
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
                        <h1>Hesap Oluştur</h1>
                        <p>Hemen kaydol ve öğrenmeye başla.</p>
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
                            <label htmlFor="name">Ad Soyad</label>
                            <input
                                id="name"
                                type="text"
                                className="input"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

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
                                    Kayıt yapılıyor...
                                </>
                            ) : (
                                'Kayıt Ol'
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Zaten hesabın var mı? <Link to="/login">Giriş Yap</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
