import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { getFileUrl } from '../../services/apiService';
import './Header.css';

export default function Header() {
    const { theme, toggleTheme } = useTheme();
    const { user, isAuthenticated, isAdmin, logout, getAvatarUrl } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.user-menu') && !e.target.closest('.mobile-menu-btn')) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
        setMenuOpen(false);
        setMobileMenuOpen(false);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    // Get avatar URL
    const avatarSrc = user?.avatar ? getFileUrl(user.avatar) : getAvatarUrl?.() || null;

    return (
        <>
            <header className="header">
                <div className="header-container">
                    <Link to="/" className="header-logo">
                        <img src="/logo.png" alt="Robin Notes" className="logo-img" />
                        <span className="logo-text">Robin Notes</span>
                    </Link>

                    <nav className="header-nav desktop-only">
                        <Link to="/" className="nav-link">Ana Sayfa</Link>
                        {isAuthenticated && (
                            <Link to="/dashboard" className="nav-link">Panelim</Link>
                        )}
                        {isAdmin && (
                            <Link to="/admin" className="nav-link nav-link-admin">Admin</Link>
                        )}
                    </nav>

                    <div className="header-actions">
                        <button
                            onClick={toggleTheme}
                            className="btn btn-icon btn-ghost theme-toggle"
                            aria-label="Tema değiştir"
                        >
                            {theme === 'light' ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="5" />
                                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                </svg>
                            )}
                        </button>

                        {isAuthenticated ? (
                            <div className="user-menu desktop-only">
                                <button
                                    className="user-avatar-btn"
                                    onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                                >
                                    <img src={avatarSrc} alt={user.name} className="user-avatar" />
                                    <span className="user-name">{user.name}</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </button>

                                {menuOpen && (
                                    <div className="dropdown-menu animate-fade-in">
                                        <Link to="/dashboard" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                            Profilim
                                        </Link>
                                        {isAdmin && (
                                            <Link to="/admin" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="3" />
                                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                                </svg>
                                                Admin Paneli
                                            </Link>
                                        )}
                                        <div className="dropdown-divider" />
                                        <button onClick={handleLogout} className="dropdown-item dropdown-item-danger">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                <polyline points="16 17 21 12 16 7" />
                                                <line x1="21" y1="12" x2="9" y2="12" />
                                            </svg>
                                            Çıkış Yap
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="auth-buttons desktop-only">
                                <Link to="/login" className="btn btn-ghost btn-sm">Giriş Yap</Link>
                                <Link to="/register" className="btn btn-primary btn-sm">Kayıt Ol</Link>
                            </div>
                        )}

                        <button
                            className="mobile-menu-btn btn btn-icon btn-ghost"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {mobileMenuOpen ? (
                                    <path d="M18 6L6 18M6 6l12 12" />
                                ) : (
                                    <>
                                        <line x1="3" y1="12" x2="21" y2="12" />
                                        <line x1="3" y1="6" x2="21" y2="6" />
                                        <line x1="3" y1="18" x2="21" y2="18" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
                    <nav className="mobile-menu animate-slide-in" onClick={(e) => e.stopPropagation()}>
                        {isAuthenticated && (
                            <div className="mobile-user-info">
                                <img src={avatarSrc} alt={user.name} className="mobile-avatar" />
                                <span>{user.name}</span>
                            </div>
                        )}

                        <Link to="/" className="mobile-nav-link" onClick={closeMobileMenu}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            Ana Sayfa
                        </Link>

                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" className="mobile-nav-link" onClick={closeMobileMenu}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Panelim
                                </Link>
                                {isAdmin && (
                                    <Link to="/admin" className="mobile-nav-link" onClick={closeMobileMenu}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33" />
                                        </svg>
                                        Admin Paneli
                                    </Link>
                                )}
                                <div className="mobile-nav-divider" />
                                <button onClick={handleLogout} className="mobile-nav-link mobile-nav-logout">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Çıkış Yap
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="mobile-nav-link" onClick={closeMobileMenu}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                        <polyline points="10 17 15 12 10 7" />
                                        <line x1="15" y1="12" x2="3" y2="12" />
                                    </svg>
                                    Giriş Yap
                                </Link>
                                <Link to="/register" className="mobile-nav-link mobile-nav-primary" onClick={closeMobileMenu}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="8.5" cy="7" r="4" />
                                        <line x1="20" y1="8" x2="20" y2="14" />
                                        <line x1="23" y1="11" x2="17" y2="11" />
                                    </svg>
                                    Kayıt Ol
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </>
    );
}
