import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Guarded } from '../components/Protected.jsx';
import { Alert, Bar, EmptyState, LoadingBlock } from '../components/ui.jsx';
import {
  IconTrends,
} from '../components/Icons.jsx';

export default function Trends() {
  const [roles, setRoles] = useState([]);
  const [skills, setSkills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [roleData, skillData] = await Promise.all([api.roleTrends(), api.skillTrends(selectedRole)]);
        setRoles(roleData.roles ?? []);
        setSkills(skillData.skills ?? []);
        setSummary(skillData.summary ?? null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedRole]);

  const owned = skills.filter((s) => s.owned);
  const gaps = skills.filter((s) => s.inYourGaps && !s.owned);

  return (
    <Guarded className="stack">
      <header>
        <h1 style={{ margin: '0.6rem 0 0.25rem' }}>Skill demand trends</h1>
        <p style={{ marginBottom: 0 }}>
          Which skills employers are hiring for right now — and where your profile is behind. Green bars are skills you
          already have.
        </p>
      </header>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid grid-2">
        <section className="card">
          <h2 style={{ fontSize: '1.2rem' }}>Filter by role</h2>
          <div className="stack-sm" style={{ maxHeight: '46vh', overflowY: 'auto' }}>
            <button className={`session-item ${!selectedRole ? 'active' : ''}`} onClick={() => setSelectedRole('')}>
              <b>All roles</b>
              <span>{summary?.roles ?? 0} roles tracked</span>
            </button>
            {roles.map((role) => (
              <button
                key={role.slug}
                className={`session-item ${selectedRole === role.slug ? 'active' : ''}`}
                onClick={() => setSelectedRole(role.slug)}
              >
                <b>{role.title}</b>
                <span>
                  {role.industry} · demand {role.demand_index ?? '—'} · {role.avg_salary ?? 'salary n/a'}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 style={{ fontSize: '1.2rem' }}>High-demand skills</h2>
          {loading ? (
            <LoadingBlock lines={6} />
          ) : skills.length === 0 ? (
            <EmptyState title="No trend data yet">Trend data will appear once the catalogue is seeded.</EmptyState>
          ) : (
            <div>
              {skills.map((s) => (
                <div className="bar-row" key={`${s.role_slug}-${s.skill_name}`}>
                  <span className="row" style={{ gap: '0.45rem' }}>
                    <b>{s.skill_name}</b>
                    {s.owned ? <span className="badge badge-ok">you have it</span> : s.inYourGaps ? <span className="badge badge-warn">gap</span> : null}
                  </span>
                  <span className="tiny muted">
                    {s.band} · {s.demand_index}
                  </span>
                  <Bar value={s.demand_index} have={s.owned} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <h3>Skills you already have ({owned.length})</h3>
          {owned.length === 0 ? (
            <p className="tiny muted">Take the intake quiz so we can match your profile to these trends.</p>
          ) : (
            <div className="skill-tags">
              {owned.map((s) => (
                <span className="skill-tag have" key={s.skill_name}>
                  {s.skill_name} · {s.demand_index}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h3>Skills to prioritise ({gaps.length})</h3>
          {gaps.length === 0 ? (
            <p className="tiny muted">No urgent gaps detected. Nice work — keep practising your interview answers.</p>
          ) : (
            <div className="skill-tags">
              {gaps.map((s) => (
                <span className="skill-tag gap" key={s.skill_name}>
                  {s.skill_name} · {s.demand_index}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      <p className="tiny muted">
        Demand index is an indicative figure based on the catalogue maintained by your guidance office — it is not an
        official labour-statistics figure.
      </p>
    </Guarded>
  );
}