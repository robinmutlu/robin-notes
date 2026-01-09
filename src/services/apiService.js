// API Service for Robin Notes
// Handles all communication with the backend server

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// Get auth token from localStorage or sessionStorage
const getToken = () => localStorage.getItem('robinnotes-token') || sessionStorage.getItem('robinnotes-token');

// Set auth token (rememberMe: true = localStorage, false = sessionStorage)
export const setToken = (token, rememberMe = true) => {
    // Clear both storages first
    localStorage.removeItem('robinnotes-token');
    sessionStorage.removeItem('robinnotes-token');

    if (token) {
        if (rememberMe) {
            localStorage.setItem('robinnotes-token', token);
        } else {
            sessionStorage.setItem('robinnotes-token', token);
        }
    }
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    // Don't set Content-Type for FormData
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Bir hata oluştu');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// ============ AUTH ============

export const login = async (email, password, rememberMe = true) => {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    setToken(data.token, rememberMe);
    return data;
};

export const register = async (name, email, password) => {
    const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
    });
    // Only set token if returned (first user)
    if (data.token) {
        setToken(data.token);
    }
    return data;
};

export const getCurrentUser = async () => {
    return await apiRequest('/auth/me');
};

export const logout = () => {
    setToken(null);
};

export const verifyEmail = async (token) => {
    return await apiRequest(`/auth/verify-email/${token}`);
};

export const resendVerification = async (email) => {
    return await apiRequest('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email })
    });
};

export const forgotPassword = async (email) => {
    return await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
    });
};

export const resetPassword = async (token, newPassword) => {
    return await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
    });
};

// ============ USERS ============

export const getUsers = async () => {
    return await apiRequest('/users');
};

export const updateUser = async (userId, updates) => {
    return await apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
};

export const updateUserRole = async (userId, role) => {
    return await apiRequest(`/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
    });
};

export const updateUserUploadPermission = async (userId, canUpload) => {
    return await apiRequest(`/users/${userId}/upload-permission`, {
        method: 'PUT',
        body: JSON.stringify({ canUpload })
    });
};

export const deleteUser = async (userId) => {
    return await apiRequest(`/users/${userId}`, {
        method: 'DELETE'
    });
};

export const resetUserPassword = async (userId, newPassword) => {
    return await apiRequest(`/users/${userId}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword })
    });
};

export const changeMyPassword = async (currentPassword, newPassword) => {
    return await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
    });
};

// ============ COURSES ============

export const getCourses = async () => {
    return await apiRequest('/courses');
};

export const getAllCourses = async () => {
    return await apiRequest('/courses/all');
};

export const getMyCourses = async () => {
    return await apiRequest('/courses/my');
};

export const getCourseById = async (id) => {
    return await apiRequest(`/courses/${id}`);
};

export const createCourse = async (courseData) => {
    return await apiRequest('/courses', {
        method: 'POST',
        body: JSON.stringify(courseData)
    });
};

export const updateCourse = async (id, updates) => {
    return await apiRequest(`/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
};

export const deleteCourse = async (id) => {
    return await apiRequest(`/courses/${id}`, {
        method: 'DELETE'
    });
};

// ============ CONTENT ============

export const addContent = async (courseId, contentData) => {
    return await apiRequest(`/courses/${courseId}/contents`, {
        method: 'POST',
        body: JSON.stringify(contentData)
    });
};

export const updateContent = async (courseId, contentId, updates) => {
    return await apiRequest(`/courses/${courseId}/contents/${contentId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
};

export const deleteContent = async (courseId, contentId) => {
    return await apiRequest(`/courses/${courseId}/contents/${contentId}`, {
        method: 'DELETE'
    });
};

export const reorderContents = async (courseId, contentIds) => {
    return await apiRequest(`/courses/${courseId}/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ contentIds })
    });
};

// ============ STATS ============

export const getStats = async () => {
    return await apiRequest('/courses/admin/stats');
};

// ============ UPLOADS ============

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return await apiRequest('/uploads', {
        method: 'POST',
        body: formData
    });
};

// Upload with progress tracking
export const uploadFileWithProgress = (file, onProgress) => {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        const startTime = Date.now();
        let lastLoaded = 0;
        let lastTime = startTime;

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                const currentTime = Date.now();
                const timeDiff = (currentTime - lastTime) / 1000; // seconds
                const loadedDiff = e.loaded - lastLoaded;

                // Calculate speed (bytes per second)
                const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0;

                // Format speed
                let speedText;
                if (speed > 1024 * 1024) {
                    speedText = (speed / (1024 * 1024)).toFixed(1) + ' MB/s';
                } else if (speed > 1024) {
                    speedText = (speed / 1024).toFixed(1) + ' KB/s';
                } else {
                    speedText = Math.round(speed) + ' B/s';
                }

                lastLoaded = e.loaded;
                lastTime = currentTime;

                if (onProgress) {
                    onProgress({
                        percent,
                        speed: speedText,
                        loaded: e.loaded,
                        total: e.total,
                        fileName: file.name
                    });
                }
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    resolve(data);
                } catch {
                    reject(new Error('Invalid response'));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.message || 'Upload failed'));
                } catch {
                    reject(new Error('Upload failed'));
                }
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Network error'));
        });

        const token = getToken();
        const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
        xhr.open('POST', `${baseUrl}/uploads`);
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
    });
};

export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return await apiRequest('/uploads/avatar', {
        method: 'POST',
        body: formData
    });
};

export const deleteFile = async (filename) => {
    return await apiRequest(`/uploads/${filename}`, {
        method: 'DELETE'
    });
};

// Get full URL for uploaded file
export const getFileUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    // For local uploads, prepend server URL
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.PROD ? '' : 'http://localhost:5000');
    return `${baseUrl}${path}`;
};

// Get download URL (forces download instead of opening)
export const getDownloadUrl = (path, originalName = null) => {
    if (!path) return null;
    const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
    const filename = path.split('/').pop();
    let url = `${baseUrl}/uploads/download/${filename}`;
    if (originalName) {
        url += `?name=${encodeURIComponent(originalName)}`;
    }
    return url;
};
