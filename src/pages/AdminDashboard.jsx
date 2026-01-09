import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/apiService';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [passwordModal, setPasswordModal] = useState({ open: false, userId: null, userName: '' });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      refreshData();
    }
  }, [authLoading, isAuthenticated, isAdmin]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [coursesData, usersData, statsData] = await Promise.all([
        api.getAllCourses(),
        api.getUsers(),
        api.getStats()
      ]);
      setCourses(coursesData);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="loading-state" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner"></div>
        <p>Yetkiler kontrol ediliyor...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDeleteCourse = async (id) => {
    if (confirm('Bu ders paketini silmek istediğinize emin misiniz?')) {
      try {
        await api.deleteCourse(id);
        await refreshData();
      } catch (error) {
        alert('Hata: ' + error.message);
      }
    }
  };

  const handleDeleteUser = async (id) => {
    if (id === user.id) {
      alert('Kendinizi silemezsiniz!');
      return;
    }
    if (confirm('Bu kullanıcıyı ve tüm içeriklerini silmek istediğinize emin misiniz?')) {
      try {
        await api.deleteUser(id);
        await refreshData();
      } catch (error) {
        alert('Hata: ' + error.message);
      }
    }
  };

  const handleToggleRole = async (userId) => {
    if (userId === user.id) {
      alert('Kendi rolünüzü değiştiremezsiniz!');
      return;
    }
    const targetUser = users.find(u => u._id === userId || u.id === userId);
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      await api.updateUserRole(userId, newRole);
      if (newRole === 'admin') {
        await api.updateUserUploadPermission(userId, true);
      }
      await refreshData();
    } catch (error) {
      alert('Hata: ' + error.message);
    }
  };

  const handleToggleUploadPermission = async (userId) => {
    if (userId === user.id) {
      alert('Kendi izinlerinizi değiştiremezsiniz!');
      return;
    }
    const targetUser = users.find(u => u._id === userId || u.id === userId);
    if (targetUser.role === 'admin') {
      alert('Admin kullanıcıların her zaman yükleme izni vardır!');
      return;
    }
    try {
      await api.updateUserUploadPermission(userId, !targetUser.canUpload);
      await refreshData();
    } catch (error) {
      alert('Hata: ' + error.message);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('Şifre en az 6 karakter olmalı!');
      return;
    }
    try {
      await api.resetUserPassword(passwordModal.userId, newPassword);
      alert('Şifre başarıyla güncellendi!');
      setPasswordModal({ open: false, userId: null, userName: '' });
      setNewPassword('');
    } catch (error) {
      alert('Hata: ' + error.message);
    }
  };

  const contentTypeLabels = {
    note: '📝 Notlar',
    flashcard: '🎴 Kartlar',
    quiz: '❓ Testler',
    video: '🎬 Videolar'
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <div className="admin-title">
            <h1>Admin Paneli</h1>
            <p>Platform yönetimi ve istatistikler</p>
          </div>
        </header>

        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Genel Bakış</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Kullanıcılar ({users.length})</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Ders Paketleri ({courses.length})</span>
          </button>
        </div>

        <main className="admin-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Yükleniyor...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="tab-content animate-fade-in">
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon users">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">{stats.totalUsers || 0}</span>
                        <span className="stat-label">Kullanıcı</span>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon courses">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">{stats.totalCourses || 0}</span>
                        <span className="stat-label">Ders Paketi</span>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon contents">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">{stats.totalContents || 0}</span>
                        <span className="stat-label">Toplam İçerik</span>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon public">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">{stats.publicCourses || 0}</span>
                        <span className="stat-label">Herkese Açık</span>
                      </div>
                    </div>
                  </div>

                  <div className="content-breakdown card">
                    <h3>İçerik Dağılımı</h3>
                    <div className="breakdown-list">
                      {Object.entries(stats.contentsByType || {}).map(([type, count]) => (
                        <div key={type} className="breakdown-item">
                          <span className="breakdown-label">{contentTypeLabels[type] || type}</span>
                          <div className="breakdown-bar">
                            <div
                              className="breakdown-fill"
                              style={{ width: `${(count / (stats.totalContents || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="breakdown-value">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="tab-content animate-fade-in">
                  <div className="data-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Kullanıcı</th>
                          <th>E-posta</th>
                          <th>Rol</th>
                          <th>Upload İzni</th>
                          <th>Kayıt Tarihi</th>
                          <th>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u._id || u.id}>
                            <td>
                              <div className="user-cell">
                                <img src={api.getFileUrl(u.avatar)} alt={u.name} />
                                <span>{u.name}</span>
                              </div>
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`badge ${u.role === 'admin' ? 'badge-primary' : ''}`}>
                                {u.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                              </span>
                            </td>
                            <td>
                              <button
                                className={`permission-toggle ${u.canUpload || u.role === 'admin' ? 'active' : ''}`}
                                onClick={() => handleToggleUploadPermission(u._id || u.id)}
                                disabled={(u._id || u.id) === user.id || u.role === 'admin'}
                                title={u.role === 'admin' ? 'Adminler her zaman yükleyebilir' : 'Yükleme iznini değiştir'}
                              >
                                {u.canUpload || u.role === 'admin' ? '✓ İzinli' : '✗ İzinsiz'}
                              </button>
                            </td>
                            <td>{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                            <td>
                              <div className="table-actions">
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleToggleRole(u._id || u.id)}
                                  disabled={(u._id || u.id) === user.id}
                                >
                                  {u.role === 'admin' ? 'Kullanıcı Yap' : 'Admin Yap'}
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setPasswordModal({ open: true, userId: u._id || u.id, userName: u.name })}
                                  disabled={(u._id || u.id) === user.id}
                                >
                                  Şifre
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm btn-danger"
                                  onClick={() => handleDeleteUser(u._id || u.id)}
                                  disabled={(u._id || u.id) === user.id}
                                >
                                  Sil
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="tab-content animate-fade-in">
                  <div className="data-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Ders Paketi</th>
                          <th>Yazar</th>
                          <th>Kategori</th>
                          <th>İçerik</th>
                          <th>Durum</th>
                          <th>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map(course => (
                          <tr key={course._id || course.id}>
                            <td>
                              <div className="course-cell">
                                <img src={api.getFileUrl(course.thumbnail)} alt={course.title} />
                                <span>{course.title}</span>
                              </div>
                            </td>
                            <td>{course.authorName}</td>
                            <td>{course.category}</td>
                            <td>{course.contents?.length || 0}</td>
                            <td>
                              <span className={`badge ${course.isPublic ? 'badge-success' : ''}`}>
                                {course.isPublic ? 'Açık' : 'Özel'}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions">
                                <a
                                  href={`/course/${course._id || course.id}`}
                                  className="btn btn-ghost btn-sm"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Görüntüle
                                </a>
                                <button
                                  className="btn btn-ghost btn-sm btn-danger"
                                  onClick={() => handleDeleteCourse(course._id || course.id)}
                                >
                                  Sil
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Password Reset Modal */}
      {passwordModal.open && (
        <div className="modal-overlay" onClick={() => setPasswordModal({ open: false, userId: null, userName: '' })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Şifre Sıfırla</h3>
              <button
                className="modal-close"
                onClick={() => setPasswordModal({ open: false, userId: null, userName: '' })}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-info">
                <strong>{passwordModal.userName}</strong> için yeni şifre belirleyin.
              </p>
              <div className="form-group">
                <label htmlFor="newPassword">Yeni Şifre</label>
                <input
                  type="password"
                  id="newPassword"
                  className="input"
                  placeholder="En az 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setPasswordModal({ open: false, userId: null, userName: '' })}
              >
                İptal
              </button>
              <button
                className="btn btn-primary"
                onClick={handleResetPassword}
              >
                Şifreyi Güncelle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
