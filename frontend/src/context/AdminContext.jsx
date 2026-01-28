import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));
    const [adminLoading, setAdminLoading] = useState(true);

    useEffect(() => {
        if (adminToken) {
            // We use a different instance or just manage headers carefully
            // For now, let's store it separately
            verifyAdmin();
        } else {
            setAdmin(null);
            setAdminLoading(false);
        }
    }, [adminToken]);

    const verifyAdmin = async () => {
        try {
            // Since we don't have a 'me' for admin yet, we just check if token is valid via a ping
            const res = await api.get('/admin/dashboard', {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            if (res.data.success) {
                // If it succeeds, the token is valid. 
                // We should ideally have a /me endpoint, but for now we store what we have in localStorage
                const storedAdmin = JSON.parse(localStorage.getItem('adminUser'));
                setAdmin(storedAdmin);
            } else {
                adminLogout();
            }
        } catch (err) {
            console.error('Admin verify error:', err);
            adminLogout();
        } finally {
            setAdminLoading(false);
        }
    };

    const adminLogin = async (username, password) => {
        try {
            const res = await api.post('/admin/login', { username, password });
            if (res.data.success) {
                localStorage.setItem('adminToken', res.data.token);
                localStorage.setItem('adminUser', JSON.stringify(res.data.admin));
                setAdminToken(res.data.token);
                setAdmin(res.data.admin);
                return { success: true };
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Admin login failed'
            };
        }
    };

    const adminLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setAdminToken(null);
        setAdmin(null);
    };

    return (
        <AdminContext.Provider value={{ admin, adminToken, adminLoading, adminLogin, adminLogout, isAdminLoggedIn: !!admin }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => useContext(AdminContext);
