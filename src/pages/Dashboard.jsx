import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Briefcase, Star, IndianRupee, Bell, Plus, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { recommendTasksForUser } from '../utils/recommender';
import TaskCard from '../components/TaskCard';
import TrustScoreBadge from '../components/TrustScoreBadge';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
    const { currentUser } = useAuth();
    const { getTasks, getUserTasks } = useData();

    const tasks = getTasks();
    const userTasks = getUserTasks(currentUser.id);
    const recommended = useMemo(() => recommendTasksForUser(currentUser, tasks).slice(0, 6), [currentUser, tasks]);
    const urgentTasks = tasks.filter(t => t.urgent && t.status === 'open' && t.creatorId !== currentUser.id).slice(0, 3);

    const stats = [
        { icon: <Briefcase size={20} />, label: 'Tasks Done', value: currentUser.completedTasks, color: 'var(--accent-violet)' },
        { icon: <IndianRupee size={20} />, label: 'Total Earned', value: `₹${currentUser.totalEarned || 0}`, color: 'var(--accent-green)' },
        { icon: <Star size={20} />, label: 'Avg Rating', value: currentUser.rating > 0 ? `${currentUser.rating}★` : 'New', color: 'var(--accent-amber)' },
        { icon: <TrendingUp size={20} />, label: 'Success Rate', value: currentUser.totalTasks > 0 ? `${Math.round((currentUser.completedTasks / currentUser.totalTasks) * 100)}%` : '—', color: 'var(--accent-teal)' },
    ];

    return (
        <div className="page-container">
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundImage: "url('/landing-bg.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: 'blur(2.5px) saturate(78%) brightness(76%)',
                    transform: 'scale(1.05)',
                    opacity: 0.56,
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.30)',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />
            <Sidebar />
            <main className="main-content">
                <div className="content-wrapper">
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <h1 style={{ fontSize: 28, marginBottom: 4 }}>
                                Hey, {currentUser.name.split(' ')[0]}! 👋
                            </h1>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {currentUser.university || 'Student'} · Welcome to your dashboard
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Link to="/create-task" className="btn btn-primary">
                                <Plus size={16} />Post a Task
                            </Link>
                            <Link to="/discover" className="btn btn-secondary">
                                Discover Tasks
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid-4" style={{ marginBottom: 32 }}>
                        {stats.map((s, i) => (
                            <div key={i} className="glass-card" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ color: s.color, background: `${s.color}1A`, padding: 10, borderRadius: 'var(--radius-md)' }}>{s.icon}</div>
                                </div>
                                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Outfit', marginBottom: 4 }}>{s.value}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Trust Score */}
                    <div className="glass-card" style={{ padding: '24px', marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Your Trust Score</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                {currentUser.redMarks > 0 ? `⚠ ${currentUser.redMarks} red mark(s) on your profile` : 'Keep completing tasks to improve your score'}
                            </p>
                            {currentUser.penalties > 0 && (
                                <p style={{ color: 'var(--warning)', fontSize: 12, marginTop: 4 }}>
                                    {currentUser.penalties} penalty/penalties recorded
                                </p>
                            )}
                        </div>
                        <TrustScoreBadge score={currentUser.trustScore} size="lg" />
                    </div>

                    {/* Urgent tasks */}
                    {urgentTasks.length > 0 && (
                        <div style={{ marginBottom: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <Zap size={18} color="var(--danger)" fill="var(--danger)" />
                                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Urgent Opportunities</h2>
                                <span className="badge badge-urgent">{urgentTasks.length}</span>
                            </div>
                            <div className="grid-3">
                                {urgentTasks.map(t => <TaskCard key={t.id} task={t} />)}
                            </div>
                        </div>
                    )}

                    {/* Recommended */}
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Recommended for You</h2>
                        <Link to="/discover" className="btn btn-ghost btn-sm">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    {recommended.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🔍</div>
                            <div className="empty-title">No recommendations yet</div>
                            <div className="empty-desc">Complete your profile and add skills to get personalized task recommendations</div>
                            <Link to="/profile" className="btn btn-primary btn-sm">Update Profile</Link>
                        </div>
                    ) : (
                        <div className="grid-auto">
                            {recommended.map(t => <TaskCard key={t.id} task={t} />)}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
