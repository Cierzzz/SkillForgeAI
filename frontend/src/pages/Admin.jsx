import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import { Guarded } from '../components/Protected.jsx';
import { Alert, EmptyState, LoadingBlock, Stat } from '../components/ui.jsx';
import {
  IconKey,
  IconPlus,
  IconShield,
  IconTrash,
  IconUser,
} from '../components/Icons.jsx';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'codes', label: 'Registration codes' },
  { id: 'security', label: 'Security log' },
  { id: 'ai', label: 'AI usage' },
];

export default function Admin() {
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newCode, setNewCode] = useState({ label: '', role: 'user', maxUses: 5, expiresInDays: 30 });

  const load = async (which = tab) => {
    setLoading(true);
    try {
      if (which === 'overview') setData({ overview: await api.adminOverview() });
      if (which === 'users') {
        const users = await api.adminUsers(search);
        setData((d) => ({ ...d, users }));
      }
      if (which === 'codes') {
        const tokens = await api.adminTokens();
        setData((d) => ({ ...d, tokens: tokens.tokens }));
      }
      if (which === 'security') {
        const [events, audit] = await Promise.all([api.adminSecurityEvents(), api.adminAudit()]);
        setData((d) => ({ ...d, events: events.events, byType: events.byType, audit: audit.logs }));
      }
      if (which === 'ai') {
        const ai = await api.adminAiUsage();
        setData((d) => ({ ...d, ai }));
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const createCode = async (e) => {
    e.preventDefault();
    try {
      const res = await api.adminCreateToken({ ...newCode, maxUses: Number(newCode.maxUses), expiresInDays: Number(newCode.expiresInDays) });
      toast.success(`Code created: ${res.token.code}`);
      setNewCode({ label: '', role: 'user', maxUses: 5, expiresInDays: 30 });
      load('codes');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const revokeCode = async (id) => {
    try {
      await api.adminRevokeToken(id);
      toast.success('Code revoked.');
      load('codes');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const setRole = async (id, role) => {
    try {
      await api.adminUpdateUser(id, { role });
      toast.success('Role updated.');
      load('users');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const setStatus = async (id, status) => {
    try {
      await api.adminUpdateUser(id, { status });
      toast.success(`Account ${status}.`);
      load('users');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const o = data.overview;

  return (
    <Guarded className="stack">
      <header>
        <h1 style={{ margin: '0.6rem 0 0.25rem' }}>Control panel</h1>
        <p style={{ marginBottom: 0 }}>Manage accounts, registration codes and review security telemetry.</p>
      </header>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card">
          <LoadingBlock lines={5} />
        </div>
      ) : null}

      {/* ------------------------------------------------------------ overview */}
      {!loading && tab === 'overview' && o && (
        <>
          <div className="grid grid-4">
            <Stat value={o.users.total} label="Total users" />
            <Stat value={o.users.new_this_week} label="New this week" />
            <Stat value={`${o.ai.calls}`} label="AI calls (30d)" />
            <Stat value={o.security.total} label="Security events" />
          </div>

          <div className="grid grid-2">
            <section className="card">
              <h2 style={{ fontSize: '1.2rem' }}>System</h2>
              <div className="stack-sm tiny">
                <div className="row-between">
                  <span className="muted">AI engine</span>
                  <span className="mono">
                    {o.ai.engine.provider} / {o.ai.engine.model}
                  </span>
                </div>
                <div className="row-between">
                  <span className="muted">AI configured</span>
                  <span>{o.ai.engine.configured ? 'yes' : 'no (using fallback engine)'}</span>
                </div>
                <div className="row-between">
                  <span className="muted">Daily AI quota per user</span>
                  <span>{o.ai.dailyQuota}</span>
                </div>
                <div className="row-between">
                  <span className="muted">Avg AI latency</span>
                  <span>{o.ai.avg_latency_ms} ms</span>
                </div>
                <div className="row-between">
                  <span className="muted">Active captcha challenges</span>
                  <span>{o.security.captcha.active}</span>
                </div>
                <div className="row-between">
                  <span className="muted">Failed logins (24h)</span>
                  <span>{o.logins.failures}</span>
                </div>
              </div>
              <Alert tone="info">
                Rate limits — auth {o.rateLimits.authMax} / {o.rateLimits.windowMs / 60000} min · captcha unlocks after{' '}
                {o.rateLimits.loginCaptchaAfter} failures · registration {o.rateLimits.registerMaxPerHour} / h
              </Alert>
            </section>

            <section className="card">
              <h2 style={{ fontSize: '1.2rem' }}>Most common skills on file</h2>
              {o.topSkills?.length === 0 ? (
                <EmptyState title="No skills recorded yet" />
              ) : (
                (o.topSkills ?? []).map((s) => (
                  <div className="bar-row" key={s.name}>
                    <span>{s.name}</span>
                    <span className="tiny muted">{s.users} users</span>
                    <div className="bar">
                      <i style={{ width: `${Math.min(100, s.users * 10)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        </>
      )}

      {/* --------------------------------------------------------------- users */}
      {!loading && tab === 'users' && (
        <section className="card stack">
          <div className="row-between">
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
              <IconUser size={18} /> Accounts
            </h2>
            <form
              className="row"
              onSubmit={(e) => {
                e.preventDefault();
                load('users');
              }}
            >
              <input
                className="input"
                placeholder="Search name or e-mail"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ minWidth: 200 }}
              />
              <button className="btn btn-sm" type="submit">
                Search
              </button>
            </form>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Joined</th>
                  <th>Last login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data.users?.users ?? []).map((u) => (
                  <tr key={u.id}>
                    <td>
                      <b>{u.full_name}</b>
                      <br />
                      <span className="tiny muted">{u.email}</span>
                    </td>
                    <td>
                      <select className="select" style={{ minHeight: 34, padding: '0.25rem 1.6rem 0.25rem 0.5rem' }} value={u.role} onChange={(e) => setRole(u.id, e.target.value)}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className={`badge ${u.status === 'active' ? 'badge-ok' : 'badge-bad'}`}
                        onClick={() => setStatus(u.id, u.status === 'active' ? 'suspended' : 'active')}
                      >
                        {u.status}
                      </button>
                    </td>
                    <td className="tiny">{u.user_type ?? '—'}</td>
                    <td className="tiny">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="tiny">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'never'}</td>
                    <td>
                      <button
                        className="btn btn-sm"
                        onClick={async () => {
                          await api.adminRevokeSessions(u.id);
                          toast.success('Sessions revoked.');
                        }}
                      >
                        Revoke sessions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------- codes */}
      {!loading && tab === 'codes' && (
        <>
          <form className="card stack" onSubmit={createCode}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
              <IconKey size={18} /> Create a registration code
            </h2>
            <div className="grid grid-2">
              <div className="field">
                <label htmlFor="label">Label</label>
                <input id="label" className="input" placeholder="Grade 11 - Section A" value={newCode.label} onChange={(e) => setNewCode((c) => ({ ...c, label: e.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="role">Grants role</label>
                <select id="role" className="select" value={newCode.role} onChange={(e) => setNewCode((c) => ({ ...c, role: e.target.value }))}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="uses">Max uses</label>
                <input id="uses" className="input" type="number" min="1" max="500" value={newCode.maxUses} onChange={(e) => setNewCode((c) => ({ ...c, maxUses: e.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="days">Valid for (days)</label>
                <input id="days" className="input" type="number" min="1" max="365" value={newCode.expiresInDays} onChange={(e) => setNewCode((c) => ({ ...c, expiresInDays: e.target.value }))} />
              </div>
            </div>
            <div>
              <button className="btn btn-primary" type="submit">
                <IconPlus size={16} /> Generate code
              </button>
            </div>
          </form>

          <section className="card">
            <h2 style={{ fontSize: '1.2rem' }}>Active codes</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Label</th>
                    <th>Role</th>
                    <th>Uses</th>
                    <th>Expires</th>
                    <th>State</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(data.tokens ?? []).map((t) => (
                    <tr key={t.id}>
                      <td className="mono">{t.code}</td>
                      <td className="tiny">{t.label ?? '—'}</td>
                      <td className="tiny">{t.role_granted}</td>
                      <td className="tiny">
                        {t.uses}/{t.max_uses}
                      </td>
                      <td className="tiny">{new Date(t.expires_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${t.revoked_at ? 'badge-bad' : t.uses >= t.max_uses ? 'badge-warn' : 'badge-ok'}`}>
                          {t.revoked_at ? 'revoked' : t.uses >= t.max_uses ? 'used up' : 'active'}
                        </span>
                      </td>
                      <td>
                        {!t.revoked_at && (
                          <button className="btn btn-sm btn-danger" onClick={() => revokeCode(t.id)}>
                            <IconTrash size={14} /> Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ------------------------------------------------------------ security */}
      {!loading && tab === 'security' && (
        <div className="grid grid-2">
          <section className="card">
            <h2 style={{ fontSize: '1.2rem' }}>Blocked / suspicious activity (7 days)</h2>
            {(data.byType ?? []).length === 0 ? (
              <EmptyState title="Nothing blocked yet">Your API is only being called by real browsers.</EmptyState>
            ) : (
              (data.byType ?? []).map((t) => (
                <div className="bar-row" key={t.type}>
                  <span className="mono">{t.type}</span>
                  <span className="tiny muted">{t.count}</span>
                  <div className="bar">
                    <i style={{ width: `${Math.min(100, t.count * 12)}%` }} />
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="card">
            <h2 style={{ fontSize: '1.2rem' }}>Recent events</h2>
            <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
              {(data.events ?? []).slice(0, 40).map((e) => (
                <div className="event-row" key={e.id}>
                  <b className="mono">{e.type}</b>
                  <span className="tiny muted">
                    {new Date(e.created_at).toLocaleString()} · {e.method} {e.path} · ip {e.ip_hash ?? 'n/a'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2 style={{ fontSize: '1.2rem' }}>Audit trail</h2>
            <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
              {(data.audit ?? []).slice(0, 60).map((a) => (
                <div className="event-row" key={a.id}>
                  <b className="mono">{a.action}</b>
                  <span className="tiny muted">
                    {new Date(a.created_at).toLocaleString()} · {a.email ?? 'system'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ----------------------------------------------------------------- ai */}
      {!loading && tab === 'ai' && data.ai && (
        <>
          <div className="grid grid-2">
            <section className="card">
              <h2 style={{ fontSize: '1.2rem' }}>Usage by feature (30 days)</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Calls</th>
                      <th>Tokens in</th>
                      <th>Tokens out</th>
                      <th>Avg ms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.ai.byFeature ?? []).map((f) => (
                      <tr key={f.feature}>
                        <td>{f.feature}</td>
                        <td>{f.calls}</td>
                        <td>{f.tokens_in}</td>
                        <td>{f.tokens_out}</td>
                        <td>{f.avg_latency_ms}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <h2 style={{ fontSize: '1.2rem' }}>Heaviest users</h2>
              {(data.ai.byUser ?? []).map((u) => (
                <div className="bar-row" key={u.email}>
                  <span className="tiny">{u.email}</span>
                  <span className="tiny muted">{u.calls}</span>
                  <div className="bar">
                    <i style={{ width: `${Math.min(100, u.calls * 8)}%` }} />
                  </div>
                </div>
              ))}
              <Alert tone="info">
                Engine: {data.ai.engine.provider} / {data.ai.engine.model}
              </Alert>
            </section>
          </div>
        </>
      )}
    </Guarded>
  );
}