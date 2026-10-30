import React from 'react';
import { BookOpen, BrainCircuit, FileText, Flame, Sparkles, Users, Zap, ChartNoAxesColumn, Plus } from 'lucide-react';

const initials = n => (n || 'S').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

function Stat({ icon: Icon, label, value, suffix, sub, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><Icon size={19} /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}<small>{suffix}</small></div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function CourseCard({ course, onClick, onViewDetail }) {
  const colors = ['purple', 'teal', 'orange', 'blue', 'pink'];
  const color = colors[course.id % colors.length];
  return (
    <div className={`course-card course-card--${color}`}>
      <div className="course-cover">
        <span className="cover-icon"><BookOpen /></span>
        <span className="cover-count">{course.note_count || 0} materials</span>
        <div className="cover-lines"><i /><i /><i /></div>
      </div>
      <div className="course-card-body">
        <span className="course-tag">COURSE</span>
        <h4>{course.title}</h4>
        <p>{course.description || 'Your dedicated space for learning and revision.'}</p>
        <div className="course-card-foot">
          <span><FileText size={14} /> {course.note_count || 0} notes</span>
          <div className="course-actions">
            <button className="course-detail-btn" onClick={e => { e.stopPropagation(); onViewDetail(course); }}>Details</button>
            <button className="course-study-btn" onClick={onClick}>Study ↗</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty({ title, text, icon: Icon = BookOpen }) {
  return (
    <div className="empty-state">
      <span><Icon size={22} /></span>
      <b>{title}</b>
      <p>{text}</p>
    </div>
  );
}

export default function OverviewPage({ user, courses, progress, setPage, setActive, setCourseDetail }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">{today.toUpperCase()}</span>
          <h1>Good {getGreeting()}, {user?.name?.split(' ')[0] || 'learner'} 👋</h1>
          <p className="muted">A little progress each day adds up to big results.</p>
        </div>
        <button className="primary" onClick={() => setPage('AI Study Assistant')}>
          <BrainCircuit size={16} /> Ask AI Tutor
        </button>
      </div>

      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="hero-pill"><Sparkles size={13} /> YOUR STUDY SPACE</span>
          <h2>Make today<br />count.</h2>
          <p>Learn at your own pace. Your next breakthrough might be one question away.</p>
          <button className="hero-button" onClick={() => setPage('AI Study Assistant')}>
            Ask your AI study buddy <span>↗</span>
          </button>
        </div>
        <div className="hero-graphic">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-book"><BookOpen size={57} /></div>
          <div className="float-note note-one"><BrainCircuit size={18} /><span>Learn deeply</span></div>
          <div className="float-note note-two"><Zap size={18} /><span>+{progress.xp || 0} XP</span></div>
          <div className="spark s1">✦</div>
          <div className="spark s2">✧</div>
        </div>
      </section>

      {/* Stats */}
      <section className="stat-grid">
        <Stat icon={Flame} label="Day streak" value={progress.streak || 0} suffix="days" sub="Consistency is key" color="orange" />
        <Stat icon={Zap} label="Experience points" value={progress.xp || 0} suffix="XP" sub="Keep showing up" color="purple" />
        <Stat icon={BrainCircuit} label="Quiz accuracy" value={progress.accuracy || 0} suffix="%" sub={`${progress.attempts || 0} attempts completed`} color="blue" />
        <Stat icon={FileText} label="Notes indexed" value={progress.notes || 0} suffix="files" sub="Ready for AI retrieval" color="green" />
      </section>

      {/* Recent courses */}
      <section className="section-block">
        <div className="section-head">
          <div>
            <h3>Pick up where you left off</h3>
            <p className="muted">Your learning journey, at a glance.</p>
          </div>
          <button className="text-btn" onClick={() => setPage('My Courses')}>All courses <span>→</span></button>
        </div>
        {courses.length ? (
          <div className="course-grid">
            {courses.slice(0, 3).map(c => (
              <CourseCard
                key={c.id}
                course={c}
                onClick={() => { setActive(c); setPage('AI Study Assistant'); }}
                onViewDetail={(course) => { setCourseDetail(course); setPage('Course Detail'); }}
              />
            ))}
          </div>
        ) : (
          <Empty title="Your learning starts here" text="Create a course as a teacher or enroll in a course to start organizing your study material." />
        )}
      </section>

      {/* Quick actions */}
      <section className="quick-grid">
        <button className="quick-card" onClick={() => setPage('AI Study Assistant')}>
          <span className="quick-icon violet"><BrainCircuit /></span>
          <span><b>Ask your AI study buddy</b><small>Get course-grounded explanations</small></span>
          <span className="arrow">↗</span>
        </button>
        <button className="quick-card" onClick={() => setPage('Notes & Files')}>
          <span className="quick-icon mint"><FileText /></span>
          <span><b>Upload study notes</b><small>Make your materials searchable</small></span>
          <span className="arrow">↗</span>
        </button>
        <button className="quick-card" onClick={() => setPage('Practice')}>
          <span className="quick-icon peach"><Zap /></span>
          <span><b>Practice & revise</b><small>Generate a quiz from your notes</small></span>
          <span className="arrow">↗</span>
        </button>
      </section>
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
