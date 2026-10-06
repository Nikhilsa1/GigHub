import React, { useState } from 'react';
import { Shield, XCircle, CheckCircle, User, RefreshCw, Scale, AlertTriangle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { api } from '../utils/api';
import Sidebar from '../components/Sidebar';
import { CATEGORIES } from '../data/categories';

export default function AdminPanel() {
    const { getTasks, getUsers, refresh, fetchData } = useData();
    const [activeTab, setActiveTab] = useState('disputes');
    const [resolvingId, setResolvingId] = useState(null);
    const [splitPct, setSplitPct] = useState(50);
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const tasks = getTasks();
    const users = getUsers();

    const disputes = tasks.filter(t => t.cancelled || (t.status === 'cancelled' && !t.disputeResolved));
    const incomplete = tasks.filter(t => !t.approved && !t.cancelled && t.deadline < Date.now() && t.status === 'in_progress');
    const allUsers = [...users].sort((a, b) => (b.redMarks || 0) - (a.redMarks || 0));

    function getUser(id) { return users.find(u => u.id === id); }

    const tabs = [
        { id: 'disputes', label: 'Disputes & Escrow', count: disputes.filter(d => !d.disputeResolved).length },
        { id: 'overdue', label: 'Overdue Tasks', count: incomplete.length },
        { id: 'users', label: 'Users & Penalties', count: allUsers.filter(u => u.redMarks > 0 || (u.bannedUntil && u.bannedUntil > Date.now())).length },
    ];

    async function handleResolve(taskId, percentage) {
        setLoading(true);
        try {
            await api.resolveDispute(taskId, percentage);
            setSuccessMsg(`Dispute resolved! ${percentage}% split processed.`);
            setResolvingId(null);
            fetchData();
            refresh();
            setTimeout(() => setSuccessMsg(''), 3500);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleUnban(userId) {
        setLoading(true);
        try {
            await api.unbanUser(userId);
            setSuccessMsg('User ban lifted successfully.');
            fetchData();
            refresh();
            setTimeout(() => setSuccessMsg(''), 3500);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page-container">
            <Sidebar />
            <main className="main-content">
                <div className="content-wrapper">
                    <div className="page-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Shield size={28} color="var(--accent-violet)" />
                            <div>
                                <h1 style={{ fontSize: 26 }}>Admin Governance Panel</h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Escrow mediation, penalty management & conflict arbitration</p>
                            </div>
                        </div>
                    </div>

                    {successMsg && (
                        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20 }}>
                            ✓ {successMsg}
                        </div>
                    )}

                    {/* Warning banner */}
                    <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#fcd34d' }}>
                        ⚖️ Admin actions trigger automated ledger updates, escrow fund distribution, and user reputation recalculation.
                    </div>

                    <div className="tabs" style={{ marginBottom: 24 }}>
                        {tabs.map(t => (
                            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                                {t.label}{t.count > 0 && <span style={{ marginLeft: 6, background: t.count > 0 ? 'rgba(239,68,68,0.3)' : 'var(--bg-glass)', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>{t.count}</span>}
                            </button>
                        ))}
                    </div>

                    {/* Disputes */}
                    {activeTab === 'disputes' && (
                        disputes.length === 0 ? (
                            <div className="empty-state"><div className="empty-icon">✅</div><div className="empty-title">No active disputes</div></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {disputes.map(task => {
                                    const creator = getUser(task.creatorId);
                                    const worker = task.selectedApplicantId ? getUser(task.selectedApplicantId) : null;
                                    const cat = CATEGORIES.find(c => c.id === task.category);
                                    const isResolved = task.disputeResolved;

                                    return (
                                        <div key={task.id} className="glass-card" style={{ padding: '24px', borderLeft: isResolved ? '4px solid var(--accent-green)' : '4px solid var(--danger)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{task.title}</div>
                                                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                                        {cat?.icon} {cat?.label} · Budget: ₹{task.budget} · Escrow Held: ₹{task.escrowAmount || task.budget}
                                                    </div>
                                                </div>
                                                <span className={`badge ${isResolved ? 'badge-completed' : 'badge-cancelled'}`}>
                                                    {isResolved ? 'Resolved' : 'Pending Review'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 20, fontSize: 13, marginBottom: 16, flexWrap: 'wrap' }}>
                                                <div>
                                                    <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Task Poster</div>
                                                    <div style={{ fontWeight: 600 }}>{creator?.name || 'Unknown'}</div>
                                                </div>
                                                {worker && (
                                                    <div>
                                                        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Assigned Worker</div>
                                                        <div style={{ fontWeight: 600 }}>{worker.name}</div>
                                                    </div>
                                                )}
                                                {task.cancellationReason && (
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Reason</div>
                                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{task.cancellationReason}</div>
                                                    </div>
                                                )}
                                            </div>

                                            {!isResolved ? (
                                                <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--bg-glass-border)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontWeight: 600, fontSize: 14 }}>
                                                        <Scale size={16} color="var(--accent-violet)" />
                                                        Arbitrate Escrow Payout Split:
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                                        <button disabled={loading} onClick={() => handleResolve(task.id, 50)} className="btn btn-secondary btn-sm">
                                                            ⚖️ 50% Worker / 50% Client
                                                        </button>
                                                        <button disabled={loading} onClick={() => handleResolve(task.id, 100)} className="btn btn-teal btn-sm">
                                                            ✓ 100% Worker (Full Payout)
                                                        </button>
                                                        <button disabled={loading} onClick={() => handleResolve(task.id, 0)} className="btn btn-danger btn-sm">
                                                            ↩️ 100% Client (Full Refund)
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ color: 'var(--accent-green)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <CheckCircle size={15} /> Escrow distribution finalized.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}

                    {/* Overdue tasks */}
                    {activeTab === 'overdue' && (
                        incomplete.length === 0 ? (
                            <div className="empty-state"><div className="empty-icon">✅</div><div className="empty-title">No overdue tasks</div></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {incomplete.map(task => {
                                    const creator = getUser(task.creatorId);
                                    const worker = getUser(task.selectedApplicantId);
                                    return (
                                        <div key={task.id} className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--warning)' }}>
                                            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{task.title}</div>
                                            <div style={{ display: 'flex', gap: 16, fontSize: 13, flexWrap: 'wrap', marginBottom: 12 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Poster: <strong style={{ color: 'var(--text-primary)' }}>{creator?.name}</strong></span>
                                                <span style={{ color: 'var(--text-muted)' }}>Worker: <strong style={{ color: 'var(--text-primary)' }}>{worker?.name || 'Unassigned'}</strong></span>
                                                <span style={{ color: 'var(--danger)' }}>Deadline: {new Date(task.deadline).toLocaleString()}</span>
                                                <span style={{ color: 'var(--text-muted)' }}>Budget: ₹{task.budget}</span>
                                            </div>
                                            <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, color: '#fcd34d', border: '1px solid rgba(245,158,11,0.3)' }}>
                                                ⚠ This task has passed its deadline without completion. Admin can arbitrate or contact parties.
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}

                    {/* Users */}
                    {activeTab === 'users' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {allUsers.map(user => (
                                <div key={user.id} className="glass-card" style={{ padding: '18px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', borderLeft: user.redMarks > 0 ? '3px solid var(--danger)' : '3px solid var(--bg-glass-border)' }}>
                                    <div className="avatar avatar-md" style={{ background: user.avatarColor, color: 'white' }}>{user.avatar}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 2 }}>{user.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email} · {user.university}</div>
                                        <div style={{ fontSize: 12, marginTop: 4, display: 'flex', gap: 12 }}>
                                            <span>Tasks: {user.completedTasks}/{user.totalTasks}</span>
                                            <span style={{ color: user.redMarks > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                                Red marks: {user.redMarks || 0}
                                            </span>
                                            <span>Penalties: {user.penalties || 0}</span>
                                            <span>Trust: {user.trustScore}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                        {user.bannedUntil && user.bannedUntil > Date.now() ? (
                                            <>
                                                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                                                    🚫 Banned until {new Date(user.bannedUntil).toLocaleDateString()}
                                                </span>
                                                <button disabled={loading} onClick={() => handleUnban(user.id)} className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '4px 10px' }}>
                                                    Lift Suspension
                                                </button>
                                            </>
                                        ) : (
                                            <span style={{ color: user.redMarks > 0 ? 'var(--warning)' : 'var(--accent-green)' }}>
                                                {user.redMarks > 0 ? '⚠ Flagged' : '✓ Clean'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
