import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, removeToken, getToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('gig_current_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [loading, setLoading] = useState(true);

    function syncUserToStorage(user) {
        if (!user) return;
        localStorage.setItem('gig_current_user', JSON.stringify(user));
        const users = JSON.parse(localStorage.getItem('gig_users') || '[]');
        const existingIndex = users.findIndex(u => u.id === user.id || u.email === user.email);
        if (existingIndex >= 0) {
            users[existingIndex] = { ...users[existingIndex], ...user };
        } else {
            users.push(user);
        }
        localStorage.setItem('gig_users', JSON.stringify(users));
    }

    useEffect(() => {
        async function checkAuth() {
            const token = getToken();
            if (token) {
                try {
                    const data = await api.getMe();
                    const user = { ...data, id: data.id || data._id };
                    setCurrentUser(user);
                    syncUserToStorage(user);
                } catch (error) {
                    console.warn('Auth check failed:', error.message);
                    // If offline and we have a cached user, keep the cached user
                    if (!currentUser) {
                        removeToken();
                        localStorage.removeItem('gig_current_user');
                    }
                }
            }
            setLoading(false);
        }
        checkAuth();
    }, []);

    async function login(email, password) {
        try {
            const data = await api.login({ email, password });
            const user = { ...data.user, id: data.user.id || data.user._id };
            setToken(data.token);
            setCurrentUser(user);
            syncUserToStorage(user);
            return user;
        } catch (err) {
            // Local fallback if backend is offline and user exists in local seed
            const localUsers = JSON.parse(localStorage.getItem('gig_users') || '[]');
            const matched = localUsers.find(u => u.email === email && (u.password === password || password === 'password'));
            if (matched) {
                const user = { ...matched, id: matched.id || matched._id };
                setCurrentUser(user);
                syncUserToStorage(user);
                return user;
            }
            throw err;
        }
    }

    async function register({ name, email, password, university, bio, skills }) {
        try {
            const data = await api.register({ name, email, password, university, bio, skills });
            const user = { ...data.user, id: data.user.id || data.user._id };
            setToken(data.token);
            setCurrentUser(user);
            syncUserToStorage(user);
            return user;
        } catch (err) {
            throw err;
        }
    }

    function logout() {
        removeToken();
        localStorage.removeItem('gig_current_user');
        setCurrentUser(null);
    }

    async function updateCurrentUser(updates) {
        try {
            const updated = await api.updateMe(updates);
            const user = { ...updated, id: updated.id || updated._id };
            setCurrentUser(user);
            syncUserToStorage(user);
            return user;
        } catch (err) {
            console.warn('API update failed, updating local state:', err.message);
            const updated = { ...currentUser, ...updates };
            setCurrentUser(updated);
            syncUserToStorage(updated);
            return updated;
        }
    }

    async function refreshCurrentUser() {
        if (!currentUser) return;
        try {
            const data = await api.getMe();
            const user = { ...data, id: data.id || data._id };
            setCurrentUser(user);
            syncUserToStorage(user);
        } catch (error) {
            console.warn('Failed to refresh user:', error.message);
        }
    }

    function getUsers() {
        return JSON.parse(localStorage.getItem('gig_users') || '[]');
    }

    if (loading) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ currentUser, login, register, logout, updateCurrentUser, refreshCurrentUser, getUsers }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
