export const Spinner = ({ label = 'Loading…' }) => (
  <span className="row" style={{ gap: '0.6rem' }}>
    <span className="spinner" /> <span className="muted tiny">{label}</span>
  </span>
);

export const LoadingBlock = ({ lines = 3 }) => (
  <div className="stack" aria-busy="true" aria-label="Loading">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="skeleton" style={{ height: i === 0 ? 26 : 16, width: i === 0 ? '55%' : '100%' }} />
    ))}
  </div>
);

export const EmptyState = ({ icon, title, children, action }) => (
  <div className="empty">
    {icon ? <div style={{ marginBottom: 10 }}>{icon}</div> : null}
    <h3 style={{ color: 'var(--ink)' }}>{title}</h3>
    <p style={{ maxWidth: '52ch', margin: '0 auto 1rem' }}>{children}</p>
    {action}
  </div>
);

export const Alert = ({ tone = 'info', children }) =>
  children ? <div className={`alert alert-${tone}`}>{children}</div> : null;

/* Named ScoreRing for historical imports, but it no longer draws a ring: a
   match score is a measurement, so it reads as a numeral over a meter. */
export const ScoreRing = ({ score = 0, label }) => {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="score-ring" title={`${score}% match`}>
      <span className="score-value" data-top={pct >= 85 ? 'true' : 'false'}>{score}%</span>
      <span className="meter" aria-hidden="true">
        <i style={{ transform: `scaleX(${pct / 100})` }} />
      </span>
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
};

export const SkillTags = ({ skills = [], owned = [], gaps = [] }) => (
  <div className="skill-tags">
    {skills.map((skill) => (
      <span
        key={skill}
        className={`skill-tag ${owned.includes(skill) ? 'have' : gaps.includes(skill) ? 'gap' : ''}`}
        title={owned.includes(skill) ? 'You already have this skill' : gaps.includes(skill) ? 'Skill gap to work on' : 'Required'}
      >
        {skill}
      </span>
    ))}
  </div>
);

export const Stat = ({ value, label }) => (
  <div className="kpi">
    <b>{value}</b>
    <span>{label}</span>
  </div>
);

export const Bar = ({ value = 0, have = false }) => (
  <div className="bar">
    <i className={have ? 'have' : ''} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);