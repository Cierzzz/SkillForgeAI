import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import { Guarded } from '../components/Protected.jsx';
import { Alert, EmptyState, LoadingBlock } from '../components/ui.jsx';
import { IconCopy, IconDownload, IconPrint, IconResume, IconSpark, IconTrash } from '../components/Icons.jsx';

export default function ResumeBuilder() {
  const toast = useToast();
  const [resumes, setResumes] = useState([]);
  const [active, setActive] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const paperRef = useRef(null);

  const load = async () => {
    try {
      const [list, rec] = await Promise.all([api.resumes(), api.recommendations().catch(() => ({ recommendations: [] }))]);
      setResumes(list.resumes ?? []);
      setRecs(rec.recommendations ?? []);
      if (list.resumes?.length) {
        const full = await api.resume(list.resumes[0].id);
        setActive(full.resume);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suggestedRoles = useMemo(
    () => [...new Set([...recs.map((r) => r.title), 'Full-Stack Developer', 'Data Analyst', 'Frontend Developer'])].slice(0, 8),
    [recs],
  );

  const generate = async (fromTemplate = false) => {
    setBusy(true);
    try {
      const data = await api.generateResume({ targetRole: targetRole || undefined, fromTemplate });
      setActive(data.resume);
      await load();
      toast.success(fromTemplate ? 'Resume rebuilt from your profile.' : 'AI resume generated.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const downloadHtml = () => {
    if (!active) return;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${active.title}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;max-width:760px;margin:40px auto;color:#111;line-height:1.5}
h1{font-size:26px;margin:0 0 4px}h2{font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:#444;margin:0 0 10px}
h3{font-size:13px;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #ddd;padding-bottom:4px;margin-top:18px}
p,li{font-size:13px}</style></head><body>${active.content_html}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadText = () => {
    if (!active) return;
    const blob = new Blob([active.content_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const remove = async (id) => {
    try {
      await api.deleteResume(id);
      if (active?.id === id) setActive(null);
      await load();
      toast.success('Resume deleted.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Guarded className="resume-layout">
      <aside className="stack">
        <section className="card">
          <h2 style={{ fontSize: '1.2rem' }}>
            <IconSpark size={18} /> Generate a resume
          </h2>
          <p className="tiny">Built from your intake quiz, skills and AI recommendations.</p>

          <div className="field">
            <label htmlFor="target">Target role</label>
            <input
              id="target"
              className="input"
              list="role-suggestions"
              placeholder="e.g. Frontend Developer"
              value={targetRole}
              maxLength={160}
              onChange={(e) => setTargetRole(e.target.value)}
            />
            <datalist id="role-suggestions">
              {suggestedRoles.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>

          <div className="stack-sm">
            <button className="btn btn-primary btn-block" onClick={() => generate(false)} disabled={busy}>
              {busy ? <span className="spinner" /> : null} Generate with AI
            </button>
            <button className="btn btn-block" onClick={() => generate(true)} disabled={busy}>
              Rebuild from profile (offline)
            </button>
          </div>
        </section>

        <section className="card">
          <h3 style={{ fontSize: '1rem' }}>Your resumes</h3>
          {loading ? (
            <LoadingBlock lines={2} />
          ) : resumes.length === 0 ? (
            <p className="tiny muted">Nothing generated yet.</p>
          ) : (
            <div className="stack-sm">
              {resumes.map((r) => (
                <div key={r.id} className="row-between" style={{ gap: '0.4rem' }}>
                  <button
                    className={`session-item ${active?.id === r.id ? 'active' : ''}`}
                    style={{ flex: 1 }}
                    onClick={async () => {
                      const full = await api.resume(r.id);
                      setActive(full.resume);
                    }}
                  >
                    <b>{r.title}</b>
                    <span>
                      {r.source} · {new Date(r.updated_at).toLocaleDateString()}
                    </span>
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(r.id)} aria-label={`Delete ${r.title}`}>
                    <IconTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </aside>

      <section className="stack">
        {active ? (
          <>
            <div className="card card-tight row-between">
              <strong>{active.title}</strong>
              <div className="row">
                <button className="btn btn-sm" onClick={downloadHtml}>
                  <IconDownload size={14} /> HTML
                </button>
                <button className="btn btn-sm" onClick={downloadText}>
                  <IconDownload size={14} /> TXT
                </button>
                <a
                  className="btn btn-sm btn-primary"
                  href={`${import.meta.env.VITE_API_BASE_URL || ''}/resumes/${active.id}/print`}
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/resumes/${active.id}/print`, {
                        headers: { Authorization: `Bearer ${sessionStorage.getItem('sf.access')}`, 'X-Client-App': 'skillforge-web' },
                      });
                      const html = await res.text();
                      const win = window.open('', '_blank');
                      if (win) {
                        win.document.write(html);
                        win.document.close();
                        setTimeout(() => win.print(), 350);
                      }
                    } catch {
                      toast.error('Could not open the print view.');
                    }
                  }}
                >
                  <IconPrint size={14} /> Print / PDF
                </a>
              </div>
            </div>

            <article className="resume-paper" ref={paperRef} dangerouslySetInnerHTML={{ __html: active.content_html }} />
          </>
        ) : (
          <div className="card">
            <EmptyState
              icon={<IconResume size={34} />}
              title="No resume yet"
              action={
                <button className="btn btn-primary" onClick={() => generate(false)} disabled={busy}>
                  Generate my first resume
                </button>
              }
            >
              The builder turns your intake answers, skills and AI matches into a clean one-page resume you can download or
              print to PDF.
            </EmptyState>
          </div>
        )}
      </section>
    </Guarded>
  );
}