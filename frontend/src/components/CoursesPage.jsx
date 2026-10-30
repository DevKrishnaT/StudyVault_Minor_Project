import React, { useState } from 'react';
import { BookOpen, FileText, Plus, Upload, Sparkles } from 'lucide-react';

function Empty({ title, text }) {
  return (
    <div className="empty-state">
      <span><BookOpen size={22} /></span>
      <b>{title}</b>
      <p>{text}</p>
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

export default function CoursesPage({ user, courses, active, setActive, setPage, setCourseDetail, onCreateCourse, onEnroll }) {
  const [courseForm, setCourseForm] = useState({ title: '', description: '' });
  const [enrollId, setEnrollId] = useState('');
  const [creating, setCreating] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try { await onCreateCourse(courseForm); setCourseForm({ title: '', description: '' }); }
    catch (err) { alert(err.message); }
    finally { setCreating(false); }
  }

  async function handleEnroll(e) {
    e.preventDefault();
    if (!enrollId) return;
    setEnrolling(true);
    try { await onEnroll(enrollId); setEnrollId(''); }
    catch (err) { alert(err.message); }
    finally { setEnrolling(false); }
  }

  const isTeacher = ['teacher', 'admin'].includes(user?.role);

  return (
    <>
      <div className="section-head">
        <div>
          <h3>Your courses</h3>
          <p className="muted">Select a course to work with its notes, AI assistant, and quizzes.</p>
        </div>
        {isTeacher && (
          <button className="primary" onClick={() => document.getElementById('course-form')?.scrollIntoView({ behavior: 'smooth' })}>
            <Plus size={17} /> New course
          </button>
        )}
      </div>

      {courses.length ? (
        <div className="course-grid">
          {courses.map(c => (
            <CourseCard
              key={c.id}
              course={c}
              onClick={() => { setActive(c); setPage('AI Study Assistant'); }}
              onViewDetail={(course) => { setCourseDetail(course); setPage('Course Detail'); }}
            />
          ))}
        </div>
      ) : (
        <Empty title="No courses yet" text="A teacher account can create a course. Students can enroll when they have a course ID." />
      )}

      <div className="courses-bottom-grid">
        {/* Enroll */}
        <form className="panel enroll-form" onSubmit={handleEnroll}>
          <div>
            <h3>Enroll with course ID</h3>
            <p className="muted">Enter a course ID shared by your teacher.</p>
          </div>
          <div className="enroll-input-row">
            <input
              value={enrollId}
              onChange={e => setEnrollId(e.target.value)}
              type="number"
              min="1"
              placeholder="Course ID"
              required
            />
            <button className="secondary" disabled={enrolling}>{enrolling ? 'Enrolling…' : 'Enroll'}</button>
          </div>
        </form>

        {/* Create course (teachers only) */}
        {isTeacher && (
          <form id="course-form" className="panel form-panel" onSubmit={handleCreate}>
            <h3><Plus size={18} /> Create a course</h3>
            <label>Course title
              <input required value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="e.g. Database Management Systems" />
            </label>
            <label>Description
              <textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="What will students learn?" />
            </label>
            <button className="primary" disabled={creating}>{creating ? 'Creating…' : 'Create course'}</button>
          </form>
        )}
      </div>
    </>
  );
}
