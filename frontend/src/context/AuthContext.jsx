import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`);
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
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, { phone, password });
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
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
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
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, isLoggedIn: !!user, showAuthModal, setShowAuthModal }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
