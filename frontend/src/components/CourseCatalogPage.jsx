import { useEffect, useState, useMemo } from 'react';
import { api, getCatalog, json } from '../api.js';

const ICONS = {
  Binary: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 20h4"/><path d="M14 4h4"/><path d="M6 12h4"/><path d="M14 12h4"/>
      <path d="M8 4v4"/><path d="M16 16v4"/><path d="M8 14v4"/><path d="M16 8v4"/>
    </svg>
  ),
  Globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Brain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.37A2 2 0 0 1 5 13v-1a2 2 0 0 1 1.5-1.94A2.5 2.5 0 0 1 9.5 2Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.37A2 2 0 0 0 19 13v-1a2 2 0 0 0-1.5-1.94A2.5 2.5 0 0 0 14.5 2Z"/>
    </svg>
  ),
  Database: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  Server: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
      <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
    </svg>
  ),
  Cpu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
  Wifi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  ),
  Braces: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/>
      <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>
    </svg>
  ),
  BookOpen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
};

const DIFF_COLORS = {
  Beginner: { bg: '#e6f9f1', color: '#2aa87a', dot: '#2aa87a' },
  Intermediate: { bg: '#fff4e0', color: '#d97706', dot: '#d97706' },
  Advanced: { bg: '#ffe8ee', color: '#e85790', dot: '#e85790' },
};

const CARD_PALETTES = {
  purple: { from: '#7c3aed', to: '#4f46e5', badge: '#ede9ff', badgeText: '#6757e8' },
  blue:   { from: '#2563eb', to: '#0ea5e9', badge: '#e0f2fe', badgeText: '#0369a1' },
  teal:   { from: '#0d9488', to: '#14b8a6', badge: '#ccfbf1', badgeText: '#0f766e' },
  orange: { from: '#ea580c', to: '#f59e0b', badge: '#fff7ed', badgeText: '#c2410c' },
  green:  { from: '#16a34a', to: '#22c55e', badge: '#dcfce7', badgeText: '#15803d' },
  pink:   { from: '#db2777', to: '#e879f9', badge: '#fce7f3', badgeText: '#be185d' },
  indigo: { from: '#4338ca', to: '#6366f1', badge: '#eef2ff', badgeText: '#4338ca' },
  red:    { from: '#dc2626', to: '#ef4444', badge: '#fee2e2', badgeText: '#dc2626' },
  yellow: { from: '#b45309', to: '#f59e0b', badge: '#fef9c3', badgeText: '#92400e' },
};

const CATEGORIES = ['All', 'Computer Science', 'Web Development', 'Programming', 'Artificial Intelligence', 'Databases', 'Networking'];

function StarRating({ rating }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#f5c842' : 'none'}
          stroke="#f5c842" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginLeft: 2 }}>{rating}</span>
    </span>
  );
}

function CourseCard({ course, onEnroll, enrolling }) {
  const palette = CARD_PALETTES[course.thumbnail_color] || CARD_PALETTES.purple;
  const diff = DIFF_COLORS[course.difficulty] || DIFF_COLORS.Beginner;
  const icon = ICONS[course.thumbnail_icon] || ICONS.BookOpen;

  return (
    <div className="catalog-card" style={{ '--card-from': palette.from, '--card-to': palette.to }}>
      {/* Card hero */}
      <div className="catalog-card-hero" style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}>
        <div className="catalog-card-icon">{icon}</div>
        <div className="catalog-card-category">{course.category}</div>
        {course.is_enrolled ? (
          <div className="catalog-enrolled-badge">✓ Enrolled</div>
        ) : null}
      </div>

      {/* Card body */}
      <div className="catalog-card-body">
        <div className="catalog-card-meta">
          <span className="diff-badge" style={{ background: diff.bg, color: diff.color }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: diff.dot, flexShrink: 0 }} />
            {course.difficulty}
          </span>
          <StarRating rating={course.rating} />
        </div>

        <h3 className="catalog-card-title">{course.title}</h3>
        <p className="catalog-card-desc">{course.description}</p>

        <div className="catalog-card-stats">
          <span>🕐 {course.total_hours}h</span>
          <span>👥 {(course.student_count || 0).toLocaleString()}</span>
          <span>📝 {course.quiz_count || 0} quizzes</span>
        </div>

        <button
          className={`catalog-enroll-btn ${course.is_enrolled ? 'enrolled' : ''}`}
          onClick={() => !course.is_enrolled && onEnroll(course.id)}
          disabled={course.is_enrolled || enrolling === course.id}
          style={{ '--btn-color': palette.from }}
        >
          {enrolling === course.id ? (
            <><span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} /> Enrolling...</>
          ) : course.is_enrolled ? (
            <>✓ Already Enrolled</>
          ) : (
            <>Enroll Free →</>
          )}
        </button>
      </div>
    </div>
  );
}

export default function CourseCatalogPage({ user, setPage, setSelectedCourseId }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [toast, setToast] = useState('');

  useEffect(() => {
    getCatalog()
      .then(setCourses)
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return courses.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      const matchCat = category === 'All' || c.category === category;
      const matchDiff = difficulty === 'All' || c.difficulty === difficulty;
      return matchSearch && matchCat && matchDiff;
    });
  }, [courses, search, category, difficulty]);

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await api(`/courses/${courseId}/enroll`, { method: 'POST' });
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_enrolled: true } : c));
      const course = courses.find(c => c.id === courseId);
      setToast(`🎉 Enrolled in "${course.title}"!`);
      setTimeout(() => setToast(''), 3000);
    } catch (e) {
      setToast('❌ ' + e.message);
      setTimeout(() => setToast(''), 3000);
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <div className="content">
      {toast && <div className="toast toast-show">{toast}</div>}

      {/* Header */}
      <div className="catalog-header">
        <div>
          <p className="eyebrow">LEARNING PLATFORM</p>
          <h1>Browse All Courses</h1>
          <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>
            {courses.length} courses · Learn DSA, Web Dev, ML, and more — all with built-in AI tutor & quizzes
          </p>
        </div>
        <div className="catalog-header-stats">
          <div className="cat-stat">
            <span className="cat-stat-num">{courses.length}</span>
            <span className="cat-stat-label">Courses</span>
          </div>
          <div className="cat-stat">
            <span className="cat-stat-num">{courses.reduce((a,c) => a + (c.total_hours||0), 0)}h</span>
            <span className="cat-stat-label">Content</span>
          </div>
          <div className="cat-stat">
            <span className="cat-stat-num">{courses.filter(c=>c.is_enrolled).length}</span>
            <span className="cat-stat-label">Enrolled</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="catalog-filters">
        <div className="catalog-search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#8c90ae' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="catalog-search"
            placeholder="Search courses, topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-chip ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="filter-row">
          <select className="filter-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="All">All Levels</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
          <span className="muted">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="catalog-loading">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <h3>No courses found</h3>
          <p className="muted">Try adjusting your search or filters</p>
          <button className="hero-button" onClick={() => { setSearch(''); setCategory('All'); setDifficulty('All'); }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="catalog-grid">
          {filtered.map(course => (
            <CourseCard key={course.id} course={course} onEnroll={handleEnroll} enrolling={enrolling} />
          ))}
        </div>
      )}
    </div>
  );
}
