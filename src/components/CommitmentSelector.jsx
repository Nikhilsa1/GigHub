import React from 'react';
import { COMMITMENT_LEVELS } from '../data/categories';

export default function CommitmentSelector({ value, onChange }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {COMMITMENT_LEVELS.map(level => {
                const selected = value === level.id;
                return (
                    <button
                        key={level.id}
                        type="button"
                        onClick={() => onChange(level.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '14px 18px', borderRadius: 'var(--radius-md)',
                            border: `2px solid ${selected ? level.color : 'var(--bg-glass-border)'}`,
                            background: selected ? `${level.color}15` : 'var(--bg-glass)',
                            cursor: 'pointer', transition: 'var(--transition)', textAlign: 'left', width: '100%',
                        }}
                    >
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: selected ? `${level.color}30` : 'var(--bg-glass)',
                            border: `2px solid ${selected ? level.color : 'var(--bg-glass-border)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, transition: 'var(--transition)',
                        }}>
                            {level.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: selected ? level.color : 'var(--text-primary)', marginBottom: 2 }}>
                                {level.label}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {level.description}
                            </div>
                        </div>
                        {selected && (
                            <div style={{
                                width: 20, height: 20, borderRadius: '50%',
                                background: level.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <span style={{ color: 'white', fontSize: 12 }}>✓</span>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
