import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Landing() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
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
            {/* Glow orbs */}
            <div style={{ position: 'fixed', top: '10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'var(--accent-violet)', opacity: 0.06, filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: '10%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'var(--accent-teal)', opacity: 0.05, filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Navbar */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--bg-glass-border)',
                padding: '16px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 18 }}>GigHub</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Student Micro-Gigs</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Link to="/auth" className="btn btn-ghost">Sign In</Link>
                    <Link to="/auth?mode=register" className="btn btn-primary">
                        Get Started <ArrowRight size={15} />
                    </Link>
                </div>
            </nav>

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Hero */}
                <section style={{ padding: '100px 48px 80px', textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
                    <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, marginBottom: 24, lineHeight: 1.1 }}>
                        Monetize your skills while you’re still studying
                    </h1>
                    <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7 }}>
                        No fixed hours. No professional portfolio required. Just your skills, your time, and meaningful micro-tasks that fit around your lectures.
                    </p>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/auth?mode=register" className="btn btn-primary btn-lg">
                            Start Earning <ArrowRight size={18} />
                        </Link>
                        <Link to="/auth" className="btn btn-secondary btn-lg">
                            Browse Tasks
                        </Link>
                    </div>
                </section>

                {/* How it works */}
                <section style={{ padding: '40px 48px 100px', background: 'var(--bg-secondary)' }}>
                    <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>How It Works</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 60 }}>Get started in 3 simple steps</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                            {[
                                { step: '01', title: 'Create Your Profile', desc: 'Add your skills, university, and links to your best work. No experience required to get started.' },
                                { step: '02', title: 'Find or Post a Task', desc: 'Browse tasks that match your skills, or post your own task for the community to apply.' },
                                { step: '03', title: 'Deliver & Get Paid', desc: 'Complete the task, get it approved, and receive payment directly. Platform takes only 10%.' },
                            ].map((item, i) => (
                                <div key={i} style={{ position: 'relative' }}>
                                    <div style={{
                                        width: 56, height: 56, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-teal))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontFamily: 'Outfit', fontWeight: 900, fontSize: 18, color: 'white',
                                        margin: '0 auto 20px', boxShadow: 'var(--shadow-glow-violet)',
                                    }}>{item.step}</div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section style={{ padding: '100px 48px', textAlign: 'center' }}>
                    <div style={{ maxWidth: 600, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 40, fontWeight: 900, marginBottom: 16 }}>
                            Ready to Start <span className="gradient-text">Earning?</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 40 }}>
                            Join thousands of students already earning on their own schedule.
                        </p>
                        <Link to="/auth?mode=register" className="btn btn-primary btn-lg" style={{ fontSize: 18, padding: '18px 48px' }}>
                            Join for Free <ArrowRight size={20} />
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer style={{ borderTop: '1px solid var(--bg-glass-border)', padding: '32px 48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    © 2026 GigHub · Built for students, by students
                </footer>
            </div>
        </div>
    );
}
