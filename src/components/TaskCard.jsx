import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Zap, Clock, IndianRupee } from 'lucide-react';
import DeadlineTimer from './DeadlineTimer';
import { CATEGORIES } from '../data/categories';

export default function TaskCard({ task, showApplyButton = true }) {
    const cat = CATEGORIES.find(c => c.id === task.category);
    const statusClass = {
        open: 'badge-open',
        in_progress: 'badge-in-progress',
        completed: 'badge-completed',
        cancelled: 'badge-cancelled',
    }[task.status] || 'badge-open';

    const statusLabel = {
        open: 'Open',
        in_progress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled',
    }[task.status] || 'Open';

    return (
        <Link to={`/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
            <div className="glass-card" style={{
                padding: '20px', cursor: 'pointer',
                borderLeft: `3px solid ${cat?.color || 'var(--accent-violet)'}`,
                transition: 'var(--transition)',
                position: 'relative', overflow: 'hidden',
            }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px ${cat?.color || 'var(--accent-violet)'}33`;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                }}
            >
                {/* Category glow */}
                <div style={{
                    position: 'absolute', top: -30, right: -30,
                    width: 80, height: 80, borderRadius: '50%',
                    background: cat?.color || 'var(--accent-violet)',
                    opacity: 0.07, filter: 'blur(20px)',
                    pointerEvents: 'none',
                }} />

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className={`badge ${statusClass}`}>{statusLabel}</span>
                        {task.urgent && <span className="badge badge-urgent"><Zap size={9} />Urgent</span>}
                    </div>
                    <div style={{ fontSize: 20 }}>{cat?.icon || '📋'}</div>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, lineHeight: 1.4, color: 'var(--text-primary)' }}>
                    {task.title}
                </h3>

                {/* Description */}
                <p style={{
                    fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                    {task.description}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    <span style={{
                        background: `${cat?.color || 'var(--accent-violet)'}20`,
                        color: cat?.color || 'var(--accent-violet)',
                        border: `1px solid ${cat?.color || 'var(--accent-violet)'}40`,
                        borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 12, fontWeight: 600,
                    }}>{cat?.label || task.category}</span>
                    <span style={{
                        background: task.scope === 'campus' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                        color: task.scope === 'campus' ? '#60a5fa' : '#c084fc',
                        border: `1px solid ${task.scope === 'campus' ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)'}`,
                        borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 12, fontWeight: 600,
                    }}>
                        {task.scope === 'campus' ? '🏫 Campus Only' : '🌐 Inter-College'}
                    </span>
                    {task.subfield && (
                        <span style={{
                            background: 'var(--bg-glass)', color: 'var(--text-muted)',
                            border: '1px solid var(--bg-glass-border)',
                            borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 12,
                        }}>{task.subfield}</span>
                    )}
                    <span style={{
                        background: 'rgba(16,185,129,0.1)', color: '#10b981',
                        border: '1px solid rgba(16,185,129,0.25)',
                        borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 12, fontWeight: 600
                    }}>
                        🔒 Escrow
                    </span>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-green)', fontWeight: 700, fontSize: 15 }}>
                            <IndianRupee size={13} />₹{task.budget}
                        </div>
                        {task.teamSize > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                                <Users size={12} />Team of {task.teamSize}
                            </div>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {task.applicants?.length || 0} applicant{task.applicants?.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <DeadlineTimer deadline={task.deadline} compact />
                </div>
            </div>
        </Link>
    );
}
