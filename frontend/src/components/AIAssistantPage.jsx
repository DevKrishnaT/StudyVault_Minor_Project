import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, BrainCircuit, FileText, Lightbulb, Send, Sparkles, X, RefreshCw, Copy, Check } from 'lucide-react';

const initials = n => (n || 'S').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

const SUGGESTIONS = [
  'Explain the key concepts in simple terms',
  'Summarize the main topics covered',
  'Give me practice questions on this topic',
  'What are the most important definitions?',
  'Explain this like I\'m a beginner',
  'Create a study plan for this course',
];

function MessageBubble({ msg, user }) {
  const [copied, setCopied] = useState(false);

  function copyText() {
    navigator.clipboard.writeText(msg.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={`message ${msg.role}`}>
      <div className="message-avatar">
        {msg.role === 'assistant' ? <BrainCircuit size={15} /> : initials(user?.name)}
      </div>
      <div className="message-body">
        <div className="message-header">
          <b>{msg.role === 'assistant' ? 'StudyVault AI' : 'You'}</b>
          {msg.role === 'assistant' && (
            <button className="copy-btn" onClick={copyText} title="Copy response">
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          )}
        </div>
        <div className="message-text">{formatMessage(msg.text)}</div>
        {msg.sources?.length > 0 && (
          <div className="sources">
            <small>RETRIEVED FROM YOUR NOTES</small>
            {msg.sources.map((s, i) => (
              <div key={i} className="source-item">
                <div className="source-label"><FileText size={11} /> {s.label}</div>
                <p>{s.excerpt}…</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatMessage(text) {
  const lines = text.split('\n');
  const blocks = [];
  let listItems = [];
  let listType = null;
  let codeLines = null;

  const flushList = () => {
    if (!listItems.length) return;
    const List = listType === 'ordered' ? 'ol' : 'ul';
    blocks.push(
      <List key={`list-${blocks.length}`}>
        {listItems.map((item, index) => <li key={index}>{formatInline(item)}</li>)}
      </List>
    );
    listItems = [];
    listType = null;
  };

  const flushCode = () => {
    blocks.push(<pre key={`code-${blocks.length}`}><code>{codeLines.join('\n')}</code></pre>);
    codeLines = null;
  };

  lines.forEach((line, index) => {
    if (codeLines) {
      if (/^\s*```/.test(line)) flushCode();
      else codeLines.push(line);
      return;
    }

    if (/^\s*```/.test(line)) {
      flushList();
      codeLines = [];
      return;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      const Heading = `h${level}`;
      blocks.push(<Heading className="markdown-heading" key={index}>{formatInline(heading[2])}</Heading>);
      return;
    }

    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const unordered = line.match(/^\s*(?:[-*+] |• )(.+)$/);
    if (ordered || unordered) {
      const type = ordered ? 'ordered' : 'unordered';
      if (listType && listType !== type) flushList();
      listType = type;
      listItems.push((ordered || unordered)[1]);
      return;
    }

    flushList();
    if (!line.trim()) {
      blocks.push(<br key={index} />);
      return;
    }

    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      blocks.push(<blockquote key={index}>{formatInline(quote[1])}</blockquote>);
      return;
    }

    blocks.push(<p key={index}>{formatInline(line)}</p>);
  });

  flushList();
  if (codeLines) flushCode();

  return (
    <div className="msg-content">
      {blocks}
    </div>
  );
}

function formatInline(text) {
  const parts = text.split(/(\*\*.+?\*\*|__.+?__|`[^`]+`|\*[^*]+?\*|_[^_]+?_)/g);
  return parts.map((part, index) => {
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export default function AIAssistantPage({ active, courses, setActive, notes, user, chat, setChat, question, setQuestion, busy, setBusy, ask }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, busy]);

  function clearChat() {
    if (window.confirm('Clear chat history?')) setChat([]);
  }

  return (
    <div className="workspace-grid">
      <section className="panel chat-panel">
        <div className="panel-heading">
          <div className="ai-avatar"><BrainCircuit /></div>
          <div>
            <h3>StudyVault AI</h3>
            <p><span className="live-dot" /> Grounded in your course material</p>
          </div>
          <span className="context-chip">{active?.title || 'No course selected'}</span>
          {chat.length > 0 && (
            <button className="icon-btn" onClick={clearChat} title="Clear chat"><RefreshCw size={15} /></button>
          )}
        </div>

        <div className="chat-context">
          <Sparkles size={16} />
          <span>Answers use relevant passages from your uploaded notes. The AI will be honest when it can't find an answer in your material.</span>
        </div>

        <div className="chat-messages">
          {!chat.length && (
            <div className="chat-empty">
              <div className="big-ai"><BrainCircuit size={32} /></div>
              <h3>What are you curious about?</h3>
              <p>Ask anything about your course material to get started.</p>
              <div className="suggestions">
                {SUGGESTIONS.slice(0, 4).map(s => (
                  <button key={s} className="suggestion-chip" onClick={() => setQuestion(s)}>{s} ↗</button>
                ))}
              </div>
            </div>
          )}

          {chat.map((m, i) => <MessageBubble key={i} msg={m} user={user} />)}

          {busy && (
            <div className="message assistant">
              <div className="message-avatar"><BrainCircuit size={15} /></div>
              <div className="typing-indicator">
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
                <small>Searching your notes…</small>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form className="chat-input-wrap" onSubmit={ask}>
          <div className="chat-input">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={active ? 'Ask something about your notes…' : 'Select a course first'}
              disabled={!active || busy}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && ask(e)}
            />
            <button className="send-btn" disabled={!active || busy || !question.trim()} type="submit">
              <Send size={16} />
            </button>
          </div>
          <div className="input-foot">AI can make mistakes. Verify important information against your source notes.</div>
        </form>
      </section>

      <aside className="right-rail">
        <div className="panel rail-panel">
          <div className="section-head">
            <h3>Course context</h3>
            <BookOpen size={18} />
          </div>
          <select
            className="course-select"
            value={active?.id || ''}
            onChange={e => setActive(courses.find(c => String(c.id) === e.target.value) || null)}
          >
            <option value="">Select course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <div className="rail-divider" />
          <h4>Indexed materials</h4>
          {notes.length ? notes.slice(0, 6).map(n => (
            <div className="material-row" key={n.id}>
              <span className="file-icon"><FileText size={16} /></span>
              <div>
                <b>{n.title}</b>
                <small>{n.original_name}</small>
              </div>
            </div>
          )) : <p className="muted tiny">Upload notes to enable course-grounded answers.</p>}
          <button className="secondary full" style={{ marginTop: 14 }} onClick={() => { }}>Manage notes</button>
        </div>

        <div className="tip-card">
          <Lightbulb size={18} />
          <h4>Study tip</h4>
          <p>Ask "why" and "how" questions to deepen understanding, not just memorize definitions. Try: "Why does X happen?" or "How does Y work?"</p>
        </div>

        {chat.length > 0 && (
          <div className="panel rail-panel">
            <h4><Sparkles size={14} /> Suggested follow-ups</h4>
            <div className="follow-up-list">
              {SUGGESTIONS.slice(4).map(s => (
                <button key={s} className="follow-up-btn" onClick={() => setQuestion(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
