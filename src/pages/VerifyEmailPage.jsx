import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as api from '../services/apiService';
import './AuthPages.css';

export default function VerifyEmailPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const verificationAttempted = useRef(false);

    useEffect(() => {
        // Prevent double verification (React Strict Mode protection)
        if (token && !verificationAttempted.current) {
            verificationAttempted.current = true;
            verifyEmail();
        }
    }, [token]);

    const verifyEmail = async () => {
        try {
            const result = await api.verifyEmail(token);
            setStatus('success');
            setMessage(result.message || 'E-posta adresiniz başarıyla doğrulandı!');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            setStatus('error');
            setMessage(error.message || 'Doğrulama sırasında hata oluştu');
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
                        <h1>
                            {status === 'verifying' && 'Email Doğrulanıyor...'}
                            {status === 'success' && 'Email Doğrulandı!'}
                            {status === 'error' && 'Doğrulama Başarısız'}
                        </h1>
                    </div>

                    <div className="verify-content">
                        {status === 'verifying' && (
                            <div className="verify-loading">
                                <div className="loading-spinner"></div>
                                <p>Lütfen bekleyin...</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="verify-success">
                                <div className="success-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                                <p style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '8px' }}>{message}</p>
                                <p className="redirect-text" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                                    Giriş sayfasına yönlendiriliyorsunuz...
                                </p>
                                <Link to="/login" className="btn btn-primary btn-lg">
                                    Hemen Giriş Yap
                                </Link>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="verify-error">
                                <div className="error-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                                <p style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '24px' }}>{message}</p>
                                <div className="verify-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    <Link to="/login" className="btn btn-secondary">
                                        Giriş Sayfası
                                    </Link>
                                    <Link to="/register" className="btn btn-primary">
                                        Yeniden Kayıt Ol
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
