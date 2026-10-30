import React, { useState } from 'react';
import { BrainCircuit, CheckCircle, Clock, Loader, Sparkles, Target, Trophy, XCircle, Zap, AlertCircle } from 'lucide-react';

function QuizQuestion({ item, index, quizId, answers, setAnswers, submitted, showResult }) {
  const chosen = answers[`${quizId}-${index}`];
  const isChosen = j => Number(chosen) === j;
  const isCorrect = j => j === item.answerIndex;

  return (
    <div className={`quiz-question ${submitted ? 'submitted' : ''}`}>
      <div className="q-number">
        <span>Q{index + 1}</span>
        {submitted && (isChosen(item.answerIndex) ? <CheckCircle size={16} className="correct-icon" /> : <XCircle size={16} className="wrong-icon" />)}
      </div>
      <b className="q-text">{item.question}</b>
      <div className="option-grid">
        {item.options.map((op, j) => {
          let cls = 'option';
          if (submitted) {
            if (isCorrect(j)) cls += ' correct';
            else if (isChosen(j) && !isCorrect(j)) cls += ' wrong';
            else cls += ' faded';
          } else if (isChosen(j)) {
            cls += ' chosen';
          }
          return (
            <label key={j} className={cls}>
              <input
                type="radio"
                name={`${quizId}-${index}`}
                checked={isChosen(j)}
                disabled={submitted}
                onChange={() => setAnswers(v => ({ ...v, [`${quizId}-${index}`]: j }))}
              />
              <span className="opt-letter">{String.fromCharCode(65 + j)}</span>
              <span className="opt-text">{op}</span>
              {submitted && isCorrect(j) && <CheckCircle size={14} className="opt-check" />}
            </label>
          );
        })}
      </div>
      {submitted && item.explanation && (
        <div className="explanation">
          <AlertCircle size={14} />
          <div>
            <b>Explanation:</b>
            <p>{item.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizCard({ quiz, answers, setAnswers, onSubmit }) {
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(quiz.questions.length * 60); // 60s per question
  const [timerActive, setTimerActive] = useState(false);

  React.useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(t);
    }
    if (timerActive && timeLeft === 0) handleSubmit();
  }, [timerActive, timeLeft]);

  async function handleSubmit() {
    if (submitting || submitted) return;
    setSubmitting(true);
    setTimerActive(false);
    try {
      const r = await onSubmit(quiz);
      setResult(r);
      setSubmitted(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const answered = quiz.questions.filter((_, i) => answers[`${quiz.id}-${i}`] !== undefined).length;
  const pct = result ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <section className="panel quiz-card">
      <div className="quiz-card-header">
        <div className="quiz-card-title">
          <span className="file-tag">PRACTICE SET</span>
          <h3>{quiz.title}</h3>
          <p className="muted">{quiz.questions.length} questions · Based on course notes</p>
        </div>
        <div className="quiz-card-meta">
          <span className="quiz-symbol"><BrainCircuit /></span>
          {!submitted && (
            <div className="timer-widget">
              <Clock size={13} />
              <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
              {!timerActive && <button className="start-timer-btn" onClick={() => setTimerActive(true)}>Start timer</button>}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!submitted && (
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${(answered / quiz.questions.length) * 100}%` }} />
          <span>{answered}/{quiz.questions.length} answered</span>
        </div>
      )}

      {/* Result banner */}
      {submitted && result && (
        <div className={`result-banner ${pct >= 80 ? 'excellent' : pct >= 60 ? 'good' : 'needs-work'}`}>
          <div className="result-score">
            <Trophy size={24} />
            <span>{result.score}/{result.total}</span>
            <span className="result-pct">{pct}%</span>
          </div>
          <div className="result-info">
            <b>{pct >= 80 ? '🎉 Excellent work!' : pct >= 60 ? '👍 Good job!' : '📚 Keep practicing!'}</b>
            <p>+{result.xpEarned} XP earned · {pct >= 80 ? 'Outstanding performance' : pct >= 60 ? 'Above average' : 'Review the explanations below'}</p>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="questions-list">
        {quiz.questions.map((item, i) => (
          <QuizQuestion
            key={i}
            item={item}
            index={i}
            quizId={quiz.id}
            answers={answers}
            setAnswers={setAnswers}
            submitted={submitted}
            showResult={submitted}
          />
        ))}
      </div>

      {!submitted && (
        <div className="quiz-footer">
          <span className="muted">{quiz.questions.length - answered} questions remaining</span>
          <button
            className="primary"
            onClick={handleSubmit}
            disabled={submitting || answered === 0}
          >
            {submitting ? <><Loader size={15} className="spin" /> Submitting…</> : <>Submit answers <span>→</span></>}
          </button>
        </div>
      )}
    </section>
  );
}

export default function PracticePage({ active, quizzes, answers, setAnswers, onGenerate, onSubmit, generating }) {
  return (
    <>
      <div className="practice-banner">
        <div>
          <span className="hero-pill"><Zap size={13} /> ACTIVE RECALL</span>
          <h2>Make knowledge stick.</h2>
          <p>Generate multiple-choice quizzes directly from your indexed course notes. Get instant feedback with explanations.</p>
        </div>
        <div className="practice-banner-actions">
          <button className="hero-button" disabled={!active || generating} onClick={onGenerate}>
            {generating ? <><Loader size={15} className="spin" /> Generating…</> : <><Sparkles size={16} /> Generate Quiz</>}
          </button>
          {!active && <small style={{ color: '#c4b9e8', display: 'block', marginTop: 8, fontSize: 10 }}>Select a course first</small>}
        </div>
      </div>

      {quizzes.length > 0 && (
        <div className="quiz-stats-row">
          <div className="quiz-stat-chip">
            <Target size={14} />
            <span>{quizzes.length} quiz sets generated</span>
          </div>
          <div className="quiz-stat-chip">
            <Zap size={14} />
            <span>{quizzes.reduce((a, q) => a + q.questions.length, 0)} total questions</span>
          </div>
        </div>
      )}

      <div className="quiz-list">
        {quizzes.length ? quizzes.map(q => (
          <QuizCard key={q.id} quiz={q} answers={answers} setAnswers={setAnswers} onSubmit={onSubmit} />
        )) : (
          <div className="empty-state">
            <span><BrainCircuit size={22} /></span>
            <b>Your next practice set awaits</b>
            <p>Upload and index notes for a course, then click "Generate Quiz" to create AI-powered questions from your material.</p>
          </div>
        )}
      </div>
    </>
  );
}
