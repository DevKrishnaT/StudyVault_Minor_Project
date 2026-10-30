import React, { useState } from 'react';
import { BookOpen, FileText, Sparkles, Upload } from 'lucide-react';

export default function NotesPage({ active, courses, setActive, notes, onUpload }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    e.preventDefault();
    const f = e.target.file.files[0];
    if (!f) return;
    setUploading(true);
    try { await onUpload(e); }
    finally { setUploading(false); }
  }

  return (
    <div className="two-col">
      {/* Upload panel */}
      <section className="panel form-panel">
        <div className="section-head">
          <h3><Upload size={18} /> Upload study material</h3>
          <span className="file-tag">TXT · MD</span>
        </div>
        <p className="muted">Files are chunked and embedded so the AI assistant can retrieve relevant passages using semantic search.</p>
        {active && (
          <p className="active-course">
            <BookOpen size={15} /> Uploading to: <b>{active.title}</b>
          </p>
        )}
        <form onSubmit={handleUpload}>
          <label>Course
            <select required value={active?.id || ''} onChange={e => setActive(courses.find(c => String(c.id) === e.target.value) || null)}>
              <option value="">Select a course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <label>Display name
            <input name="title" placeholder="e.g. Unit 1 — Introduction" />
          </label>
          <label className="dropzone">
            <Upload size={26} />
            <b>Choose a text file</b>
            <span>TXT or Markdown · max 2 MB</span>
            <input required name="file" type="file" accept=".txt,.md,text/plain,text/markdown" />
          </label>
          <button className="primary full" disabled={!active || uploading}>
            {uploading ? <>Uploading & indexing…</> : <><Upload size={16} /> Upload & index notes</>}
          </button>
        </form>
        <div className="note-info">
          <Sparkles size={16} />
          <span><b>RAG pipeline</b> — ingest → chunk → embed → retrieve → generate. No custom model training required.</span>
        </div>
      </section>

      {/* Notes list */}
      <section className="panel form-panel">
        <h3>Your materials</h3>
        <p className="muted">{active ? `Files for ${active.title}` : 'Choose a course to see its notes'}</p>
        {notes.length ? notes.map(n => (
          <div className="file-list-row" key={n.id}>
            <span className="file-icon"><FileText /></span>
            <div>
              <b>{n.title}</b>
              <small>{n.original_name} · {new Date(n.created_at).toLocaleDateString()}</small>
            </div>
            <span className="indexed">Indexed</span>
          </div>
        )) : (
          <div className="empty-state">
            <span><FileText size={22} /></span>
            <b>No notes yet</b>
            <p>Upload a .txt or .md file to make it available to the AI assistant.</p>
          </div>
        )}
      </section>
    </div>
  );
}
