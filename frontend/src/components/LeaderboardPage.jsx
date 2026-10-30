import React, { useEffect, useState } from 'react';
import { Crown, Flame, Medal, Star, Trophy, Zap } from 'lucide-react';
import { api } from '../api';

const initials = n => (n || 'S').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
const COLORS = ['#6757e8', '#e8a245', '#43b884', '#5597e4', '#e87257', '#9b57e8'];

function RankBadge({ rank }) {
  if (rank === 1) return <Crown size={18} style={{ color: '#f5c842' }} />;
  if (rank === 2) return <Medal size={18} style={{ color: '#a8b2be' }} />;
  if (rank === 3) return <Medal size={18} style={{ color: '#cd7f32' }} />;
  return <span className="rank-num">#{rank}</span>;
}

export default function LeaderboardPage({ user }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/leaderboard').then(setLeaders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const myRank = leaders.findIndex(l => l.id === user?.id) + 1;

  return (
    <>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">HALL OF FAME</span>
          <h1>Leaderboard 🏆</h1>
          <p className="muted">Top learners ranked by experience points. Keep studying to climb the ranks!</p>
        </div>
      </div>

      {myRank > 0 && (
        <div className="my-rank-banner">
          <Trophy size={20} />
          <div>
            <b>Your Rank: #{myRank}</b>
            <small>{leaders[myRank - 1]?.xp || 0} XP · {leaders[myRank - 1]?.streak || 0} day streak</small>
          </div>
          {myRank <= 3 && <span className="top-badge">TOP 3! 🎉</span>}
        </div>
      )}

      {/* Podium */}
      {leaders.length >= 3 && (
        <div className="podium">
          <div className="podium-place second">
            <div className="pod-avatar" style={{ background: COLORS[1] }}>{initials(leaders[1]?.name)}</div>
            <div className="pod-name">{leaders[1]?.name?.split(' ')[0]}</div>
            <div className="pod-xp"><Zap size={12} /> {leaders[1]?.xp} XP</div>
            <div className="pod-step" style={{ height: 60 }}>2</div>
          </div>
          <div className="podium-place first">
            <div className="pod-crown"><Crown size={20} style={{ color: '#f5c842' }} /></div>
            <div className="pod-avatar" style={{ background: COLORS[0] }}>{initials(leaders[0]?.name)}</div>
            <div className="pod-name">{leaders[0]?.name?.split(' ')[0]}</div>
            <div className="pod-xp"><Zap size={12} /> {leaders[0]?.xp} XP</div>
            <div className="pod-step" style={{ height: 85 }}>1</div>
          </div>
          <div className="podium-place third">
            <div className="pod-avatar" style={{ background: COLORS[2] }}>{initials(leaders[2]?.name)}</div>
            <div className="pod-name">{leaders[2]?.name?.split(' ')[0]}</div>
            <div className="pod-xp"><Zap size={12} /> {leaders[2]?.xp} XP</div>
            <div className="pod-step" style={{ height: 45 }}>3</div>
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="panel" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16 }}>All Participants</h3>
        {loading && <div className="loading-list"><div className="loading-shimmer" /><div className="loading-shimmer" /><div className="loading-shimmer" /></div>}
        {!loading && leaders.map((l, i) => (
          <div key={l.id} className={`leader-row ${l.id === user?.id ? 'mine' : ''}`}>
            <div className="leader-rank"><RankBadge rank={i + 1} /></div>
            <div className="leader-avatar" style={{ background: COLORS[i % COLORS.length] }}>{initials(l.name)}</div>
            <div className="leader-info">
              <b>{l.name} {l.id === user?.id && <span className="you-badge">You</span>}</b>
              <small>{l.role} · {l.streak || 0} day streak</small>
            </div>
            <div className="leader-stats">
              <span><Flame size={12} /> {l.streak || 0}</span>
              <span><Star size={12} /> {l.accuracy || 0}%</span>
              <span className="xp-chip"><Zap size={12} /> {l.xp} XP</span>
            </div>
          </div>
        ))}
        {!loading && !leaders.length && (
          <div className="empty-state">
            <span><Trophy size={22} /></span>
            <b>No data yet</b>
            <p>Complete quizzes to earn XP and appear on the leaderboard!</p>
          </div>
        )}
      </div>
    </>
  );
}
