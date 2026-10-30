import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, BrainCircuit, FileText, Loader, Sparkles, Target, Users, Zap, ChevronDown, ChevronUp, Clock, BarChart2, Star, X } from 'lucide-react';
import { api, json } from '../api';

const TOPICS = ['Introduction & Overview', 'Core Concepts', 'Fundamentals', 'Advanced Topics', 'Practical Applications', 'Case Studies', 'Review & Assessment'];

function SyllabusItem({ item, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`syllabus-item ${open ? 'open' : ''}`}>
      <button className="syllabus-header" onClick={() => setOpen(!open)}>
        <div className="syllabus-num">{String(index + 1).padStart(2, '0')}</div>
        <div className="syllabus-title">
          <b>{item.topic}</b>
          <small>{item.subtopics?.length || 0} subtopics · ~{item.duration || '45'} min</small>
        </div>
        <div className="syllabus-meta">
          <span className={`diff-badge ${item.difficulty || 'medium'}`}>{item.difficulty || 'Medium'}</span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      {open && (
        <div className="syllabus-body">
          {item.subtopics?.map((sub, si) => (
            <div className="subtopic-row" key={si}>
              <span className="subtopic-dot" />
              <span>{sub}</span>
            </div>
          ))}
          {item.objectives && (
            <div className="syllabus-objectives">
              <b>Learning Objectives:</b>
              <p>{item.objectives}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CourseDetailPage({ course, notes, onStudy, onPractice, setPage }) {
  const [syllabus, setSyllabus] = useState(null);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [syllabusError, setSyllabusError] = useState('');
  const [tab, setTab] = useState('overview');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [loadingMaterial, setLoadingMaterial] = useState(false);
  const [materialError, setMaterialError] = useState('');
  const materialRequestId = useRef(0);

  async function openMaterial(note) {
    const requestId = ++materialRequestId.current;
    setSelectedMaterial(note);
    setLoadingMaterial(true);
    setMaterialError('');
    try {
      const material = await api(`/courses/${course.id}/notes/${note.id}`);
      if (materialRequestId.current === requestId) setSelectedMaterial(material);
    } catch (e) {
      if (materialRequestId.current === requestId) setMaterialError(e.message);
    } finally {
      if (materialRequestId.current === requestId) setLoadingMaterial(false);
    }
  }

  function closeMaterial() {
    materialRequestId.current += 1;
    setSelectedMaterial(null);
    setLoadingMaterial(false);
    setMaterialError('');
  }

  async function generateSyllabus() {
    setLoadingSyllabus(true);
    setSyllabusError('');
    try {
      const data = await api(`/courses/${course.id}/syllabus`, json('POST', {}));
      setSyllabus(data.syllabus);
    } catch (e) {
      setSyllabusError(e.message);
    } finally {
      setLoadingSyllabus(false);
    }
  }

  useEffect(() => {
    // Try to load saved syllabus
    api(`/courses/${course.id}/syllabus`).then(d => setSyllabus(d.syllabus)).catch(() => {});
  }, [course.id]);

  const stats = [
    { icon: FileText, label: 'Materials', value: course.note_count || 0 },
    { icon: Users, label: 'Students', value: course.student_count || '—' },
    { icon: Target, label: 'Quizzes', value: course.quiz_count || 0 },
    { icon: Clock, label: 'Est. Hours', value: notes.length ? notes.length * 2 : '—' },
  ];

  return (
    <div className="course-detail">
      {/* Hero */}
      <div className="cd-hero">
        <div className="cd-hero-bg" />
        <button className="back-btn" onClick={() => setPage('My Courses')}>← Back to Courses</button>
        <div className="cd-hero-content">
          <div className="cd-icon"><BookOpen size={40} /></div>
          <div className="cd-hero-info">
            <span className="eyebrow">COURSE</span>
            <h2>{course.title}</h2>
            <p>{course.description || 'Your dedicated space for learning and in-depth revision.'}</p>
            <div className="cd-badges">
              <span className="cd-badge"><Star size={12} /> {course.note_count || 0} materials</span>
              <span className="cd-badge"><Users size={12} /> Created by {course.creator || 'Teacher'}</span>
            </div>
          </div>
          <div className="cd-hero-actions">
            <button className="primary" onClick={onStudy}><BrainCircuit size={16} /> Study with AI</button>
            <button className="secondary" onClick={onPractice}><Zap size={16} /> Take Practice Quiz</button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="cd-stats">
        {stats.map(({ icon: Icon, label, value }) => (
          <div className="cd-stat" key={label}>
            <Icon size={16} />
            <span className="cd-stat-val">{value}</span>
            <span className="cd-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="cd-tabs">
        {['overview', 'syllabus', 'materials'].map(t => (
          <button key={t} className={`cd-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="cd-body">
          <div className="cd-overview-grid">
            <div className="panel">
              <h3>About this course</h3>
              <p style={{ fontSize: 13, lineHeight: 1.8, color: '#545872', marginTop: 12 }}>
                {course.description || 'This course covers key concepts and practical skills in the subject area. Upload your study notes and the AI will help you understand and practice the material.'}
              </p>
              <div className="cd-what-learn">
                <h4><Target size={15} /> What you'll learn</h4>
                <div className="learn-grid">
                  {['Understand core concepts', 'Apply knowledge through practice', 'Get AI-powered explanations', 'Test yourself with smart quizzes'].map(item => (
                    <div className="learn-item" key={item}>
                      <span className="learn-check">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="cd-sidebar">
              <div className="panel">
                <h3><BarChart2 size={15} /> Quick Actions</h3>
                <div className="cd-actions">
                  <button className="cd-action-btn primary full" onClick={onStudy}>
                    <BrainCircuit size={16} /> Study with AI Tutor
                  </button>
                  <button className="cd-action-btn secondary full" onClick={onPractice}>
                    <Zap size={16} /> Generate Practice Quiz
                  </button>
                  <button className="cd-action-btn secondary full" onClick={() => setPage('Notes & Files')}>
                    <FileText size={16} /> Upload Notes
                  </button>
                </div>
              </div>
              <div className="panel" style={{ marginTop: 14 }}>
                <h3><Sparkles size={15} /> AI Features</h3>
                <p style={{ fontSize: 11, color: '#9699ad', lineHeight: 1.7, marginTop: 8 }}>
                  Upload your course notes and unlock:<br />
                  • Smart Q&A from your notes<br />
                  • Auto-generated topic quizzes<br />
                  • AI-generated course syllabus<br />
                  • Intelligent study suggestions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'syllabus' && (
        <div className="cd-body">
          <div className="syllabus-header-row">
            <div>
              <h3>Course Syllabus</h3>
              <p className="muted">AI-generated outline based on your uploaded course materials</p>
            </div>
            <button
              className={`primary ${loadingSyllabus ? 'loading' : ''}`}
              onClick={generateSyllabus}
              disabled={loadingSyllabus || !notes.length}
              title={!notes.length ? 'Upload notes first to generate syllabus' : ''}
            >
              {loadingSyllabus ? <><Loader size={15} className="spin" /> Generating…</> : <><Sparkles size={15} /> {syllabus ? 'Regenerate' : 'Generate'} Syllabus</>}
            </button>
          </div>

          {syllabusError && <div className="error-banner">{syllabusError}</div>}

          {!notes.length && (
            <div className="empty-state">
              <span><FileText size={22} /></span>
              <b>Upload notes first</b>
              <p>The AI generates a course syllabus from your uploaded study materials. Upload at least one note to get started.</p>
              <button className="primary" style={{ marginTop: 14 }} onClick={() => setPage('Notes & Files')}>Upload Notes</button>
            </div>
          )}

          {syllabus && (
            <div className="syllabus-list">
              {syllabus.map((item, i) => <SyllabusItem key={i} item={item} index={i} />)}
            </div>
          )}

          {!syllabus && notes.length > 0 && !loadingSyllabus && (
            <div className="empty-state">
              <span><Sparkles size={22} /></span>
              <b>Generate your course syllabus</b>
              <p>Click "Generate Syllabus" to let AI create a structured learning outline based on your uploaded notes.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'materials' && (
        <div className="cd-body">
          <div className="section-head">
            <h3>Course Materials</h3>
            <button className="secondary" onClick={() => setPage('Notes & Files')}>+ Upload Note</button>
          </div>
          {notes.length ? (
            <div className="materials-list">
              {notes.map(n => (
                <button className="material-card" key={n.id} onClick={() => openMaterial(n)}>
                  <div className="material-icon"><FileText size={20} /></div>
                  <div className="material-info">
                    <b>{n.title}</b>
                    <small>{n.original_name} · {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
                  </div>
                  <span className="indexed-badge">Open material</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span><FileText size={22} /></span>
              <b>No materials yet</b>
              <p>Upload .txt or .md files to make them available to the AI assistant and quiz generator.</p>
              <button className="primary" style={{ marginTop: 14 }} onClick={() => setPage('Notes & Files')}>Upload Notes</button>
            </div>
          )}
        </div>
      )}

      {selectedMaterial && (
        <div className="material-modal-backdrop" onClick={closeMaterial}>
          <section
            className="material-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="material-modal-title"
            onClick={e => e.stopPropagation()}
          >
            <header className="material-modal-header">
              <div>
                <h3 id="material-modal-title">{selectedMaterial.title}</h3>
                <p className="muted">{selectedMaterial.original_name}</p>
              </div>
              <button className="icon-btn" onClick={closeMaterial} aria-label="Close material">
                <X size={18} />
              </button>
            </header>
            {materialError ? (
              <div className="error-banner">{materialError}</div>
            ) : loadingMaterial ? (
              <div className="material-loading"><Loader size={18} className="spin" /> Loading material…</div>
            ) : (
              <pre className="material-content">{selectedMaterial.content}</pre>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
