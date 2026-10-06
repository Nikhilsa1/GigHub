import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Plus, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Sidebar from '../components/Sidebar';
import { CATEGORIES, EXPERIENCE_LEVELS } from '../data/categories';

const STEPS = ['Category', 'Details', 'Budget & Deadline', 'Review'];

export default function CreateTask() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { createTask } = useData();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        category: '', subfield: '', title: '', description: '',
        budget: '', deadline: '', experienceLevel: 'beginner',
        teamSize: 1, urgent: false, scope: 'campus',
    });
    const [error, setError] = useState('');

    const set = (field) => (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm(f => ({ ...f, [field]: val, ...(field === 'category' ? { subfield: '' } : {}) }));
        setError('');
    };

    const selectedCat = CATEGORIES.find(c => c.id === form.category);

    function validate() {
        if (step === 0 && !form.category) { setError('Select a category'); return false; }
        if (step === 1) {
            if (!form.title.trim()) { setError('Enter a task title'); return false; }
            if (form.title.length < 10) { setError('Title must be at least 10 characters'); return false; }
            if (!form.description.trim() || form.description.length < 30) { setError('Description must be at least 30 characters'); return false; }
        }
        if (step === 2) {
            if (!form.budget || Number(form.budget) < 50) { setError('Budget must be at least ₹50'); return false; }
            if (!form.deadline) { setError('Set a deadline'); return false; }
            if (new Date(form.deadline) <= new Date()) { setError('Deadline must be in the future'); return false; }
        }
        return true;
    }

    function next() {
        if (!validate()) return;
        setStep(s => s + 1);
        setError('');
    }

    function submit() {
        const taskData = {
            ...form,
            budget: Number(form.budget),
            deadline: new Date(form.deadline).getTime(),
            teamSize: Number(form.teamSize),
        };
        const newTask = createTask(taskData, currentUser.id);
        navigate(`/tasks/${newTask.id}`);
    }

    const minDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

    return (
        <div className="page-container">
            <Sidebar />
            <main className="main-content">
                <div className="content-wrapper" style={{ maxWidth: 700 }}>
                    <div className="page-header">
                        <h1>Post a Task</h1>
                        <p>Describe what you need and let students apply</p>
                    </div>

                    {/* Step indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
                        {STEPS.map((s, i) => (
                            <React.Fragment key={i}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: i < step ? 'var(--accent-green)' : i === step ? 'var(--accent-violet)' : 'var(--bg-glass)',
                                        border: `2px solid ${i < step ? 'var(--accent-green)' : i === step ? 'var(--accent-violet)' : 'var(--bg-glass-border)'}`,
                                        fontWeight: 700, fontSize: 14, transition: 'var(--transition)',
                                        color: i <= step ? 'white' : 'var(--text-muted)',
                                    }}>
                                        {i < step ? <Check size={16} /> : i + 1}
                                    </div>
                                    <span style={{ fontSize: 11, color: i === step ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400 }}>{s}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div style={{ flex: 1, height: 2, background: i < step ? 'var(--accent-green)' : 'var(--bg-glass-border)', margin: '0 8px', marginBottom: 20, transition: 'var(--transition)' }} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="glass-card" style={{ padding: '32px' }}>
                        {/* Step 0: Category */}
                        {step === 0 && (
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>What kind of task is this?</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                                    {CATEGORIES.map(cat => (
                                        <button key={cat.id} type="button" onClick={() => setForm(f => ({ ...f, category: cat.id, subfield: '' }))} style={{
                                            padding: '18px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                                            border: `2px solid ${form.category === cat.id ? cat.color : 'var(--bg-glass-border)'}`,
                                            background: form.category === cat.id ? `${cat.color}15` : 'var(--bg-glass)',
                                            transition: 'var(--transition)',
                                        }}>
                                            <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon}</div>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: form.category === cat.id ? cat.color : 'var(--text-primary)' }}>{cat.label}</div>
                                        </button>
                                    ))}
                                </div>

                                {selectedCat && (
                                    <div style={{ marginTop: 20 }} className="form-group">
                                        <label className="form-label">Subfield (optional)</label>
                                        <select className="form-select" value={form.subfield} onChange={set('subfield')}>
                                            <option value="">General {selectedCat.label}</option>
                                            {selectedCat.subfields.map(sf => <option key={sf} value={sf}>{sf}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 1: Details */}
                        {step === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Describe Your Task</h2>
                                <div className="form-group">
                                    <label className="form-label">Task Title</label>
                                    <input className="form-input" value={form.title} onChange={set('title')} placeholder="e.g. Build a portfolio website in React" maxLength={100} />
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{form.title.length}/100</div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Full Description</label>
                                    <textarea className="form-textarea" value={form.description} onChange={set('description')} placeholder="Describe exactly what you need, deliverables, any preferences, revision policy etc." rows={5} />
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{form.description.length} chars</div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Experience Level Required</label>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        {EXPERIENCE_LEVELS.map(lvl => (
                                            <button key={lvl.id} type="button" onClick={() => setForm(f => ({ ...f, experienceLevel: lvl.id }))} style={{
                                                flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                                border: `2px solid ${form.experienceLevel === lvl.id ? 'var(--accent-violet)' : 'var(--bg-glass-border)'}`,
                                                background: form.experienceLevel === lvl.id ? 'rgba(255,107,53,0.15)' : 'var(--bg-glass)',
                                                transition: 'var(--transition)', textAlign: 'center',
                                            }}>
                                                <div style={{ fontWeight: 700, fontSize: 13, color: form.experienceLevel === lvl.id ? 'var(--accent-violet)' : 'var(--text-primary)' }}>{lvl.label}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{lvl.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Campus Scope</label>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        {[
                                            { id: 'campus', label: '🏫 Campus Only', desc: `Only verified ${currentUser.university || 'campus'} students` },
                                            { id: 'all', label: '🌐 Inter-College', desc: 'Open to verified students from all universities' },
                                        ].map(sc => (
                                            <button key={sc.id} type="button" onClick={() => setForm(f => ({ ...f, scope: sc.id }))} style={{
                                                flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                                border: `2px solid ${form.scope === sc.id ? 'var(--accent-violet)' : 'var(--bg-glass-border)'}`,
                                                background: form.scope === sc.id ? 'rgba(255,107,53,0.15)' : 'var(--bg-glass)',
                                                transition: 'var(--transition)', textAlign: 'left',
                                            }}>
                                                <div style={{ fontWeight: 700, fontSize: 13, color: form.scope === sc.id ? 'var(--accent-violet)' : 'var(--text-primary)' }}>{sc.label}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sc.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Budget & Deadline */}
                        {step === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Budget & Timeline</h2>
                                <div className="form-group">
                                    <label className="form-label">Budget (₹)</label>
                                    <input type="number" className="form-input" value={form.budget} onChange={set('budget')} placeholder="e.g. 500" min={50} />
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Students will bid at or below this amount. Platform takes 10% from both sides.</div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Deadline</label>
                                    <input type="datetime-local" className="form-input" value={form.deadline} onChange={set('deadline')} min={minDate} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Team Size</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <button key={n} type="button" onClick={() => setForm(f => ({ ...f, teamSize: n }))} style={{
                                                width: 44, height: 44, borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 15,
                                                border: `2px solid ${form.teamSize === n ? 'var(--accent-violet)' : 'var(--bg-glass-border)'}`,
                                                background: form.teamSize === n ? 'rgba(255,107,53,0.15)' : 'var(--bg-glass)',
                                                color: form.teamSize === n ? 'var(--accent-violet)' : 'var(--text-primary)',
                                                cursor: 'pointer', transition: 'var(--transition)',
                                            }}>{n}</button>
                                        ))}
                                    </div>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={form.urgent} onChange={set('urgent')} style={{ accentColor: 'var(--danger)', width: 18, height: 18 }} />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>⚡ Mark as Urgent</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Urgent tasks get higher visibility and are shown first</div>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Review Your Task</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {[
                                        ['Category', `${selectedCat?.icon} ${selectedCat?.label}${form.subfield ? ` → ${form.subfield}` : ''}`],
                                        ['Title', form.title],
                                        ['Campus Scope', form.scope === 'campus' ? `🏫 Campus Only (${currentUser.university || 'Local'})` : '🌐 Inter-College'],
                                        ['Experience Level', EXPERIENCE_LEVELS.find(e => e.id === form.experienceLevel)?.label],
                                        ['Budget', `₹${form.budget}`],
                                        ['Deadline', form.deadline ? new Date(form.deadline).toLocaleString() : '—'],
                                        ['Team Size', `${form.teamSize} person(s)`],
                                        ['Urgent', form.urgent ? 'Yes ⚡' : 'No'],
                                    ].map(([label, value]) => (
                                        <div key={label} style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--bg-glass-border)', paddingBottom: 12 }}>
                                            <div style={{ width: 130, color: 'var(--text-muted)', fontSize: 13 }}>{label}</div>
                                            <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{value}</div>
                                        </div>
                                    ))}
                                    <div style={{ borderBottom: '1px solid var(--bg-glass-border)', paddingBottom: 12 }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}>Description</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{form.description}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div style={{ marginTop: 16, color: 'var(--danger)', fontSize: 13, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)' }}>
                                ⚠ {error}
                            </div>
                        )}

                        {/* Navigation */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
                            {step > 0 ? (
                                <button onClick={() => setStep(s => s - 1)} className="btn btn-secondary">
                                    <ArrowLeft size={15} />Back
                                </button>
                            ) : <div />}
                            {step < STEPS.length - 1 ? (
                                <button onClick={next} className="btn btn-primary">
                                    Continue <ArrowRight size={15} />
                                </button>
                            ) : (
                                <button onClick={submit} className="btn btn-primary">
                                    <Plus size={15} />Post Task
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
