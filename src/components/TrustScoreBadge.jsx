import React from 'react';
import { getTrustLabel } from '../utils/trustEngine';
import { ShieldCheck } from 'lucide-react';

export default function TrustScoreBadge({ score, size = 'md', showLabel = true }) {
    const { label, color } = getTrustLabel(score);
    const radius = size === 'sm' ? 20 : size === 'lg' ? 40 : 28;
    const strokeWidth = size === 'sm' ? 3 : 4;
    const svgSize = radius * 2 + strokeWidth * 2 + 4;
    const cx = svgSize / 2;
    const cy = svgSize / 2;
    const r = radius;
    const circumference = 2 * Math.PI * r;
    const dashOffset = circumference - (score / 100) * circumference;
    const fontSize = size === 'sm' ? 11 : size === 'lg' ? 18 : 13;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
                <svg width={svgSize} height={svgSize} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-glass)" strokeWidth={strokeWidth} />
                    <circle
                        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
                        strokeDasharray={circumference} strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ fontWeight: 800, fontSize, color, fontFamily: 'Outfit', lineHeight: 1 }}>{score}</span>
                </div>
            </div>
            {showLabel && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <ShieldCheck size={13} color={color} />
                        <span style={{ fontWeight: 700, fontSize: 13, color }}>Trust Score</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
                </div>
            )}
        </div>
    );
}
