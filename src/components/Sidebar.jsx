import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Search, Plus, Briefcase, User,
    Bell, ShieldCheck, LogOut, ChevronRight, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const NAV_ITEMS = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/discover', icon: Search, label: 'Discover Tasks' },
    { to: '/create-task', icon: Plus, label: 'Post a Task' },
    { to: '/my-tasks', icon: Briefcase, label: 'My Tasks' },
    { to: '/portfolio', icon: Star, label: 'Portfolio' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
    { to: '/admin', icon: ShieldCheck, label: 'Admin Panel' },
];

export default function Sidebar() {
    const { currentUser, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--bg-glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>GigHub</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Student Micro-Gigs</div>
                    </div>
                </div>
            </div>

            {/* User info */}
            {currentUser && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-md" style={{ background: currentUser.avatarColor, color: 'white' }}>
                            {currentUser.avatar}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {currentUser.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                ⭐ {currentUser.rating > 0 ? currentUser.rating.toFixed(1) : 'New'} · 🛡️ {currentUser.trustScore}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav style={{ flex: 1, padding: '12px 12px' }}>
                {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => (
                    <NavLink
                        key={to}
                        to={to}
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 'var(--radius-md)',
                            marginBottom: 2, transition: 'var(--transition)',
                            color: isActive ? 'white' : 'var(--text-secondary)',
                            background: isActive ? 'linear-gradient(135deg, var(--accent-violet), #dc2626)' : 'transparent',
                            fontWeight: isActive ? 600 : 400, fontSize: 14,
                            boxShadow: isActive ? '0 4px 12px var(--accent-violet-glow)' : 'none',
                            textDecoration: 'none',
                        })}
                    >
                        <Icon size={17} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{label}</span>
                        {badge && unreadCount > 0 && (
                            <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div style={{ padding: '12px', borderTop: '1px solid var(--bg-glass-border)' }}>
                <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 10, color: 'var(--danger)' }}>
                    <LogOut size={17} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
