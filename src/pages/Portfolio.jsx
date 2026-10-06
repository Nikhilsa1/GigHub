import React, { useState } from 'react';
import { Star, ExternalLink, Plus, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import TrustScoreBadge from '../components/TrustScoreBadge';
import Sidebar from '../components/Sidebar';
import { CATEGORIES } from '../data/categories';

export default function Portfolio() {
    const { currentUser, updateCurrentUser } = useAuth();
    const { getUserTasks, getUserReviews } = useData();
    const [editing, setEditing] = useState(false);
    const [newLink, setNewLink] = useState('');
    const [form, setForm] = useState({ bio: currentUser.bio || '', links: [...(currentUser.links || [])] });

    const userTasks = getUserTasks(currentUser.id);
    const reviews = getUserReviews(currentUser.id);
    const successRate = currentUser.totalTasks > 0
        ? Math.round((currentUser.completedTasks / currentUser.totalTasks) * 100) : 0;

    function saveProfile() {
        updateCurrentUser({ bio: form.bio, links: form.links });
        setEditing(false);
    }

    function addLink() {
        const url = newLink.trim();
        if (!url) return;
        setForm(f => ({ ...f, links: [...f.links, url] }));
        setNewLink('');
    }

    function removeLink(i) {
        setForm(f => ({ ...f, links: f.links.filter((_, idx) => idx !== i) }));
    }

    const starCount = reviews.length > 0
        ? Array.from({ length: 5 }, (_, i) => reviews.filter(r => Math.round(r.rating) === i + 1).length)
        : [];

    return (
        <div className="page-container">
            <Sidebar />
            <main className="main-content">
                <div className="content-wrapper">
                    {/* Profile Hero */}
                    <div className="glass-card" style={{ padding: '32px', marginBottom: 24, display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div className="avatar avatar-xl" style={{ background: currentUser.avatarColor, color: 'white' }}>
                            {currentUser.avatar}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                                <div>
                                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{currentUser.name}</h1>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>🎓 {currentUser.university || 'Student'}</div>
                                </div>
                                <button onClick={() => setEditing(!editing)} className={`btn btn-sm ${editing ? 'btn-danger' : 'btn-secondary'}`}>
                                    {editing ? <><X size={14} />Cancel</> : '✏️ Edit Profile'}
                                </button>
                            </div>

                            {editing ? (
                                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <textarea className="form-textarea" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Write your bio..." rows={2} style={{ minHeight: 'auto' }} />
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input className="form-input" value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="Add portfolio link (GitHub, Drive, etc.)" onKeyDown={e => e.key === 'Enter' && addLink()} />
                                        <button onClick={addLink} className="btn btn-secondary btn-sm"><Plus size={14} /></button>
                                    </div>
                                    {form.links.map((link, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--accent-teal)' }}>
                                            <ExternalLink size={13} />
                                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
                                            <button onClick={() => removeLink(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={13} /></button>
                                        </div>
                                    ))}
                                    <button onClick={saveProfile} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                                        <CheckCircle size={14} />Save Changes
                                    </button>
                                </div>
                            ) : (
                                <div style={{ marginTop: 8 }}>
                                    {currentUser.bio && <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{currentUser.bio}</p>}
                                    {currentUser.links?.length > 0 && (
                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            {currentUser.links.map((link, i) => (
                                                <a key={i} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer"
                                                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(220,38,38,0.1)', color: 'var(--accent-teal)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: 12, fontWeight: 500 }}>
                                                    <ExternalLink size={11} />
                                                    {link.replace(/^https?:\/\//, '').slice(0, 30)}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid-4" style={{ marginBottom: 24 }}>
                        {[
                            { label: 'Tasks Completed', value: currentUser.completedTasks, color: 'var(--accent-violet)' },
                            { label: 'Total Earned', value: `₹${currentUser.totalEarned || 0}`, color: 'var(--accent-green)' },
                            { label: 'Success Rate', value: `${successRate}%`, color: 'var(--accent-teal)' },
                            { label: 'Avg Rating', value: currentUser.rating > 0 ? `${currentUser.rating}★` : 'New', color: 'var(--accent-amber)' },
                        ].map((s, i) => (
                            <div key={i} className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Outfit', color: s.color, marginBottom: 4 }}>{s.value}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {/* Skills */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Skills</h3>
                            {currentUser.skills?.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No skills added yet. Edit your profile to add skills.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {currentUser.skills?.map((skill, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
                                                <span style={{ fontWeight: 600 }}>{skill.name}</span>
                                                <span style={{ color: 'var(--accent-amber)' }}>{'★'.repeat(Math.round(skill.rating))}{'☆'.repeat(5 - Math.round(skill.rating))}</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${(skill.rating / 5) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Trust + Reviews */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Trust & Reputation</h3>
                            <TrustScoreBadge score={currentUser.trustScore} size="lg" />
                            {currentUser.redMarks > 0 && (
                                <div style={{ marginTop: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, color: '#fca5a5' }}>
                                    🔴 {currentUser.redMarks} red mark(s) — may affect task selection
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reviews */}
                    {reviews.length > 0 && (
                        <div className="glass-card" style={{ padding: '24px', marginTop: 24 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Reviews ({reviews.length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {reviews.map(r => (
                                    <div key={r.id} style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--bg-glass-border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <div style={{ color: 'var(--accent-amber)', letterSpacing: 2 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>"{r.feedback}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed tasks gallery */}
                    {userTasks.completed.length > 0 && (
                        <div className="glass-card" style={{ padding: '24px', marginTop: 24 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Completed Work ({userTasks.completed.length})</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                                {userTasks.completed.map(task => {
                                    const cat = CATEGORIES.find(c => c.id === task.category);
                                    return (
                                        <div key={task.id} style={{
                                            background: 'var(--bg-glass)', border: `1px solid ${cat?.color || 'var(--bg-glass-border)'}40`,
                                            borderRadius: 'var(--radius-md)', padding: '14px',
                                        }}>
                                            <div style={{ fontSize: 20, marginBottom: 6 }}>{cat?.icon || '✓'}</div>
                                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{task.title}</div>
                                            <div style={{ fontSize: 12, color: 'var(--accent-green)' }}>₹{task.applicants.find(a => a.userId === currentUser.id)?.bid || task.budget}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
