import React, { useState } from 'react';
import { BookOpen, MessageSquare, Send } from 'lucide-react';

const initials = n => (n || 'S').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

export default function CommunityPage({ active, courses, setActive, posts, post, setPost, onSendPost }) {
  const [sending, setSending] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    setSending(true);
    try { await onSendPost(e); }
    catch (err) { alert(err.message); }
    finally { setSending(false); }
  }

  return (
    <div className="two-col">
      <section className="panel form-panel">
        <h3><MessageSquare size={18} /> Course discussion</h3>
        <p className="muted">Share questions, helpful explanations, and study tips.</p>
        <label>Course
          <select value={active?.id || ''} onChange={e => setActive(courses.find(c => String(c.id) === e.target.value) || null)}>
            <option value="">Select a course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </label>
        <form onSubmit={handleSend}>
          <label>Your post
            <textarea
              value={post}
              onChange={e => setPost(e.target.value)}
              placeholder="What are you working through today?"
            />
          </label>
          <button className="primary" disabled={!active || !post.trim() || sending}>
            <Send size={16} /> {sending ? 'Posting…' : 'Share post'}
          </button>
        </form>
      </section>

      <section className="panel form-panel">
        <h3>Latest discussions</h3>
        {posts.length ? posts.map(p => (
          <div className="post" key={p.id}>
            <div className="post-head">
              <span className="avatar tiny-avatar">{initials(p.name)}</span>
              <div>
                <b>{p.name}</b>
                <small>{p.role} · {new Date(p.created_at).toLocaleString()}</small>
              </div>
            </div>
            <p>{p.body}</p>
          </div>
        )) : (
          <div className="empty-state">
            <span><MessageSquare size={22} /></span>
            <b>Start the conversation</b>
            <p>Choose a course and share the first question or study tip.</p>
          </div>
        )}
      </section>
    </div>
  );
}
