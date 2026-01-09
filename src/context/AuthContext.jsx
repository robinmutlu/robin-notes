import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/apiService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
        const loadUser = async () => {
            const token = localStorage.getItem('robinnotes-token') || sessionStorage.getItem('robinnotes-token');
            if (token) {
                try {
                    const userData = await api.getCurrentUser();
                    setUser(userData);
                } catch (error) {
                    // Token invalid, clear it
                    api.logout();
                }
            }
            setIsLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email, password, rememberMe = false) => {
        try {
            const data = await api.login(email, password, rememberMe);
            setUser(data.user);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (name, email, password) => {
        try {
            const data = await api.register(name, email, password);
            // If user is returned (first user), set it
            if (data.user) {
                setUser(data.user);
                return { success: true };
            }
            // Otherwise, email verification is required
            return {
                success: true,
                requiresVerification: true,
                message: data.message
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        api.logout();
        setUser(null);
    };

    const updateProfile = async (updates) => {
        try {
            const updatedUser = await api.updateUser(user.id, updates);
            setUser(updatedUser);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const refreshUser = async () => {
        try {
            const userData = await api.getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.warn('Could not refresh user:', error);
        }
    };

    // Check if user can upload (admin or has canUpload permission)
    const canUpload = user?.role === 'admin' || user?.canUpload === true;

    // Get avatar URL
    const getAvatarUrl = () => {
        if (!user) return null;
        return api.getFileUrl(user.avatar);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'admin',
            canUpload,
            getAvatarUrl,
            login,
            register,
            logout,
            updateProfile,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
