import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

export default function RatingModal({ taskTitle, userName, onSubmit, onClose }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');

    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    function handleSubmit() {
        if (rating === 0) { setError('Please select a star rating'); return; }
        if (feedback.trim().length < 10) { setError('Please write at least 10 characters of feedback'); return; }
        onSubmit({ rating, feedback });
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                        <h2 style={{ fontSize: 20, marginBottom: 4 }}>Rate Your Experience</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>How was working with <strong>{userName}</strong>?</p>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={18} /></button>
                </div>

                <div style={{
                    background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
                    padding: '12px 16px', marginBottom: 24, fontSize: 13, color: 'var(--text-secondary)',
                    border: '1px solid var(--bg-glass-border)'
                }}>
                    📋 Task: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{taskTitle}</span>
                </div>

                {/* Stars */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(0)}
                                onClick={() => { setRating(star); setError(''); }}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    transform: (hover || rating) >= star ? 'scale(1.2)' : 'scale(1)',
                                    transition: 'var(--transition)',
                                }}
                            >
                                <Star
                                    size={36}
                                    fill={(hover || rating) >= star ? '#f59e0b' : 'none'}
                                    color={(hover || rating) >= star ? '#f59e0b' : 'var(--text-muted)'}
                                />
                            </button>
                        ))}
                    </div>
                    {(hover || rating) > 0 && (
                        <div style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: 16 }}>
                            {labels[hover || rating]}
                        </div>
                    )}
                </div>

                {/* Feedback */}
                <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label">Written Feedback</label>
                    <textarea
                        className="form-textarea"
                        placeholder="Share your experience working with this student..."
                        value={feedback}
                        onChange={e => { setFeedback(e.target.value); setError(''); }}
                        rows={4}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{feedback.length}/500</div>
                </div>

                {error && (
                    <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 16, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>
                        ⚠ {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                    <button onClick={handleSubmit} className="btn btn-primary" style={{ flex: 2 }}>
                        <Star size={15} />Submit Rating
                    </button>
                </div>
            </div>
        </div>
    );
}
