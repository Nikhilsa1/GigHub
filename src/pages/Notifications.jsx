import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useNotifications } from '../context/NotificationContext';

const NOTIF_ICONS = {
    application: '📬',
    selected: '🎉',
    update: '📝',
    reminder: '⏰',
    default: '🔔',
};

export default function Notifications() {
    const { getNotifications, markAllRead, markRead, clearAll } = useNotifications();
    const notifications = getNotifications();
    const unread = notifications.filter(n => !n.read).length;

    return (
        <div className="page-container">
            <Sidebar />
            <main className="main-content">
                <div className="content-wrapper" style={{ maxWidth: 700 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                        <div>
                            <h1 style={{ fontSize: 26, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Bell size={24} />Notifications
                                {unread > 0 && <span className="notif-badge">{unread}</span>}
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Stay updated on your tasks and applications</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {unread > 0 && <button onClick={markAllRead} className="btn btn-secondary btn-sm"><CheckCheck size={14} />Mark all read</button>}
                            {notifications.length > 0 && <button onClick={clearAll} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={14} />Clear all</button>}
                        </div>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🔔</div>
                            <div className="empty-title">All caught up!</div>
                            <div className="empty-desc">You'll see task updates, application alerts, and reminders here</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {notifications.map(n => (
                                <div key={n.id}
                                    onClick={() => markRead(n.id)}
                                    style={{
                                        background: n.read ? 'var(--bg-card)' : 'rgba(255,107,53,0.08)',
                                        border: `1px solid ${n.read ? 'var(--bg-glass-border)' : 'rgba(255,107,53,0.3)'}`,
                                        borderRadius: 'var(--radius-md)', padding: '16px', cursor: 'pointer',
                                        transition: 'var(--transition)', display: 'flex', gap: 14, alignItems: 'flex-start',
                                    }}
                                >
                                    <div style={{ fontSize: 22, flexShrink: 0 }}>{NOTIF_ICONS[n.type] || NOTIF_ICONS.default}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: n.read ? 400 : 600, fontSize: 14, marginBottom: 4 }}>{n.message}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleString()}</div>
                                        {n.taskId && (
                                            <Link to={`/tasks/${n.taskId}`} onClick={e => e.stopPropagation()}
                                                style={{ fontSize: 12, color: 'var(--accent-teal)', marginTop: 4, display: 'inline-block' }}>
                                                View Task →
                                            </Link>
                                        )}
                                    </div>
                                    {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-violet)', flexShrink: 0, marginTop: 4 }} />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
