import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, ArrowRight, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/categories';

export default function Auth() {
    const [searchParams] = useSearchParams();
    const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register, currentUser } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '', email: '', password: '', university: '', bio: '',
        skills: [],
    });
    const [skillInput, setSkillInput] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => { if (currentUser) navigate('/dashboard'); }, [currentUser]);

    const set = (field) => (e) => { setForm(f => ({ ...f, [field]: e.target.value })); setError(''); };

    function addSkill() {
        const skill = skillInput.trim();
        if (!skill) return;
        if (!form.skills.find(s => s.name.toLowerCase() === skill.toLowerCase())) {
            setForm(f => ({ ...f, skills: [...f.skills, { name: skill, rating: 3.0 }] }));
        }
        setSkillInput('');
    }

    function removeSkill(name) {
        setForm(f => ({ ...f, skills: f.skills.filter(s => s.name !== name) }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (mode === 'login') {
                await login(form.email, form.password);
            } else {
                if (form.name.length < 2) throw new Error('Please enter your full name');
                if (!form.email.includes('@')) throw new Error('Please enter a valid email');
                if (form.password.length < 6) throw new Error('Password must be at least 6 characters');
                await register(form);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-primary)', padding: '40px 20px', position: 'relative', overflow: 'hidden',
        }}>
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
            {/* Glow */}
            <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, borderRadius: '50%', background: 'var(--accent-violet)', opacity: 0.06, filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />

            <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                        <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 22 }}>GigHub</span>
                    </Link>
                    <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>Student Micro-Gig Platform</p>
                </div>

                <div className="glass-card" style={{ padding: '36px' }}>
                    {/* Tabs */}
                    <div className="tabs" style={{ marginBottom: 28 }}>
                        <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
                        <button className={`tab-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>Create Account</button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {mode === 'register' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <div className="input-with-icon">
                                        <User size={16} className="input-icon" />
                                        <input className="form-input" placeholder="Arjun Sharma" value={form.name} onChange={set('name')} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">University / College</label>
                                    <div className="input-with-icon">
                                        <GraduationCap size={16} className="input-icon" />
                                        <input className="form-input" placeholder="IIT Delhi" value={form.university} onChange={set('university')} />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <div className="input-with-icon">
                                <Mail size={16} className="input-icon" />
                                <input type="email" className="form-input" placeholder="you@student.edu" value={form.email} onChange={set('email')} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-with-icon" style={{ position: 'relative' }}>
                                <Lock size={16} className="input-icon" />
                                <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="••••••" value={form.password} onChange={set('password')} required style={{ paddingRight: 42 }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {mode === 'register' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Bio (optional)</label>
                                    <textarea className="form-textarea" placeholder="Tell others about your skills and interests..." value={form.bio} onChange={set('bio')} rows={2} style={{ minHeight: 'auto' }} />
                                </div>

                                {/* Skills */}
                                <div className="form-group">
                                    <label className="form-label">Your Skills</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <select className="form-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ flex: 1 }}>
                                            <option value="">Select category...</option>
                                            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                        </select>
                                    </div>
                                    {selectedCategory && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                             {CATEGORIES.find(c => c.id === selectedCategory)?.subfields.map(sf => (
                                                <button key={sf} type="button" style={{
                                                    padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: 12,
                                                    background: form.skills.find(s => s.name === sf) ? 'var(--accent-violet)' : 'var(--bg-glass)',
                                                    color: form.skills.find(s => s.name === sf) ? 'white' : 'var(--text-secondary)',
                                                    border: '1px solid var(--bg-glass-border)', cursor: 'pointer',
                                                }} onClick={() => {
                                                    const exists = form.skills.find(s => s.name === sf);
                                                    if (exists) removeSkill(sf);
                                                    else setForm(f => ({ ...f, skills: [...f.skills, { name: sf, rating: 3.0 }] }));
                                                }}>
                                                    {form.skills.find(s => s.name === sf) ? '✓ ' : ''}{sf}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {form.skills.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                            {form.skills.map(s => (
                                                <span key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,107,53,0.15)', color: 'var(--accent-violet-light)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 'var(--radius-full)', padding: '4px 10px', fontSize: 12 }}>
                                                    {s.name}
                                                    <button type="button" onClick={() => removeSkill(s.name)} style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', lineHeight: 1, padding: 0 }}><X size={11} /></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {error && (
                            <div style={{ color: 'var(--danger)', fontSize: 13, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.3)' }}>
                                ⚠ {error}
                            </div>
                        )}

                        {mode === 'login' && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Demo: <code>arjun@student.edu</code> / <code>password</code>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 4 }}>
                            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Loading...</> : mode === 'login' ? <>Sign In <ArrowRight size={16} /></> : <>Create Account <ArrowRight size={16} /></>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
