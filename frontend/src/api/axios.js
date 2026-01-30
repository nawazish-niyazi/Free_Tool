import axios from 'axios';

const getBaseURL = () => {
    const envUrl = import.meta.env.VITE_API_URL;

    // If we're on a mobile device or another computer, 'localhost' won't work.
    // We should use the hostname from the browser's address bar.
    const { hostname, protocol } = window.location;

    // If the browser is NOT on localhost/127.0.0.1, but the API URL is set to localhost
    // then we should automatically swap it to the current hostname.
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
            return `${protocol}//${hostname}:5000/api`;
        }
    }

    return envUrl || 'http://localhost:5000/api';
};

export const API_URL = getBaseURL();

const api = axios.create({
    baseURL: API_URL
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        // If it's an admin route, use adminToken, otherwise use regular token
        const isAdminRoute = config.url && config.url.includes('/admin');
        const token = isAdminRoute
            ? localStorage.getItem('adminToken')
            : localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;

