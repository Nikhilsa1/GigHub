import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Clock, Users, IndianRupee, Star, Send, CheckCircle,
    XCircle, Zap, ChevronDown, ChevronUp, Award, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { api } from '../utils/api';
import DeadlineTimer from '../components/DeadlineTimer';
import CommitmentSelector from '../components/CommitmentSelector';
import CandidateCard from '../components/CandidateCard';
import RatingModal from '../components/RatingModal';
import ChatDrawer from '../components/ChatDrawer';
import Sidebar from '../components/Sidebar';
import { CATEGORIES, EXPERIENCE_LEVELS } from '../data/categories';
import { isUserBanned, getBanTimeRemaining } from '../utils/trustEngine';

export default function TaskDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser, refreshCurrentUser } = useAuth();
    const { getTasks, getUsers, applyToTask, selectCandidate, updateApplicantBid, submitUpdate, approveTask, rejectWork, submitRating, cancelTask, getRankedApplicants, fetchData } = useData();

    const [task, setTask] = useState(null);
    const [users, setUsers] = useState([]);
    const [applying, setApplying] = useState(false);
    const [commitment, setCommitment] = useState('full');
    const [bid, setBid] = useState('');
    const [message, setMessage] = useState('');
    const [updateMsg, setUpdateMsg] = useState('');
    const [selectionMode, setSelectionMode] = useState('quality');
    const [showRating, setShowRating] = useState(false);
    const [ratingTarget, setRatingTarget] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [showCancel, setShowCancel] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Chat and negotiation state
    const [chatOpen, setChatOpen] = useState(false);
    const [chatTargetUser, setChatTargetUser] = useState(null);
    const [chatTargetApplicant, setChatTargetApplicant] = useState(null);

    function openChat(targetUser, targetApplicant = null) {
        setChatTargetUser(targetUser);
        setChatTargetApplicant(targetApplicant);
        setChatOpen(true);
    }

    useEffect(() => {
        const t = getTasks().find(t => t.id === id);
        setTask(t);
        setBid(t?.budget || '');
        setUsers(getUsers());
        
        // Fetch missing applicant data from MongoDB
        if (t && t.applicants.length > 0) {
            const localUsers = getUsers();
            const missingApplicants = t.applicants.filter(app => !localUsers.find(u => u.id === app.userId));
            
            if (missingApplicants.length > 0) {
                missingApplicants.forEach(app => {
                    api.getUser(app.userId).then(userData => {
                        const user = { ...userData, id: userData._id || userData.id };
                        // Add to localStorage
                        const users = JSON.parse(localStorage.getItem('gig_users') || '[]');
                        const existingIdx = users.findIndex(u => u.id === user.id);
                        if (existingIdx >= 0) {
                            users[existingIdx] = user;
                        } else {
                            users.push(user);
                        }
                        localStorage.setItem('gig_users', JSON.stringify(users));
                        setUsers(users);
                    }).catch(err => console.error('Failed to fetch user:', err));
                });
            }
        }
    }, [id]);

    if (!task) return (
        <div className="page-container">
            <Sidebar />
            <main className="main-content">
                <div className="empty-state"><div className="empty-icon">❌</div><div className="empty-title">Task not found</div></div>
            </main>
        </div>
    );

    const currentUserId = String(currentUser?.id || currentUser?._id || '');
    const cat = CATEGORIES.find(c => c.id === task.category);
    const isCreator = String(task.creatorId) === currentUserId;
    const creator = users.find(u => String(u.id || u._id) === String(task.creatorId));
    const selectedUser = task.selectedApplicantId ? users.find(u => String(u.id || u._id) === String(task.selectedApplicantId)) : null;
    const myApplication = task.applicants?.find(a => String(a.userId || a.userSnapshot?.id || a.id) === currentUserId);
    const rankedApplicants = isCreator ? getRankedApplicants(id, selectionMode) : [];
    const banned = isUserBanned(currentUser);
    const banTime = banned ? getBanTimeRemaining(currentUser) : null;

    function refresh() {
        const t = getTasks().find(t => t.id === id);
        setTask(t);
        setUsers(getUsers());
    }

    function handleApply(e) {
        e.preventDefault();
        if (banned) { setError(`You are banned for ${banTime}. Cannot apply.`); return; }
        if (!bid || Number(bid) <= 0) { setError('Enter a valid bid amount'); return; }
        applyToTask(id, { userId: currentUser.id, commitment, bid: Number(bid), message });
        setApplying(false);
        setSuccess('Application submitted!');
        refresh();
        setTimeout(() => setSuccess(''), 3000);
    }

    function handleSelect(userId) {
        selectCandidate(id, userId);
        refresh();
    }

    function handleUpdate(e) {
        e.preventDefault();
        if (!updateMsg.trim()) return;
        submitUpdate(id, currentUser.id, updateMsg);
        setUpdateMsg('');
        refresh();
    }

    function handleApprove() {
        const applicant = task.applicants.find(a => a.userId === task.selectedApplicantId);
        approveTask(id, applicant?.bid);
        refresh();
        refreshCurrentUser();
        // Trigger rating
        setRatingTarget({ userId: task.selectedApplicantId, name: selectedUser?.name });
        setShowRating(true);
    }

    function handleRatingSubmit({ rating, feedback }) {
        submitRating(id, currentUser.id, ratingTarget.userId, rating, feedback);
        setShowRating(false);
        setSuccess('Rating submitted! Task moved to completed.');
        refresh();
    }

    function handleCancel() {
        cancelTask(id, isCreator ? 'client' : 'worker', cancelReason);
        setShowCancel(false);
        refresh();
    }

    async function handleReject() {
        if (!rejectReason.trim()) {
            setError('Please provide a reason for rejection');
            return;
        }
        await rejectWork(id, rejectReason);
        setShowReject(false);
        setRejectReason('');
        setSuccess('Work rejected and escrow refunded to client. Task reopened for new candidates.');
        refresh();
        setTimeout(() => setSuccess(''), 3000);
    }

    return (
        <div className="page-container">
            <Sidebar />
            <main className="main-content">
                <div className="content-wrapper" style={{ maxWidth: 900 }}>
                    {/* Status banner */}
                    {success && <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20 }}>{success}</div>}
                    {error && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20 }}>{error}</div>}

                    {/* Task Header */}
                    <div className="glass-card" style={{ padding: '28px', marginBottom: 24, borderLeft: `4px solid ${cat?.color || 'var(--accent-violet)'}` }}>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                            <span className={`badge badge-${task.status.replace('_', '-')}`}>
                                {task.status === 'open' ? 'Open' : task.status === 'in_progress' ? 'In Progress' : task.status === 'completed' ? 'Completed' : 'Cancelled'}
                            </span>
                            {task.urgent && <span className="badge badge-urgent"><Zap size={9} />Urgent</span>}
                            <span style={{ background: `${cat?.color}20`, color: cat?.color, border: `1px solid ${cat?.color}40`, borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                                {cat?.icon} {cat?.label}
                            </span>
                            <span style={{
                                background: task.scope === 'campus' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                                color: task.scope === 'campus' ? '#60a5fa' : '#c084fc',
                                border: `1px solid ${task.scope === 'campus' ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)'}`,
                                borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 12, fontWeight: 600
                            }}>
                                {task.scope === 'campus' ? '🏫 Campus Only' : '🌐 Inter-College'}
                            </span>
                            <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                                🔒 Escrow Protected {task.escrowAmount > 0 ? `(₹${task.escrowAmount} Locked)` : ''}
                            </span>
                            {task.subfield && <span style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--bg-glass-border)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: 12 }}>{task.subfield}</span>}
                        </div>

                        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, lineHeight: 1.3 }}>{task.title}</h1>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>{task.description}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                            {[
                                { icon: <IndianRupee size={16} />, label: 'Budget', value: `₹${task.budget}`, color: 'var(--accent-green)' },
                                { icon: <Users size={16} />, label: 'Team Size', value: `${task.teamSize} person(s)`, color: 'var(--accent-teal)' },
                                { icon: <Award size={16} />, label: 'Experience', value: EXPERIENCE_LEVELS.find(e => e.id === task.experienceLevel)?.label || task.experienceLevel, color: 'var(--accent-violet)' },
                                { icon: <Users size={16} />, label: 'Applicants', value: `${task.applicants.length} applied`, color: 'var(--accent-amber)' },
                            ].map((item, i) => (
                                <div key={i} style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '12px', border: '1px solid var(--bg-glass-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: item.color, marginBottom: 4, fontSize: 13 }}>{item.icon}{item.label}</div>
                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{item.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Deadline */}
                        <div style={{ marginTop: 20 }}>
                            <DeadlineTimer deadline={task.deadline} />
                        </div>

                        {/* Creator info */}
                        {creator && (
                            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, borderTop: '1px solid var(--bg-glass-border)', paddingTop: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className="avatar avatar-md" style={{ background: creator.avatarColor, color: 'white' }}>{creator.avatar}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            Posted by {creator.name}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{creator.university} · ⭐ {creator.rating > 0 ? creator.rating : 'New'}</div>
                                    </div>
                                </div>
                                <div style={{
                                    background: 'rgba(16,185,129,0.12)',
                                    border: '1px solid rgba(16,185,129,0.3)',
                                    borderRadius: 'var(--radius-full)',
                                    padding: '4px 12px',
                                    fontSize: 12,
                                    color: '#6ee7b7',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5
                                }}>
                                    <span>🛡️ Verified Student</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- CREATOR PANEL --- */}
                    {isCreator && task.status !== 'cancelled' && (
                        <div className="glass-card" style={{ padding: '24px', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Manage Applicants</h2>

                            {/* Selection mode toggle */}
                            {task.applicants.length > 0 && (
                                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 8, display: 'flex', alignItems: 'center' }}>Rank by:</div>
                                    {['quality', 'cost'].map(mode => (
                                        <button key={mode} onClick={() => setSelectionMode(mode)}
                                            className={`btn btn-sm ${selectionMode === mode ? 'btn-primary' : 'btn-secondary'}`}
                                            style={{ textTransform: 'capitalize' }}>
                                            {mode === 'quality' ? '🏆 Quality Priority' : '💰 Cost Priority'}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {task.applicants.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '24px' }}>No applicants yet. Share your task to attract more students!</div>
                            ) : task.selectedApplicantId ? (
                                <div>
                                    <div style={{ marginBottom: 16, color: 'var(--accent-green)', fontWeight: 600, fontSize: 14 }}>✓ Candidate selected — task in progress</div>
                                    {selectedUser && (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div className="avatar avatar-md" style={{ background: selectedUser.avatarColor, color: 'white' }}>{selectedUser.avatar}</div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedUser.name}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedUser.university} · 🛡️ Trust: {selectedUser.trustScore || 75}</div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => openChat(selectedUser, task.applicants.find(a => a.userId === selectedUser.id))}
                                                className="btn btn-secondary btn-sm"
                                                style={{
                                                    background: 'rgba(255,107,53,0.15)',
                                                    border: '1px solid var(--accent-violet)',
                                                    color: 'var(--accent-violet-light)',
                                                    fontWeight: 700,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}
                                            >
                                                <MessageSquare size={14} /> Live Chat & Negotiate
                                            </button>
                                        </div>
                                    )}
                                    {task.status === 'in_progress' && !task.approved && (
                                        <div style={{ marginTop: 14 }}>
                                            {!showReject ? (
                                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                    <button onClick={handleApprove} className="btn btn-teal">
                                                        <CheckCircle size={16} />Approve & Complete Task
                                                    </button>
                                                    <button onClick={() => setShowReject(true)} className="btn btn-danger">
                                                        <XCircle size={16} />Reject Work
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                                                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--danger)' }}>Reject Work Submission</h4>
                                                    <textarea 
                                                        className="form-textarea" 
                                                        placeholder="Explain what needs to be improved or why the work is unsatisfactory..."
                                                        value={rejectReason}
                                                        onChange={e => setRejectReason(e.target.value)}
                                                        rows={3}
                                                        style={{ marginBottom: 10 }}
                                                    />
                                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>⚠ This will deselect the candidate and reopen the task for new applications.</p>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button onClick={handleReject} className="btn btn-danger btn-sm">
                                                            <XCircle size={14} />Confirm Rejection
                                                        </button>
                                                        <button onClick={() => { setShowReject(false); setRejectReason(''); }} className="btn btn-ghost btn-sm">
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {rankedApplicants.map((applicant, idx) => {
                                        const u = users.find(u => u.id === applicant.userId);
                                        return (
                                            <CandidateCard
                                                key={applicant.userId}
                                                applicant={applicant}
                                                user={u}
                                                rank={idx + 1}
                                                onSelect={() => handleSelect(applicant.userId)}
                                                onChat={() => openChat(u || { id: applicant.userId, name: 'Applicant' }, applicant)}
                                                isSelected={task.selectedApplicantId === applicant.userId}
                                                selectionMode={selectionMode}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {/* Cancel task */}
                            {task.status === 'open' && (
                                <div style={{ marginTop: 20, borderTop: '1px solid var(--bg-glass-border)', paddingTop: 20 }}>
                                    {!showCancel ? (
                                        <button onClick={() => setShowCancel(true)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>
                                            <XCircle size={14} />Cancel Task
                                        </button>
                                    ) : (
                                        <div>
                                            <textarea className="form-textarea" placeholder="Reason for cancellation..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={2} style={{ marginBottom: 10 }} />
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={handleCancel} className="btn btn-danger btn-sm">Confirm Cancel</button>
                                                <button onClick={() => setShowCancel(false)} className="btn btn-ghost btn-sm">Back</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- WORKER PANEL --- */}
                    {!isCreator && task.status === 'open' && (
                        <div className="glass-card" style={{ padding: '24px', marginBottom: 24 }}>
                            {myApplication ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                    <div>
                                        <div style={{ color: 'var(--accent-teal)', fontWeight: 600, fontSize: 15 }}>
                                            ✓ You applied with a bid of ₹{myApplication.bid} · Waiting for selection
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                            You can directly chat or negotiate terms with the task poster.
                                        </div>
                                    </div>

                                    {creator && (
                                        <button
                                            type="button"
                                            onClick={() => openChat(creator, myApplication)}
                                            className="btn btn-secondary btn-sm"
                                            style={{
                                                background: 'rgba(255,107,53,0.15)',
                                                border: '1px solid var(--accent-violet)',
                                                color: 'var(--accent-violet-light)',
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            <MessageSquare size={14} /> Chat & Negotiate with Client
                                        </button>
                                    )}
                                </div>
                            ) : !applying ? (
                                <div style={{ textAlign: 'center' }}>
                                    <h3 style={{ marginBottom: 8 }}>Interested in this task?</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Apply now and let the AI match you with this opportunity</p>
                                    {banned ? (
                                        <div style={{ color: 'var(--danger)', fontSize: 14 }}>⚠ You are banned for {banTime}. Cannot apply to tasks.</div>
                                    ) : (
                                        <button onClick={() => setApplying(true)} className="btn btn-primary">Apply to This Task</button>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>Submit Your Application</h3>

                                    <div className="form-group">
                                        <label className="form-label">Your Bid (₹)</label>
                                        <input type="number" className="form-input" value={bid} onChange={e => setBid(e.target.value)} placeholder="e.g. 500" min={1} />
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Task budget: ₹{task.budget} · Platform takes 10%</div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Why You're the Right Fit</label>
                                        <textarea className="form-textarea" value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your relevant experience, approach to this task, and timeline..." rows={3} />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Commitment Level</label>
                                        <CommitmentSelector value={commitment} onChange={setCommitment} />
                                    </div>

                                    {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>⚠ {error}</div>}

                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button type="button" onClick={() => setApplying(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Submit Application</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Worker — submit update */}
                    {!isCreator && task.selectedApplicantId === currentUser.id && task.status === 'in_progress' && (
                        <div className="glass-card" style={{ padding: '24px', marginBottom: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Send Progress Update</h3>
                                {creator && (
                                    <button
                                        type="button"
                                        onClick={() => openChat(creator, task.applicants?.find(a => a.userId === currentUser.id))}
                                        className="btn btn-secondary btn-sm"
                                        style={{
                                            background: 'rgba(255,107,53,0.15)',
                                            border: '1px solid var(--accent-violet)',
                                            color: 'var(--accent-violet-light)',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <MessageSquare size={14} /> Direct Chat with Client
                                    </button>
                                )}
                            </div>
                            <form onSubmit={handleUpdate} style={{ display: 'flex', gap: 10 }}>
                                <textarea className="form-textarea" value={updateMsg} onChange={e => setUpdateMsg(e.target.value)} placeholder="Share your progress, questions, or completion status..." rows={2} style={{ flex: 1 }} />
                                <button type="submit" className="btn btn-primary btn-icon" disabled={!updateMsg.trim()}>
                                    <Send size={18} />
                                </button>
                            </form>

                            {/* Backout */}
                            <div style={{ marginTop: 16, borderTop: '1px solid var(--bg-glass-border)', paddingTop: 16 }}>
                                <button onClick={() => setShowCancel(!showCancel)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>
                                    <XCircle size={14} />Withdraw from Task
                                </button>
                                {showCancel && (
                                    <div style={{ marginTop: 12 }}>
                                        <p style={{ fontSize: 12, color: 'var(--warning)', marginBottom: 10 }}>⚠ Withdrawing will be counted as a failure and may affect your trust score.</p>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={handleCancel} className="btn btn-danger btn-sm">Confirm Withdrawal</button>
                                            <button onClick={() => setShowCancel(false)} className="btn btn-ghost btn-sm">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Progress Updates */}
                    {task.updates && task.updates.length > 0 && (
                        <div className="glass-card" style={{ padding: '24px', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Progress Updates</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {task.updates.map((upd, i) => {
                                    const updUser = users.find(u => u.id === upd.userId);
                                    return (
                                        <div key={i} style={{ display: 'flex', gap: 10 }}>
                                            <div className="avatar avatar-sm" style={{ background: updUser?.avatarColor || 'var(--accent-violet)', color: 'white', flexShrink: 0 }}>
                                                {updUser?.avatar || '?'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{updUser?.name || 'Unknown'}</div>
                                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{upd.message}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(upd.createdAt).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Quick Live Chat Button for Expo Demo */}
            {((isCreator && (task.applicants.length > 0 || task.selectedApplicantId)) || myApplication || task.selectedApplicantId === currentUser.id) && (
                <button
                    onClick={() => {
                        if (isCreator) {
                            const target = selectedUser || (task.applicants[0] ? users.find(u => u.id === task.applicants[0].userId) : null);
                            if (target) openChat(target, task.applicants.find(a => a.userId === target.id));
                        } else if (creator) {
                            openChat(creator, myApplication);
                        }
                    }}
                    className="btn btn-primary"
                    style={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 90,
                        borderRadius: 'var(--radius-full)',
                        padding: '12px 22px',
                        boxShadow: '0 8px 30px rgba(255,107,53,0.4)',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <MessageSquare size={18} />
                    <span>Live Chat & Negotiate</span>
                </button>
            )}

            {/* Rating Modal */}
            {showRating && ratingTarget && (
                <RatingModal
                    taskTitle={task.title}
                    userName={ratingTarget.name}
                    onSubmit={handleRatingSubmit}
                    onClose={() => setShowRating(false)}
                />
            )}

            {/* Live Chat & Negotiation Drawer */}
            <ChatDrawer
                isOpen={chatOpen}
                onClose={() => setChatOpen(false)}
                taskId={id}
                task={task}
                currentUser={currentUser}
                otherUser={chatTargetUser}
                applicant={chatTargetApplicant}
                onBidUpdated={(newBid) => {
                    updateApplicantBid(id, chatTargetApplicant?.userId || chatTargetUser?.id, newBid);
                    refresh();
                }}
            />
        </div>
    );
}
