import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function DeadlineTimer({ deadline, compact = false }) {
    const [timeLeft, setTimeLeft] = useState(computeTimeLeft(deadline));

    useEffect(() => {
        setTimeLeft(computeTimeLeft(deadline));
        const interval = setInterval(() => setTimeLeft(computeTimeLeft(deadline)), 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    function computeTimeLeft(dl) {
        const diff = dl - Date.now();
        if (diff <= 0) return { expired: true, display: 'Expired', urgency: 'critical' };
        const totalSec = Math.floor(diff / 1000);
        const days = Math.floor(totalSec / 86400);
        const hours = Math.floor((totalSec % 86400) / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;

        let urgency = 'ok';
        if (diff < 86400000) urgency = 'critical';      // < 1 day
        else if (diff < 3 * 86400000) urgency = 'warning'; // < 3 days

        if (compact) {
            if (days > 0) return { display: `${days}d ${hours}h`, urgency, expired: false };
            if (hours > 0) return { display: `${hours}h ${mins}m`, urgency, expired: false };
            return { display: `${mins}m ${secs}s`, urgency, expired: false };
        }

        if (days > 0) return { display: `${days}d ${hours}h ${mins}m`, urgency, expired: false };
        if (hours > 0) return { display: `${hours}h ${mins}m ${secs}s`, urgency, expired: false };
        return { display: `${mins}m ${secs}s`, urgency, expired: false };
    }

    const colorClass = timeLeft.urgency === 'critical' ? 'deadline-critical'
        : timeLeft.urgency === 'warning' ? 'deadline-warning' : 'deadline-ok';

    if (compact) {
        return (
            <span className={colorClass} style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} />
                {timeLeft.display}
            </span>
        );
    }

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: timeLeft.urgency === 'critical' ? 'rgba(239,68,68,0.1)' :
                timeLeft.urgency === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
            border: `1px solid ${timeLeft.urgency === 'critical' ? 'rgba(239,68,68,0.3)' :
                timeLeft.urgency === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
            borderRadius: 'var(--radius-md)', padding: '8px 14px',
        }}>
            <Clock size={15} className={colorClass} />
            <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Time Remaining</div>
                <div className={colorClass} style={{ fontWeight: 700, fontSize: 15 }}>{timeLeft.display}</div>
            </div>
        </div>
    );
}
