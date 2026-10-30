import React, { useEffect, useState } from 'react';
import { api, json, getToken } from './api';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import OverviewPage from './components/OverviewPage';
import CourseDetailPage from './components/CourseDetailPage';
import AIAssistantPage from './components/AIAssistantPage';
import CoursesPage from './components/CoursesPage';
import NotesPage from './components/NotesPage';
import PracticePage from './components/PracticePage';
import LeaderboardPage from './components/LeaderboardPage';
import CommunityPage from './components/CommunityPage';
import CourseCatalogPage from './components/CourseCatalogPage';

const initials = n => (n || 'S').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

export default function App() {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('Browse Courses');
  const [courses, setCourses] = useState([]);
  const [active, setActive] = useState(null);
  const [progress, setProgress] = useState({});
  const [notes, setNotes] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);
  const [busy, setBusy] = useState(false);
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState('');
  const [notice, setNotice] = useState({ msg: '', type: 'info' });
  const [quizAnswers, setQuizAnswers] = useState({});
  const [courseDetail, setCourseDetail] = useState(null);
  const [generating, setGenerating] = useState(false);

  const flash = (msg, type = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice({ msg: '', type: 'info' }), 4000);
  };

  async function load() {
    try {
      const [u, c, p] = await Promise.all([api('/me'), api('/courses'), api('/progress')]);
      setUser(u);
      setCourses(c);
      setProgress(p);
      if (!active && c.length) setActive(c[0]);
    } catch {
      localStorage.removeItem('sv_token');
      setToken('');
    }
  }

  useEffect(() => { if (token) load(); }, [token]);

  useEffect(() => {
    if (!token || !active) {
      setNotes([]);
      return;
    }
    let current = true;
    setNotes([]);
    api(`/courses/${active.id}/notes`)
      .then(data => { if (current) setNotes(data); })
      .catch(() => { if (current) setNotes([]); });
    api(`/courses/${active.id}/quizzes`).then(setQuizzes).catch(() => {});
    api(`/courses/${active.id}/forum`).then(setPosts).catch(() => {});
    return () => { current = false; };
  }, [token, active?.id]);

  async function authenticate(mode, form) {
    const d = await api(`/auth/${mode}`, json('POST', form));
    localStorage.setItem('sv_token', d.token);
    setToken(d.token);
    setUser(d.user);
    flash('Welcome to StudyVault!');
  }

  function logout() {
    localStorage.removeItem('sv_token');
    setToken(''); setUser(null); setActive(null);
    setCourses([]); setChat([]);
  }

  async function enrollCourse(id) {
    await api(`/courses/${id}/enroll`, { method: 'POST' });
    await load();
    flash('Enrolled successfully!');
  }

  async function uploadNote(e) {
    e.preventDefault();
    const f = e.target.file.files[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    fd.append('title', e.target.title.value || f.name);
    await api(`/courses/${active.id}/notes`, { method: 'POST', body: fd });
    setNotes(await api(`/courses/${active.id}/notes`));
    e.target.reset();
    flash('Note uploaded and indexed for AI!');
  }

  async function ask(e) {
    e.preventDefault();
    if (!question.trim() || !active) return;
    const q = question;
    setQuestion('');
    setChat(c => [...c, { role: 'user', text: q }]);
    setBusy(true);
    try {
      const d = await api('/ai/ask', json('POST', { courseId: active.id, question: q }));
      setChat(c => [...c, { role: 'assistant', text: d.answer, sources: d.sources }]);
    } catch (e) {
      setChat(c => [...c, { role: 'assistant', text: e.message }]);
    } finally {
      setBusy(false);
    }
  }

  async function makeQuiz() {
    setGenerating(true);
    try {
      const q = await api(`/courses/${active.id}/quizzes/generate`, json('POST', { count: 5 }));
      setQuizzes(v => [q, ...v]);
      setPage('Practice');
      flash('Practice quiz generated!');
    } catch (e) {
      flash(e.message, 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function submitQuiz(q) {
    const a = q.questions.map((_, i) => quizAnswers[`${q.id}-${i}`] ?? -1);
    const r = await api(`/quizzes/${q.id}/attempt`, json('POST', { answers: a }));
    flash(`Score: ${r.score}/${r.total} · +${r.xpEarned} XP`);
    setProgress(await api('/progress'));
    return r;
  }

  async function sendPost(e) {
    e.preventDefault();
    await api(`/courses/${active.id}/forum`, json('POST', { body: post }));
    setPost('');
    setPosts(await api(`/courses/${active.id}/forum`));
  }

  if (!token) {
    return (
      <>
        <AuthPage onAuth={authenticate} />
        {notice.msg && <div className={`toast toast--${notice.type}`}><span>✦</span>{notice.msg}</div>}
      </>
    );
  }

  // Pages that manage their own content area (no wrapper needed)
  const FULL_PAGES = ['Browse Courses', 'Overview', 'Course Detail'];

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} user={user} progress={progress} logout={logout} />

      <main className="main">
        <header className="topbar">
          <div className="crumb">
            StudyVault <span>/</span>
            <b>{page === 'Course Detail' && courseDetail ? courseDetail.title : page}</b>
          </div>
          <div className="top-right">
            <span className="date-chip">
              {active ? `📚 ${active.title?.slice(0, 28)}${active.title?.length > 28 ? '…' : ''}` : ''}
            </span>
            <div className="avatar small">{initials(user?.name)}</div>
          </div>
        </header>

        {/* Pages that render their own content wrapper */}
        {page === 'Browse Courses' && (
          <CourseCatalogPage
            user={user}
            setPage={setPage}
            setSelectedCourseId={async (id) => {
              let found = courses.find(c => c.id === id);
              if (!found) {
                const refreshedCourses = await api('/courses');
                setCourses(refreshedCourses);
                found = refreshedCourses.find(c => c.id === id);
              }
              if (!found) {
                flash('Enroll in this course before opening it.', 'error');
                return;
              }
              setActive(found);
              setCourseDetail(found);
              setPage('Course Detail');
            }}
          />
        )}

        {page === 'Overview' && (
          <OverviewPage
            user={user}
            courses={courses}
            progress={progress}
            setPage={setPage}
            setActive={setActive}
            setCourseDetail={setCourseDetail}
          />
        )}

        {page === 'Course Detail' && courseDetail && (
          <div className="content">
            <CourseDetailPage
              course={courseDetail}
              notes={notes}
              onStudy={() => { setActive(courseDetail); setPage('AI Study Assistant'); }}
              onPractice={() => { setActive(courseDetail); makeQuiz(); }}
              setPage={setPage}
            />
          </div>
        )}

        {/* Standard pages inside content wrapper */}
        {!FULL_PAGES.includes(page) && page !== 'Course Detail' && (
          <div className="content">
            {page !== 'Practice' && (
              <div className="welcome-row">
                <div>
                  <h1>{page}</h1>
                  <p className="muted" style={{ marginTop: 4 }}>
                    {{
                      'My Courses': 'Your enrolled courses.',
                      'AI Study Assistant': 'Ask anything about your course — powered by Gemini.',
                      'Notes & Files': 'Upload your own extra notes to enhance AI answers.',
                      'Practice': 'AI-generated quizzes from your course material.',
                      'Leaderboard': 'Top learners ranked by XP earned.',
                      'Community': 'Discuss course topics with fellow learners.',
                    }[page] || ''}
                  </p>
                </div>
                {page === 'Practice' && (
                  <button className="primary" disabled={!active || generating} onClick={makeQuiz}>
                    {generating ? 'Generating…' : '✦ Generate Quiz'}
                  </button>
                )}
              </div>
            )}

            {page === 'My Courses' && (
              <CoursesPage
                user={user}
                courses={courses}
                active={active}
                setActive={setActive}
                setPage={setPage}
                setCourseDetail={setCourseDetail}
                onCreateCourse={async (form) => {
                  await api('/courses', json('POST', form));
                  await load();
                  flash('Course created!');
                }}
                onEnroll={enrollCourse}
              />
            )}

            {page === 'AI Study Assistant' && (
              <AIAssistantPage
                active={active}
                courses={courses}
                setActive={setActive}
                notes={notes}
                user={user}
                chat={chat}
                setChat={setChat}
                question={question}
                setQuestion={setQuestion}
                busy={busy}
                setBusy={setBusy}
                ask={ask}
                setPage={setPage}
              />
            )}

            {page === 'Notes & Files' && (
              <NotesPage
                active={active}
                courses={courses}
                setActive={setActive}
                notes={notes}
                onUpload={uploadNote}
              />
            )}

            {page === 'Practice' && (
              <PracticePage
                active={active}
                quizzes={quizzes}
                answers={quizAnswers}
                setAnswers={setQuizAnswers}
                onGenerate={makeQuiz}
                onSubmit={submitQuiz}
                generating={generating}
              />
            )}

            {page === 'Leaderboard' && <LeaderboardPage user={user} />}

            {page === 'Community' && (
              <CommunityPage
                active={active}
                courses={courses}
                setActive={setActive}
                posts={posts}
                post={post}
                setPost={setPost}
                onSendPost={sendPost}
              />
            )}
          </div>
        )}
      </main>

      {notice.msg && (
        <div className={`toast toast--${notice.type}`}>
          <span>{notice.type === 'error' ? '✗' : '✦'}</span>
          {notice.msg}
          <button onClick={() => setNotice({ msg: '', type: 'info' })}>×</button>
        </div>
      )}
    </div>
  );
}