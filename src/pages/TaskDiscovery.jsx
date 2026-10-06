import React, { useState, useMemo } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import Sidebar from '../components/Sidebar';
import { CATEGORIES, EXPERIENCE_LEVELS } from '../data/categories';

export default function TaskDiscovery() {
    const { getTasks } = useData();
    const { currentUser } = useAuth();
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [filterExp, setFilterExp] = useState('');
    const [filterUrgent, setFilterUrgent] = useState(false);
    const [filterCampus, setFilterCampus] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const allTasks = getTasks();

    const filtered = useMemo(() => {
        let result = allTasks.filter(t => t.status === 'open' && t.creatorId !== currentUser.id);

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                t.subfield?.toLowerCase().includes(q)
            );
        }
        if (filterCat) result = result.filter(t => t.category === filterCat);
        if (filterExp) result = result.filter(t => t.experienceLevel === filterExp);
        if (filterUrgent) result = result.filter(t => t.urgent);
        if (filterCampus) result = result.filter(t => t.scope === 'campus');
        if (budgetMin) result = result.filter(t => t.budget >= Number(budgetMin));
        if (budgetMax) result = result.filter(t => t.budget <= Number(budgetMax));

        if (sortBy === 'newest') result.sort((a, b) => b.createdAt - a.createdAt);
        else if (sortBy === 'highest') result.sort((a, b) => b.budget - a.budget);
        else if (sortBy === 'deadline') result.sort((a, b) => a.deadline - b.deadline);
        else if (sortBy === 'applicants') result.sort((a, b) => b.applicants.length - a.applicants.length);

        return result;
    }, [allTasks, search, filterCat, filterExp, filterUrgent, filterCampus, budgetMin, budgetMax, sortBy, currentUser.id]);

    const hasFilters = filterCat || filterExp || filterUrgent || filterCampus || budgetMin || budgetMax;

    function clearFilters() {
        setFilterCat(''); setFilterExp(''); setFilterUrgent(false); setFilterCampus(false);
        setBudgetMin(''); setBudgetMax('');
    }

    return (
        <div className="page-container">
            <Sidebar />
            <main className="main-content">
                <div className="content-wrapper">
                    {/* Header */}
                    <div className="page-header">
                        <h1>Discover Tasks</h1>
                        <p>Find opportunities that match your skills and schedule</p>
                    </div>

                    {/* Search + Sort bar */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                        <div className="input-with-icon" style={{ flex: 1, minWidth: 240 }}>
                            <Search size={16} className="input-icon" />
                            <input
                                className="form-input"
                                placeholder="Search tasks, skills, keywords..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 180 }}>
                            <option value="newest">Newest First</option>
                            <option value="highest">Highest Budget</option>
                            <option value="deadline">Deadline Soon</option>
                            <option value="applicants">Most Applied</option>
                        </select>
                        <button
                            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal size={15} />
                            Filters
                            {hasFilters && <span className="notif-badge" style={{ background: 'white', color: 'var(--accent-violet)' }}>●</span>}
                        </button>
                    </div>

                    {/* Filter panel */}
                    {showFilters && (
                        <div className="glass-card" style={{ padding: '20px', marginBottom: 20 }}>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div className="form-group" style={{ flex: '1 1 180px' }}>
                                    <label className="form-label">Category</label>
                                    <select className="form-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                                        <option value="">All Categories</option>
                                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: '1 1 160px' }}>
                                    <label className="form-label">Experience</label>
                                    <select className="form-select" value={filterExp} onChange={e => setFilterExp(e.target.value)}>
                                        <option value="">Any Level</option>
                                        {EXPERIENCE_LEVELS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: '1 1 130px' }}>
                                    <label className="form-label">Min Budget (₹)</label>
                                    <input className="form-input" type="number" placeholder="0" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} />
                                </div>
                                <div className="form-group" style={{ flex: '1 1 130px' }}>
                                    <label className="form-label">Max Budget (₹)</label>
                                    <input className="form-input" type="number" placeholder="Any" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 0', whiteSpace: 'nowrap' }}>
                                    <input type="checkbox" checked={filterUrgent} onChange={e => setFilterUrgent(e.target.checked)} style={{ accentColor: 'var(--accent-violet)' }} />
                                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Urgent only</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 0', whiteSpace: 'nowrap' }}>
                                    <input type="checkbox" checked={filterCampus} onChange={e => setFilterCampus(e.target.checked)} style={{ accentColor: 'var(--accent-violet)' }} />
                                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>🏫 {currentUser.university || 'Campus'} Only</span>
                                </label>
                                {hasFilters && (
                                    <button onClick={clearFilters} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>
                                        <X size={14} />Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Category & Scope Pills */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                        <button onClick={() => setFilterCat('')} className={`btn btn-sm ${!filterCat ? 'btn-primary' : 'btn-secondary'}`}>All Gigs</button>
                        <button
                            onClick={() => setFilterCampus(!filterCampus)}
                            style={{
                                padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600,
                                border: `1px solid ${filterCampus ? '#3b82f6' : 'var(--bg-glass-border)'}`,
                                background: filterCampus ? 'rgba(59,130,246,0.2)' : 'var(--bg-glass)',
                                color: filterCampus ? '#60a5fa' : 'var(--text-secondary)',
                                cursor: 'pointer', transition: 'var(--transition)',
                            }}
                        >
                            🏫 {currentUser.university || 'My Campus'} Only
                        </button>
                        {CATEGORIES.map(c => (
                            <button key={c.id} onClick={() => setFilterCat(filterCat === c.id ? '' : c.id)} style={{
                                padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 500,
                                border: `1px solid ${filterCat === c.id ? c.color : 'var(--bg-glass-border)'}`,
                                background: filterCat === c.id ? `${c.color}20` : 'var(--bg-glass)',
                                color: filterCat === c.id ? c.color : 'var(--text-secondary)',
                                cursor: 'pointer', transition: 'var(--transition)',
                            }}>
                                {c.icon} {c.label}
                            </button>
                        ))}
                    </div>

                    {/* Results */}
                    <div style={{ marginBottom: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                        Showing {filtered.length} task{filtered.length !== 1 ? 's' : ''}
                    </div>

                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🔍</div>
                            <div className="empty-title">No tasks found</div>
                            <div className="empty-desc">Try changing your search or filters</div>
                            <button onClick={clearFilters} className="btn btn-secondary btn-sm">Clear Filters</button>
                        </div>
                    ) : (
                        <div className="grid-auto">
                            {filtered.map(t => <TaskCard key={t.id} task={t} />)}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
