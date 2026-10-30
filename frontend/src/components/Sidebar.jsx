import React from 'react';
import {
  BookOpen, BrainCircuit, ChartNoAxesColumn, FileText, Flame,
  GraduationCap, LogOut, MessageSquare, Sparkles, Trophy, Users, Zap, Compass, Library
} from 'lucide-react';

const initials = n => (n || 'S').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

const DISCOVER_NAV = [
  ['Browse Courses', Compass],
  ['Overview', ChartNoAxesColumn],
];

const LEARN_NAV = [
  ['My Courses', Library],
  ['AI Study Assistant', BrainCircuit],
  ['Practice', Zap],
  ['Notes & Files', FileText],
  ['Leaderboard', Trophy],
  ['Community', Users],
];

export default function Sidebar({ page, setPage, user, progress, logout }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon"><GraduationCap /></span>
        <span>StudyVault</span>
      </div>

      <div className="workspace-label">DISCOVER</div>
      <nav style={{ marginBottom: 8 }}>
        {DISCOVER_NAV.map(([n, Icon]) => (
          <button
            key={n}
            className={`nav-item ${page === n ? 'selected' : ''}`}
            onClick={() => setPage(n)}
          >
            <Icon size={18} />
            <span>{n}</span>
          </button>
        ))}
      </nav>

      <div className="workspace-label">LEARN</div>
      <nav>
        {LEARN_NAV.map(([n, Icon]) => (
          <button
            key={n}
            className={`nav-item ${page === n ? 'selected' : ''}`}
            onClick={() => setPage(n)}
          >
            <Icon size={18} />
            <span>{n}</span>
            {n === 'AI Study Assistant' && <span className="nav-badge ai">AI</span>}
            {n === 'Practice' && <span className="nav-badge practice">NEW</span>}
          </button>
        ))}
      </nav>


      <div className="side-bottom">
        <div className="streak-widget">
          <div className="streak-row">
            <span className="streak-icon"><Flame size={15} /></span>
            <span className="streak-val">{progress.streak || 0}</span>
            <span className="streak-label">day streak</span>
          </div>
          <div className="streak-row">
            <span className="streak-icon xp"><Zap size={14} /></span>
            <span className="streak-val">{progress.xp || 0}</span>
            <span className="streak-label">XP earned</span>
          </div>
          <div className="streak-tip">
            <Sparkles size={11} />
            <span>Every session is progress. Keep it up!</span>
          </div>
        </div>

        <div className="profile">
          <div className="avatar">{initials(user?.name)}</div>
          <div className="profile-info">
            <b>{user?.name}</b>
            <small className={`role-badge ${user?.role}`}>{user?.role || 'student'}</small>
          </div>
          <button className="icon-btn" title="Sign out" onClick={logout}>
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
