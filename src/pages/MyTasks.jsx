import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import TaskCard from '../components/TaskCard';
import DeadlineTimer from '../components/DeadlineTimer';
import Sidebar from '../components/Sidebar';
import { CATEGORIES } from '../data/categories';

export default function MyTasks() {
    const { currentUser } = useAuth();
    const { getUserTasks } = useData();
    const [tab, setTab] = useState('created');

    const currentUserId = String(currentUser?.id || currentUser?._id || '');
    const { created, applied, inProgress, completed } = getUserTasks(currentUserId);
    const allTasks = useData().getTasks();

    const appliedTasks = applied.map(t => ({
        ...t,
        myApplication: t.applicants?.find(a => String(a.userId || a.userSnapshot?.id || a.id) === currentUserId) || {
            bid: t.budget,
            commitment: 'full',
        },
    }));

    const tabs = [
        { id: 'created', label: 'Posted', count: created.length },
        { id: 'applied', label: 'Applied', count: appliedTasks.length },
        { id: 'inprogress', label: 'In Progress', count: inProgress.length },
        { id: 'completed', label: 'Completed', count: completed.length },
    ];

    return (
        <div className="page-container">
            <Sidebar />
            <main className="main-content">
                <div className="content-wrapper">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                        <div>
                            <h1 style={{ fontSize: 26, marginBottom: 4 }}>My Tasks</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage everything you've posted or applied to</p>
                        </div>
                        <Link to="/create-task" className="btn btn-primary">
                            <Plus size={15} />Post New Task
                        </Link>
                    </div>

                    {/* Tabs */}
                    <div className="tabs" style={{ marginBottom: 28 }}>
                        {tabs.map(t => (
                            <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                                {t.label} {t.count > 0 && <span style={{ fontSize: 11, background: tab === t.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-glass)', borderRadius: 10, padding: '1px 6px' }}>{t.count}</span>}
                            </button>
                        ))}
                    </div>

                    {/* Content per tab */}
                    {tab === 'created' && (
                        created.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📋</div>
                                <div className="empty-title">No tasks posted yet</div>
                                <div className="empty-desc">Post your first task and let students apply</div>
                                <Link to="/create-task" className="btn btn-primary btn-sm">Post a Task</Link>
                            </div>
                        ) : (
                            <div className="grid-auto">{created.map(t => <TaskCard key={t.id} task={t} />)}</div>
                        )
                    )}

                    {tab === 'applied' && (
                        appliedTasks.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🔍</div>
                                <div className="empty-title">Haven't applied anywhere yet</div>
                                <div className="empty-desc">Browse tasks and apply to get started</div>
                                <Link to="/discover" className="btn btn-primary btn-sm">Discover Tasks</Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {appliedTasks.map(t => {
                                    const cat = CATEGORIES.find(c => c.id === t.category);
                                    const isSelected = t.selectedApplicantId === currentUser.id;
                                    const isRejected = t.selectedApplicantId && !isSelected;
                                    return (
                                        <Link key={t.id} to={`/tasks/${t.id}`} style={{ textDecoration: 'none' }}>
                                            <div className="glass-card" style={{ padding: '18px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                                                <div style={{ fontSize: 24 }}>{cat?.icon || '📋'}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.title}</div>
                                                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                                        <span>Bid: ₹{t.myApplication?.bid}</span>
                                                        <span style={{ textTransform: 'capitalize' }}>Commitment: {t.myApplication?.commitment}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flex: 'column', gap: 8, alignItems: 'flex-end' }}>
                                                    {isSelected ? (
                                                        <span style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: 13 }}>✓ Selected!</span>
                                                    ) : isRejected ? (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Not selected</span>
                                                    ) : (
                                                        <span style={{ color: 'var(--accent-amber)', fontSize: 13 }}>⏳ Pending</span>
                                                    )}
                                                    <DeadlineTimer deadline={t.deadline} compact />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )
                    )}

                    {tab === 'inprogress' && (
                        inProgress.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">⚡</div>
                                <div className="empty-title">No active tasks</div>
                                <div className="empty-desc">Apply to tasks and get selected to see them here</div>
                            </div>
                        ) : (
                            <div className="grid-auto">{inProgress.map(t => <TaskCard key={t.id} task={t} />)}</div>
                        )
                    )}

                    {tab === 'completed' && (
                        completed.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🏆</div>
                                <div className="empty-title">No completed tasks yet</div>
                                <div className="empty-desc">Completed tasks build your portfolio and reputation</div>
                            </div>
                        ) : (
                            <div className="grid-auto">{completed.map(t => <TaskCard key={t.id} task={t} />)}</div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
}
