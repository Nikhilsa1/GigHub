import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Save, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TrustScoreBadge from '../components/TrustScoreBadge';
import { CATEGORIES } from '../data/categories';
import { isUserBanned, getBanTimeRemaining } from '../utils/trustEngine';

export default function Profile() {
    const { currentUser, updateCurrentUser } = useAuth();
    const [form, setForm] = useState({
        name: currentUser.name,
        university: currentUser.university || '',
        bio: currentUser.bio || '',
    });
    const [saved, setSaved] = useState(false);
    const banned = isUserBanned(currentUser);
    const banTime = banned ? getBanTimeRemaining(currentUser) : null;

    const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

    function handleSave() {
        updateCurrentUser(form);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    const successRate = currentUser.totalTasks > 0
        ? Math.round((currentUser.completedTasks / currentUser.totalTasks) * 100) : 0;

    return (
        <div className="page-container">
            <Sidebar />
            <main className="main-content">
                <div className="content-wrapper" style={{ maxWidth: 720 }}>
                    <div className="page-header">
                        <h1>Account Profile</h1>
                        <p>Manage your personal information and view your standing</p>
                    </div>

                    {/* Ban notice */}
                    {banned && (
                        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 24, fontSize: 14, color: '#fca5a5', display: 'flex', gap: 8, alignItems: 'center' }}>
                            🚫 <strong>Account temporarily banned</strong> — You cannot apply to tasks for {banTime}. This is due to repeated failure to complete committed tasks.
                        </div>
                    )}

                    {/* Red marks */}
                    {currentUser.redMarks > 0 && !banned && (
                        <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 24, fontSize: 14, color: '#fcd34d' }}>
                            ⚠ You have <strong>{currentUser.redMarks} red mark(s)</strong> on your profile. A further violation will result in a ban.
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                        {/* Edit profile */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Personal Info</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <div className="input-with-icon">
                                        <User size={15} className="input-icon" />
                                        <input className="form-input" value={form.name} onChange={set('name')} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">University</label>
                                    <div className="input-with-icon">
                                        <GraduationCap size={15} className="input-icon" />
                                        <input className="form-input" value={form.university} onChange={set('university')} placeholder="Your college/university" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bio</label>
                                    <textarea className="form-textarea" value={form.bio} onChange={set('bio')} rows={3} placeholder="Tell others about yourself..." />
                                </div>
                                <button onClick={handleSave} className={`btn ${saved ? 'btn-teal' : 'btn-primary'}`} style={{ alignSelf: 'flex-start' }}>
                                    <Save size={14} />{saved ? 'Saved!' : 'Save Changes'}
                                </button>
                            </div>
                        </div>

                        {/* Account summary */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="glass-card" style={{ padding: '20px' }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>TRUST SCORE</h3>
                                <TrustScoreBadge score={currentUser.trustScore} size="lg" />
                            </div>
                            <div className="glass-card" style={{ padding: '20px' }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>ACCOUNT STANDING</h3>
                                <div style={{
                                    background: 'rgba(16,185,129,0.12)',
                                    border: '1px solid rgba(16,185,129,0.3)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    color: '#6ee7b7',
                                    fontWeight: 600,
                                    fontSize: 12,
                                    marginBottom: 12
                                }}>
                                    <span>🛡️</span>
                                    <span>Verified {currentUser.university || 'Campus'} Student (.edu active)</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                                    {[
                                        ['Email', currentUser.email],
                                        ['Member Since', new Date(currentUser.createdAt).toLocaleDateString()],
                                        ['Tasks Completed', currentUser.completedTasks],
                                        ['Tasks Failed', currentUser.failedTasks || 0],
                                        ['Success Rate', `${successRate}%`],
                                        ['Total Earned', `₹${currentUser.totalEarned || 0}`],
                                        ['Penalties', currentUser.penalties || 0],
                                        ['Red Marks', currentUser.redMarks || 0],
                                    ].map(([label, value]) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bg-glass-border)' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                            <span style={{ fontWeight: 600 }}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Your Skills</h3>
                        {currentUser.skills?.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No skills added. Go to your Portfolio to add skills.</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                                {currentUser.skills?.map((skill, i) => {
                                    const cat = CATEGORIES.find(c => c.subfields?.includes(skill.name) || c.id === skill.name);
                                    return (
                                        <div key={i} style={{
                                            background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)',
                                            borderRadius: 'var(--radius-md)', padding: '10px 14px',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}>
                                            <span style={{ fontWeight: 600, fontSize: 13 }}>{skill.name}</span>
                                            <span style={{ color: 'var(--accent-amber)', fontSize: 12 }}>{'★'.repeat(Math.round(skill.rating))}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
