import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        // Token managed via interceptor in api/axios.js
        fetchUser();

    }, [token]);

    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/me');
            if (res.data.success) {
                setUser(res.data.user);
            } else {
                logout();
            }
        } catch (err) {
            console.error('Fetch user error:', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (phone, password) => {
        try {
            const res = await api.post('/auth/login', { phone, password });
            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                setToken(res.data.token);
                setUser(res.data.user);
                return { success: true };
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (name, phone, password, email) => {
        try {
            const res = await api.post('/auth/register', {
                name,
                phone,
                password,
                email
            });
            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                setToken(res.data.token);
                setUser(res.data.user);
                return { success: true };
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        api.defaults.headers.common['Authorization'] = '';
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, isLoggedIn: !!user, showAuthModal, setShowAuthModal }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
