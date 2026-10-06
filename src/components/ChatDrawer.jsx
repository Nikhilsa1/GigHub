import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Send, IndianRupee, Sparkles, Star, Shield, Clock, 
    ArrowRight, Check, CheckCheck, RefreshCw, MessageSquare, 
    TrendingUp, Bot, AlertCircle, Zap, ChevronDown
} from 'lucide-react';
import { 
    getMessages, saveMessage, updateMessage, 
    generateSmartAutoReply 
} from '../utils/chatStore';

export default function ChatDrawer({ 
    isOpen, 
    onClose, 
    taskId, 
    task, 
    currentUser, 
    otherUser, 
    applicant = null,
    onBidUpdated = null 
}) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [showCounterBox, setShowCounterBox] = useState(false);
    
    // Counter offer form state
    const currentBid = applicant?.bid || task?.budget || 500;
    const [counterAmount, setCounterAmount] = useState(currentBid);
    const [counterNote, setCounterNote] = useState('');

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const isCreator = currentUser && task && task.creatorId === currentUser.id;
    const participantId = otherUser?.id || (applicant ? applicant.userId : 'peer');

    // Load messages on open or user change
    useEffect(() => {
        if (!isOpen || !taskId || !participantId) return;

        const initial = getMessages(taskId, participantId, task, currentUser, otherUser);
        setMessages(initial);
        setCounterAmount(applicant?.bid || task?.budget || 500);

        // Listen for updates from other tabs or actions
        const handleChatUpdate = (e) => {
            if (e.detail?.taskId === taskId && e.detail?.participantId === participantId) {
                setMessages(getMessages(taskId, participantId, task, currentUser, otherUser));
            }
        };

        window.addEventListener('gighub:chat_update', handleChatUpdate);
        return () => window.removeEventListener('gighub:chat_update', handleChatUpdate);
    }, [isOpen, taskId, participantId, task, currentUser, otherUser, applicant]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, isOpen]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 250);
        }
    }, [isOpen]);

    if (!isOpen || !otherUser) return null;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = (e) => {
        e?.preventDefault();
        const text = inputText.trim();
        if (!text) return;

        const newMsg = {
            id: 'msg_' + Date.now(),
            senderId: currentUser.id,
            senderName: currentUser.name,
            text,
            type: 'text',
            timestamp: Date.now(),
        };

        const updated = saveMessage(taskId, participantId, newMsg);
        setMessages(updated);
        setInputText('');

        // Trigger simulated dynamic response if auto-reply is on
        if (autoReplyEnabled) {
            triggerAutoReply(text, false);
        }
    };

    const triggerAutoReply = (promptText, isCounter, counterData = null) => {
        setIsTyping(true);
        const delay = 1000 + Math.random() * 800;

        setTimeout(() => {
            setIsTyping(false);
            const reply = generateSmartAutoReply(
                isCounter ? counterData : promptText,
                task,
                counterData?.amount || applicant?.bid || task?.budget,
                otherUser,
                isCounter
            );

            const autoMsg = {
                id: 'msg_' + Date.now(),
                senderId: otherUser.id,
                senderName: otherUser.name,
                text: reply.text,
                type: reply.type || 'text',
                timestamp: Date.now(),
                isAuto: true,
                accepted: reply.accepted,
                amount: reply.amount,
            };

            const newHistory = saveMessage(taskId, participantId, autoMsg);
            setMessages(newHistory);

            // If simulated counter offer was automatically accepted by applicant
            if (isCounter && reply.accepted && onBidUpdated) {
                onBidUpdated(counterData.amount);
            }
        }, delay);
    };

    const handleSendCounterOffer = () => {
        const amount = Number(counterAmount);
        if (!amount || amount <= 0) return;

        const counterMsg = {
            id: 'counter_' + Date.now(),
            senderId: currentUser.id,
            senderName: currentUser.name,
            type: 'counter_offer',
            amount: amount,
            originalBid: currentBid,
            note: counterNote.trim() || 'Proposed counter-offer for this gig scope.',
            status: 'pending',
            timestamp: Date.now(),
        };

        const updated = saveMessage(taskId, participantId, counterMsg);
        setMessages(updated);
        setShowCounterBox(false);
        setCounterNote('');

        if (autoReplyEnabled) {
            triggerAutoReply('', true, { amount, note: counterNote });
        }
    };

    const handleAcceptCounterOffer = (msg) => {
        // Mark message as accepted
        updateMessage(taskId, participantId, msg.id, { status: 'accepted' });

        // Add confirmation message in thread
        const confirmMsg = {
            id: 'msg_' + Date.now(),
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: `🤝 Counter-offer of ₹${msg.amount} accepted! Terms updated.`,
            type: 'system',
            amount: msg.amount,
            timestamp: Date.now(),
        };

        const updated = saveMessage(taskId, participantId, confirmMsg);
        setMessages(updated);

        // Update task state if handler provided
        if (onBidUpdated) {
            onBidUpdated(msg.amount);
        }
    };

    const quickPills = [
        `⚡ Can we do ₹${Math.max(50, Math.round(currentBid * 0.85))}?`,
        `🕒 Can you deliver by tomorrow morning?`,
        `📂 Do you have similar project samples?`,
        `🤝 Deal! I am ready to finalize now.`,
    ];

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out',
        }}>
            {/* Backdrop click to close */}
            <div 
                style={{ flex: 1 }} 
                onClick={onClose} 
            />

            {/* Slide Drawer Panel */}
            <div style={{
                width: '100%',
                maxWidth: 480,
                height: '100vh',
                background: '#0e0e11',
                borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '-10px 0 50px rgba(0, 0, 0, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                animation: 'slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                {/* ─── Drawer Header ─── */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {/* Avatar with live status dot */}
                            <div style={{ position: 'relative' }}>
                                <div className="avatar avatar-md" style={{ 
                                    background: otherUser.avatarColor || 'var(--accent-violet)', 
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: 16,
                                    boxShadow: '0 0 15px rgba(255,107,53,0.3)'
                                }}>
                                    {otherUser.avatar || otherUser.name?.[0] || '?'}
                                </div>
                                <span style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: 10,
                                    height: 10,
                                    background: '#10b981',
                                    borderRadius: '50%',
                                    border: '2px solid #0e0e11',
                                }} />
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
                                        {otherUser.name}
                                    </span>
                                    {isCreator && (
                                        <span style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            padding: '2px 6px',
                                            borderRadius: 'var(--radius-full)',
                                            background: 'rgba(255,107,53,0.15)',
                                            color: 'var(--accent-violet)',
                                            border: '1px solid rgba(255,107,53,0.3)'
                                        }}>
                                            Applicant
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                    <span>{otherUser.university || 'Campus Student'}</span>
                                    <span>•</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#f59e0b', fontWeight: 600 }}>
                                        <Star size={11} fill="#f59e0b" />
                                        {otherUser.rating > 0 ? otherUser.rating.toFixed(1) : '5.0'}
                                    </span>
                                    <span>•</span>
                                    <span style={{ color: '#10b981', fontWeight: 600 }}>
                                        🛡️ {otherUser.trustScore || 75}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Close button */}
                        <button 
                            onClick={onClose}
                            className="btn-icon"
                            style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'var(--text-muted)',
                                borderRadius: '50%',
                                width: 34,
                                height: 34,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Task Context & Negotiation Quick Bar */}
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                    }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Task Context
                            </div>
                            <div style={{ 
                                fontSize: 13, 
                                fontWeight: 600, 
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis' 
                            }}>
                                {task?.title || 'Micro-gig'}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current Bid</div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-green)' }}>
                                    ₹{currentBid}
                                </div>
                            </div>

                            <button
                                onClick={() => setShowCounterBox(!showCounterBox)}
                                className="btn btn-sm"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(220,38,38,0.2))',
                                    border: '1px solid var(--accent-violet)',
                                    color: 'var(--accent-violet-light)',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    padding: '6px 12px',
                                    borderRadius: 'var(--radius-full)',
                                }}
                            >
                                <IndianRupee size={12} />
                                {showCounterBox ? 'Close' : 'Negotiate'}
                            </button>
                        </div>
                    </div>

                    {/* AI Demo Simulator Badge / Toggle */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        padding: '4px 2px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b' }}>
                            <Sparkles size={13} />
                            <span style={{ fontWeight: 600 }}>Interactive Expo Demo Mode</span>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <span>Simulate Instant Reply</span>
                            <input
                                type="checkbox"
                                checked={autoReplyEnabled}
                                onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                                style={{ accentColor: 'var(--accent-violet)', cursor: 'pointer' }}
                            />
                        </label>
                    </div>
                </div>

                {/* ─── Inline Counter-Offer Proposer Box (Collapsible) ─── */}
                {showCounterBox && (
                    <div style={{
                        background: 'linear-gradient(180deg, rgba(255,107,53,0.08), rgba(0,0,0,0.4))',
                        borderBottom: '1px solid rgba(255,107,53,0.25)',
                        padding: '16px 20px',
                        animation: 'fadeIn 0.2s ease-in-out',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-violet-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <TrendingUp size={14} /> Propose Counter-Offer
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Budget: ₹{task?.budget}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <span style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)', fontSize: 14 }}>₹</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    style={{ paddingLeft: 28, fontSize: 16, fontWeight: 700 }}
                                    value={counterAmount}
                                    onChange={(e) => setCounterAmount(e.target.value)}
                                    min={1}
                                    placeholder="Amount"
                                />
                            </div>

                            {/* Quick delta modifiers */}
                            <div style={{ display: 'flex', gap: 4 }}>
                                {[-50, -100, 50, 100].map(delta => (
                                    <button
                                        key={delta}
                                        type="button"
                                        onClick={() => setCounterAmount(prev => Math.max(50, Number(prev || 0) + delta))}
                                        className="btn btn-ghost"
                                        style={{
                                            padding: '6px 8px',
                                            fontSize: 11,
                                            fontWeight: 600,
                                            background: 'rgba(255,255,255,0.06)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: delta < 0 ? '#10b981' : '#f59e0b'
                                        }}
                                    >
                                        {delta > 0 ? `+₹${delta}` : `-₹${Math.abs(delta)}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: 12, marginBottom: 12 }}
                            placeholder="Optional note (e.g. Can do ₹550 if delivered within 4 hours)..."
                            value={counterNote}
                            onChange={(e) => setCounterNote(e.target.value)}
                        />

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowCounterBox(false)}
                                className="btn btn-ghost btn-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendCounterOffer}
                                className="btn btn-primary btn-sm"
                                style={{ fontWeight: 700 }}
                            >
                                <Send size={12} /> Send Counter Proposal
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Chat Message Scroll Area ─── */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                }}>
                    {/* Timestamp Pill */}
                    <div style={{ textAlign: 'center', margin: '8px 0' }}>
                        <span style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            background: 'rgba(255,255,255,0.04)',
                            padding: '4px 12px',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            Encrypted Campus Negotiation Channel 🔒
                        </span>
                    </div>

                    {messages.map((msg) => {
                        const isMe = msg.senderId === currentUser.id;

                        // System message (e.g. Counter offer accepted)
                        if (msg.type === 'system') {
                            return (
                                <div key={msg.id} style={{
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    color: '#6ee7b7',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '10px 14px',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}>
                                    <CheckCircle size={16} />
                                    <span>{msg.text}</span>
                                </div>
                            );
                        }

                        // Counter Offer Proposal Bubble
                        if (msg.type === 'counter_offer') {
                            const isPending = msg.status === 'pending';
                            const isAccepted = msg.status === 'accepted';

                            return (
                                <div key={msg.id} style={{
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    background: isMe 
                                        ? 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(220,38,38,0.25))' 
                                        : 'rgba(255, 255, 255, 0.06)',
                                    border: `1px solid ${isAccepted ? '#10b981' : 'var(--accent-violet)'}`,
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '14px 16px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-violet-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            🤝 {isMe ? 'You proposed a counter-offer' : `${msg.senderName} proposed a counter-offer`}
                                        </span>
                                        <span style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: 'var(--radius-full)',
                                            background: isAccepted ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                                            color: isAccepted ? '#10b981' : '#f59e0b',
                                            border: `1px solid ${isAccepted ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`
                                        }}>
                                            {isAccepted ? '✓ Accepted' : 'Pending'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0' }}>
                                        <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-green)' }}>
                                            ₹{msg.amount}
                                        </span>
                                        {msg.originalBid && (
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                                ₹{msg.originalBid}
                                            </span>
                                        )}
                                    </div>

                                    {msg.note && (
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, fontStyle: 'italic' }}>
                                            "{msg.note}"
                                        </div>
                                    )}

                                    {/* Action buttons on received counter offer */}
                                    {!isMe && isPending && (
                                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                            <button
                                                onClick={() => handleAcceptCounterOffer(msg)}
                                                className="btn btn-teal btn-sm"
                                                style={{ flex: 1, fontWeight: 700, fontSize: 12 }}
                                            >
                                                <Check size={14} /> Accept ₹{msg.amount}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setCounterAmount(msg.amount);
                                                    setShowCounterBox(true);
                                                }}
                                                className="btn btn-secondary btn-sm"
                                                style={{ fontSize: 12 }}
                                            >
                                                Counter Back
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // Regular Text Message Bubble
                        return (
                            <div
                                key={msg.id}
                                style={{
                                    display: 'flex',
                                    gap: 10,
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '82%',
                                }}
                            >
                                {!isMe && (
                                    <div className="avatar avatar-sm" style={{
                                        background: otherUser.avatarColor || 'var(--accent-violet)',
                                        color: 'white',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                        marginTop: 4,
                                    }}>
                                        {otherUser.avatar || otherUser.name?.[0] || '?'}
                                    </div>
                                )}

                                <div>
                                    <div style={{
                                        background: isMe 
                                            ? 'linear-gradient(135deg, var(--accent-violet), #dc2626)' 
                                            : 'rgba(255, 255, 255, 0.07)',
                                        border: isMe ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                                        color: isMe ? '#ffffff' : 'var(--text-secondary)',
                                        padding: '12px 16px',
                                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                        fontSize: 13.5,
                                        lineHeight: 1.55,
                                        boxShadow: isMe ? '0 4px 15px var(--accent-violet-glow)' : 'none',
                                    }}>
                                        {msg.text}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontSize: 10,
                                        color: 'var(--text-muted)',
                                        marginTop: 4,
                                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                                        padding: '0 4px'
                                    }}>
                                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isMe && <CheckCheck size={12} color="var(--accent-violet-light)" />}
                                        {msg.isAuto && (
                                            <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
                                                • <Bot size={10} /> Instant response
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Live Typing Indicator */}
                    {isTyping && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            alignSelf: 'flex-start',
                            maxWidth: '75%',
                        }}>
                            <div className="avatar avatar-sm" style={{
                                background: otherUser.avatarColor || 'var(--accent-violet)',
                                color: 'white',
                                fontSize: 12,
                                fontWeight: 700,
                            }}>
                                {otherUser.avatar || otherUser.name?.[0] || '?'}
                            </div>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.07)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '10px 16px',
                                borderRadius: '18px 18px 18px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{otherUser.name?.split(' ')[0]} is typing</span>
                                <span className="typing-dots">
                                    <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0s' }}>•</span>
                                    <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.2s' }}>•</span>
                                    <span style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.4s' }}>•</span>
                                </span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* ─── Quick Suggestion Chips (Expo Helpers) ─── */}
                <div style={{
                    padding: '8px 16px',
                    display: 'flex',
                    gap: 8,
                    overflowX: 'auto',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    scrollbarWidth: 'none',
                }}>
                    {quickPills.map((pill, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => {
                                setInputText(pill);
                                inputRef.current?.focus();
                            }}
                            style={{
                                whiteSpace: 'nowrap',
                                fontSize: 11,
                                padding: '5px 12px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'var(--text-secondary)',
                                borderRadius: 'var(--radius-full)',
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,107,53,0.15)'; e.currentTarget.style.borderColor = 'var(--accent-violet)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        >
                            {pill}
                        </button>
                    ))}
                </div>

                {/* ─── Message Input Footer ─── */}
                <form
                    onSubmit={handleSendMessage}
                    style={{
                        padding: '16px 20px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setShowCounterBox(!showCounterBox)}
                        className="btn-icon"
                        title="Propose Counter-Offer"
                        style={{
                            background: showCounterBox ? 'var(--accent-violet)' : 'rgba(255, 255, 255, 0.06)',
                            color: showCounterBox ? 'white' : 'var(--accent-violet-light)',
                            border: '1px solid rgba(255, 107, 53, 0.3)',
                            borderRadius: '50%',
                            width: 38,
                            height: 38,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <IndianRupee size={16} />
                    </button>

                    <input
                        ref={inputRef}
                        type="text"
                        className="form-input"
                        placeholder={`Message ${otherUser.name}...`}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        style={{
                            flex: 1,
                            borderRadius: 'var(--radius-full)',
                            padding: '10px 18px',
                            fontSize: 14,
                            background: 'rgba(255, 255, 255, 0.05)',
                        }}
                    />

                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="btn btn-primary btn-icon"
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            padding: 0,
                        }}
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}
