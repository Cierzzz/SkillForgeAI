import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import { Guarded } from '../components/Protected.jsx';
import { Alert, EmptyState, Spinner } from '../components/ui.jsx';
import { IconChat, IconPlus, IconSend, IconTrash, IconBrain } from '../components/Icons.jsx';

const MODES = [
  { value: 'counseling', label: 'Career counseling' },
  { value: 'interview', label: 'Mock interview' },
];

export default function Chat() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const mode = params.get('mode') === 'interview' ? 'interview' : 'counseling';
  const targetRole = params.get('role') || '';

  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [role, setRole] = useState(targetRole);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const loadSessions = async () => {
    try {
      const data = await api.chatSessions();
      setSessions(data.sessions ?? []);
      return data.sessions ?? [];
    } catch (err) {
      setError(err.message);
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      const list = await loadSessions();
      const first = list.find((s) => s.mode === mode) ?? list[0];
      if (first) openSession(first.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const openSession = async (id) => {
    try {
      const data = await api.chatSession(id);
      setActiveId(id);
      setMessages(data.messages ?? []);
      setMode(data.session.mode);
    } catch (err) {
      setError(err.message);
    }
  };

  const setMode = (next) => {
    const p = new URLSearchParams(params);
    p.set('mode', next);
    setParams(p, { replace: true });
    setActiveId(null);
    setMessages([]);
  };

  const newSession = async () => {
    try {
      const data = await api.createSession({ mode, targetRole: role || undefined });
      setActiveId(data.session.id);
      setMessages([]);
      await loadSessions();
      if (mode === 'interview') {
        const full = await api.chatSession(data.session.id);
        setMessages(full.messages ?? []);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const send = async (e) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    setSending(true);
    setError('');
    setMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, role: 'user', content: text }]);

    try {
      const data = await api.sendMessage({ sessionId: activeId ?? undefined, mode, message: text, targetRole: role || undefined });
      setActiveId(data.sessionId);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== `tmp-${Date.now()}`),
        {
          id: data.message.id,
          role: 'assistant',
          content: data.message.content,
          created_at: data.message.created_at,
          feedback: data.feedback,
        },
      ]);
      loadSessions();
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.filter((m) => m.id !== `tmp-${Date.now()}`));
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const removeSession = async (id) => {
    try {
      await api.deleteSession(id);
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      loadSessions();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const quickPrompts = useMemo(
    () =>
      mode === 'interview'
        ? ['Tell me about yourself.', 'I am nervous about interviews, any tips?', 'Which role should I target first?']
        : ['Which career fits my skills?', 'How do I build a good resume?', 'What should I study next?', 'How do I prepare for an interview?'],
    [mode],
  );

  return (
    <Guarded className="chat-shell">
      <aside className="card card-tight">
        <div className="stack-sm">
          <div className="row-between">
            <strong>
              <IconChat size={16} /> Chats
            </strong>
            <button className="btn btn-sm btn-primary" onClick={newSession} title="New conversation">
              <IconPlus size={14} />
            </button>
          </div>

          <div className="tabs">
            {MODES.map((m) => (
              <button key={m.value} className={`tab ${mode === m.value ? 'active' : ''}`} onClick={() => setMode(m.value)}>
                {m.label}
              </button>
            ))}
          </div>

          {mode === 'interview' && (
            <div className="field">
              <label htmlFor="role">Target role</label>
              <input
                id="role"
                className="input"
                placeholder="Frontend Developer"
                value={role}
                maxLength={160}
                onChange={(e) => setRole(e.target.value)}
              />
              <span className="hint">The AI acts as the recruiter for this role.</span>
            </div>
          )}

          <div className="session-list">
            {sessions.length === 0 ? (
              <p className="tiny muted">No conversations yet. Start one with the + button.</p>
            ) : (
              sessions.map((s) => (
                <button key={s.id} className={`session-item ${s.id === activeId ? 'active' : ''}`} onClick={() => openSession(s.id)}>
                  <b>{s.title}</b>
                  <span>
                    {s.mode === 'interview' ? 'Interview' : 'Counseling'} · {s.message_count} messages
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      <section className="card chat-panel">
        <header className="row-between">
          <div>
            <strong>{mode === 'interview' ? `Mock interview${role ? ` — ${role}` : ''}` : 'Career counseling'}</strong>
            <p className="tiny" style={{ margin: 0 }}>
              {mode === 'interview'
                ? 'Answer in full sentences with one concrete example. You get scored after each reply.'
                : 'Ask anything about studies, careers, your resume or your interview.'}
            </p>
          </div>
          {activeId ? (
            <button className="btn btn-sm btn-danger" onClick={() => removeSession(activeId)} title="Delete conversation">
              <IconTrash size={14} />
            </button>
          ) : null}
        </header>

        {error ? <Alert tone="error">{error}</Alert> : null}

        <div className="chat-scroll" ref={scrollRef}>
          {messages.length === 0 ? (
            <EmptyState
              icon={<IconBrain size={34} />}
              title={mode === 'interview' ? 'Ready for a practice run?' : 'What would you like to talk about?'}
              action={
                <div className="chip-grid" style={{ justifyContent: 'center' }}>
                  {quickPrompts.map((p) => (
                    <button key={p} className="chip" onClick={() => setDraft(p)}>
                      {p}
                    </button>
                  ))}
                </div>
              }
            >
              {mode === 'interview'
                ? 'Start the interview and the recruiter will ask the first question.'
                : 'Your profile, skills and recommendations are already loaded, so answers will be specific to you.'}
            </EmptyState>
          ) : null}

          {messages.map((m) => (
            <div key={m.id} className={`msg msg-${m.role === 'user' ? 'user' : 'bot'}`}>
              {m.content}
              {m.feedback ? (
                <div className="feedback-box">
                  <b>Score: {m.feedback.score}%</b>
                  {m.feedback.strengths?.length ? (
                    <div>
                      <b>Strength:</b> {m.feedback.strengths.join(' · ')}
                    </div>
                  ) : null}
                  {m.feedback.improvements?.length ? (
                    <div>
                      <b>Improve:</b> {m.feedback.improvements.join(' · ')}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {m.created_at ? (
                <span className="msg-time">{new Date(m.created_at).toLocaleString()}</span>
              ) : null}
            </div>
          ))}

          {sending ? (
            <div className="msg msg-bot">
              <span className="typing">
                <i />
                <i />
                <i />
              </span>
            </div>
          ) : null}
        </div>

        <form className="chat-composer" onSubmit={send}>
          <textarea
            className="textarea"
            rows={2}
            placeholder={mode === 'interview' ? 'Type your answer…' : 'Ask about your career…'}
            value={draft}
            maxLength={4000}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(e);
            }}
          />
          <button className="btn btn-primary" type="submit" disabled={sending || !draft.trim()}>
            {sending ? <span className="spinner" /> : <IconSend size={16} />} Send
          </button>
        </form>
        <p className="tiny muted" style={{ margin: 0 }}>
          AI replies can contain mistakes — verify anything important (scholarships, deadlines, fees) with your school or
          CHED. Press Ctrl+Enter to send.
        </p>
      </section>
    </Guarded>
  );
}