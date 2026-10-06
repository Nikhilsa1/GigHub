import React from 'react';
import { Star, CheckCircle, TrendingUp, Clock, MessageSquare } from 'lucide-react';
import { COMMITMENT_LEVELS } from '../data/categories';

export default function CandidateCard({ applicant, user, rank, onSelect, onChat, isSelected, selectionMode }) {
    // Use user data if available, fall back to userSnapshot, or placeholder
    const displayUser = user || applicant.userSnapshot || {
        id: applicant.userId,
        name: 'User ' + applicant.userId,
        university: 'Unknown',
        avatar: '?',
        avatarColor: '#999',
        rating: 0,
        completedTasks: 0,
        trustScore: 50,
    };
    
    const commitment = COMMITMENT_LEVELS.find(c => c.id === applicant.commitment);

    return (
        <div style={{
            background: isSelected ? 'rgba(255,107,53,0.08)' : 'var(--bg-card)',
            border: `1px solid ${isSelected ? 'var(--accent-violet)' : 'var(--bg-glass-border)'}`,
            borderRadius: 'var(--radius-lg)', padding: '18px',
            transition: 'var(--transition)', position: 'relative',
        }}>
            {rank === 1 && (
                <div style={{
                    position: 'absolute', top: -10, right: 16,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: 'white', fontSize: 11, fontWeight: 700,
                    padding: '3px 10px', borderRadius: 'var(--radius-full)',
                }}>
                    🏆 Top Pick
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div className="avatar avatar-md" style={{ background: displayUser.avatarColor, color: 'white' }}>
                    {displayUser.avatar}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{displayUser.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{displayUser.university}</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#f59e0b' }}>
                            <Star size={11} fill="#f59e0b" />
                            {displayUser.rating > 0 ? displayUser.rating.toFixed(1) : 'New'}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>✓ {displayUser.completedTasks} tasks</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent-green)' }}>₹{applicant.bid}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>bid</div>
                </div>
            </div>

            {/* Message */}
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, fontStyle: 'italic', lineHeight: 1.5 }}>
                "{applicant.message}"
            </div>

            {/* Score bar */}
            <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {selectionMode === 'quality' ? 'Quality Score' : 'Value Score'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-violet)' }}>{applicant.score}/100</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${applicant.score}%` }} />
                </div>
            </div>

            {/* Commitment */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
                <span style={{
                    background: `${commitment?.color}20`, color: commitment?.color,
                    border: `1px solid ${commitment?.color}40`,
                    borderRadius: 'var(--radius-full)', padding: '3px 10px',
                    fontSize: 12, fontWeight: 600,
                }}>
                    {commitment?.icon} {commitment?.label}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>🛡️ Trust: {displayUser.trustScore}</span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
                {onChat && (
                    <button
                        onClick={onChat}
                        type="button"
                        className="btn btn-secondary"
                        style={{
                            flex: 1,
                            fontWeight: 700,
                            fontSize: 13,
                            background: 'rgba(255,107,53,0.12)',
                            border: '1px solid rgba(255,107,53,0.35)',
                            color: 'var(--accent-violet-light)',
                        }}
                    >
                        <MessageSquare size={15} /> Chat & Negotiate
                    </button>
                )}

                <button
                    onClick={onSelect}
                    type="button"
                    className={`btn ${isSelected ? 'btn-teal' : 'btn-primary'}`}
                    style={{ flex: onChat ? 1.2 : 1, fontWeight: 700, fontSize: 13 }}
                >
                    {isSelected ? '✓ Selected' : '👤 Select Candidate'}
                </button>
            </div>
        </div>
    );
}
