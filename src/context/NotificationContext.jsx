import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api, getToken } from '../utils/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [tick, setTick] = useState(0);

    function getKey() {
        return currentUser ? `gig_notifications_${currentUser.id}` : null;
    }

    const fetchNotifications = useCallback(async () => {
        const token = getToken();
        if (!token || !currentUser) {
            const key = getKey();
            if (key) setNotifications(JSON.parse(localStorage.getItem(key) || '[]'));
            return;
        }

        try {
            const items = await api.getNotifications();
            if (Array.isArray(items)) {
                setNotifications(items);
                const key = getKey();
                if (key) localStorage.setItem(key, JSON.stringify(items));
            }
        } catch (err) {
            const key = getKey();
            if (key) setNotifications(JSON.parse(localStorage.getItem(key) || '[]'));
        }
    }, [currentUser]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications, tick]);

    // Live push subscription
    useEffect(() => {
        const token = getToken();
        if (!token) return;

        const unsubscribe = api.subscribeToEvents((event) => {
            if (event.type === 'notification') {
                setNotifications(prev => [event.data, ...prev]);
            }
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    function getNotifications() {
        return notifications;
    }

    async function markAllRead() {
        try {
            await api.markAllNotificationsRead();
        } catch (e) {
            console.warn('API markAllRead failed:', e.message);
        }
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        const key = getKey();
        if (key) localStorage.setItem(key, JSON.stringify(notifications.map(n => ({ ...n, read: true }))));
        setTick(t => t + 1);
    }

    async function markRead(notificationId) {
        try {
            await api.markNotificationRead(notificationId);
        } catch (e) {
            console.warn('API markRead failed:', e.message);
        }
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
        const key = getKey();
        if (key) localStorage.setItem(key, JSON.stringify(notifications.map(n => n.id === notificationId ? { ...n, read: true } : n)));
        setTick(t => t + 1);
    }

    async function clearAll() {
        try {
            await api.clearAllNotifications();
        } catch (e) {
            console.warn('API clearAll failed:', e.message);
        }
        setNotifications([]);
        const key = getKey();
        if (key) localStorage.setItem(key, '[]');
        setTick(t => t + 1);
    }

    function addNotification(notification) {
        const item = { ...notification, id: 'n' + Date.now(), read: false, createdAt: Date.now() };
        setNotifications(prev => [item, ...prev]);
        const key = getKey();
        if (key) {
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.unshift(item);
            localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
        }
        setTick(t => t + 1);
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            getNotifications,
            markAllRead,
            markRead,
            clearAll,
            addNotification,
            unreadCount,
            tick,
            fetchNotifications,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationContext);
}
