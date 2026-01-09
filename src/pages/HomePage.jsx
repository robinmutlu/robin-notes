import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import CourseCard from '../components/CourseCard';
import './HomePage.css';

export default function HomePage() {
    const [courses, setCourses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const loadCourses = async () => {
            try {
                const data = await api.getCourses();
                setCourses(data);
            } catch (error) {
                console.error('Failed to load courses:', error);
            }
            setIsLoading(false);
        };
        loadCourses();
    }, []);

    const categories = ['all', ...new Set(courses.map(c => c.category))];

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-background">
                    <div className="hero-orb hero-orb-1"></div>
                    <div className="hero-orb hero-orb-2"></div>
                    <div className="hero-orb hero-orb-3"></div>
                </div>

                <div className="hero-content container">
                    <div className="hero-badge animate-fade-in">
                        <span className="badge-icon">🐦</span>
                        <span>Yeni Nesil Öğrenme Platformu</span>
                    </div>

                    <h1 className="hero-title animate-fade-in-up">
                        Bilgiyi <span className="text-gradient">Keşfet</span>,<br />
                        Öğrenmeyi <span className="text-gradient">Dönüştür</span>
                    </h1>

                    <p className="hero-subtitle animate-fade-in-up stagger-1">
                        Ders notları, bilgi kartları, testler ve videolarla<br />
                        öğrenme deneyimini bir üst seviyeye taşı.
                    </p>

                    <div className="hero-actions animate-fade-in-up stagger-2">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="btn btn-primary btn-lg">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                                Ders Paketlerim
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="btn btn-primary btn-lg">
                                    Hemen Başla
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </Link>
                                <Link to="/login" className="btn btn-secondary btn-lg">
                                    Giriş Yap
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="hero-stats animate-fade-in-up stagger-3">
                        <div className="stat">
                            <span className="stat-value">{courses.length}+</span>
                            <span className="stat-label">Ders Paketi</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat">
                            <span className="stat-value">100+</span>
                            <span className="stat-label">İçerik</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat">
                            <span className="stat-value">4</span>
                            <span className="stat-label">İçerik Türü</span>
                        </div>
                    </div>
                </div>

                <div className="hero-scroll-indicator animate-float">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                    </svg>
                </div>
            </section>

            {/* Courses Section */}
            <section className="courses-section" id="courses">
                <div className="container">
                    <div className="section-header">
                        <div className="section-title-wrapper">
                            <h2 className="section-title">Ders Paketleri</h2>
                            <p className="section-subtitle">Öğrenmeye başlamak için bir paket seç</p>
                        </div>

                        <div className="courses-filters">
                            <div className="search-box">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Ders ara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input"
                                />
                            </div>

                            <div className="category-filter">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >
                                        {cat === 'all' ? 'Tümü' : cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Yükleniyor...</p>
                        </div>
                    ) : filteredCourses.length > 0 ? (
                        <div className="courses-grid">
                            {filteredCourses.map((course, index) => (
                                <CourseCard key={course._id || course.id} course={course} index={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📚</div>
                            <h3>Henüz ders paketi yok</h3>
                            <p>Arama kriterlerine uygun ders paketi bulunamadı.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <h2 className="section-title">Neden Robin Notes?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📝</div>
                            <h3>Zengin Ders Notları</h3>
                            <p>Markdown destekli, kod vurgulama özellikli detaylı notlar oluştur.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🎴</div>
                            <h3>Bilgi Kartları</h3>
                            <p>Flip animasyonlu kartlarla etkili ezber tekniği uygula.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">❓</div>
                            <h3>İnteraktif Testler</h3>
                            <p>Bilgilerini test et, eksiklerini hemen gör.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🎬</div>
                            <h3>Video Desteği</h3>
                            <p>Video yükle veya YouTube bağlantısı ekle.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <img src="/logo.png" alt="Robin Notes" className="footer-logo-img" />
                            <span>Robin Notes</span>
                        </div>
                        <p className="footer-text">© 2024 Robin Notes. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
