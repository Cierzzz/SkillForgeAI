import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import { Guarded } from '../components/Protected.jsx';
import { Alert, LoadingBlock, ScoreRing, SkillTags } from '../components/ui.jsx';
import {
  IconCheck,
  IconSpark,
} from '../components/Icons.jsx';

const USER_TYPES = [
  { value: 'shs_senior', label: 'Senior High School student' },
  { value: 'fresh_grad', label: 'Fresh college graduate' },
  { value: 'working_pro', label: 'Already working' },
  { value: 'other', label: 'Other' },
];

const TRACKS = ['Computing', 'Business', 'Health Sciences', 'Humanities', 'Design', 'Engineering', 'General'];

export default function Intake() {
  const navigate = useNavigate();
  const toast = useToast();

  const [catalog, setCatalog] = useState({ skills: [], interests: [] });
  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState('shs_senior');
  const [track, setTrack] = useState('General');
  const [skills, setSkills] = useState({}); // id -> { proficiency, years }
  const [interests, setInterests] = useState([]); // ids
  const [targetType, setTargetType] = useState('job_role');
  const [preferredRole, setPreferredRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.intakeCatalog();
        if (cancelled) return;
        setCatalog(data);

        /* Pre-fill from the profile the user already has. */
        const existing = await api.profile().catch(() => null);
        if (cancelled) return;
        if (existing?.skills) {
          setSkills(
            Object.fromEntries(existing.skills.map((s) => [s.id, { proficiency: s.proficiency, years: s.years }])),
          );
        }
        if (existing?.interests) setInterests(existing.interests.map((i) => i.id));
        if (existing?.profile?.user_type) setUserType(existing.profile.user_type);
        if (existing?.profile?.preferred_track) setTrack(existing.profile.preferred_track);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const byCategory = {};
    for (const skill of catalog.skills) {
      byCategory[skill.category] = byCategory[skill.category] || [];
      byCategory[skill.category].push(skill);
    }
    return byCategory;
  }, [catalog.skills]);

  const selectedSkillIds = Object.keys(skills).map(Number);
  const steps = ['About you', 'Skills', 'Interests', 'Your goal'];

  const toggleSkill = (id) =>
    setSkills((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = { proficiency: 3, years: 1 };
      return next;
    });

  const toggleInterest = (id) =>
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const setLevel = (id, proficiency) => setSkills((prev) => ({ ...prev, [id]: { ...prev[id], proficiency } }));

  const canAdvance = () => {
    if (step === 1 && selectedSkillIds.length < 2) return false;
    if (step === 2 && interests.length < 1) return false;
    return true;
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const payload = {
        targetType,
        generate: true,
        answers: {
          userType,
          track,
          preferredRole: preferredRole.trim() || null,
          skills: selectedSkillIds.map((id) => ({ skillId: id, proficiency: skills[id].proficiency, years: skills[id].years })),
          interests: interests.map((id) => ({ interestId: id, weight: 4 })) } };
      const data = await api.submitAssessment(payload);
      setResult(data);
      toast.success('Your recommendations are ready!');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <LoadingBlock lines={5} />
      </div>
    );
  }

  /* ---------------------------------------------------------------- results */
  if (result) {
    return (
      <Guarded className="stack">
        <div className="row-between">
          <div>
            <h1 style={{ margin: '0.6rem 0 0.2rem' }}>
              {targetType === 'college_program' ? 'Your recommended programmes' : 'Your recommended job roles'}
            </h1>
            <p style={{ marginBottom: 0 }}>
              Generated {result.ai?.provider === 'rules' ? 'by the built-in matching engine' : 'by the AI engine'}. Every
              match explains why you got it.
            </p>
          </div>
          <button className="btn" onClick={() => setResult(null)}>
            Edit my answers
          </button>
        </div>

        <div className="grid grid-3">
          {result.recommendations.map((rec) => (
            <article className="card rec-card" key={rec.id}>
              <div className="rec-head">
                <div>
                  <h3 className="rec-title">{rec.title}</h3>
                  <span className="tiny muted">{rec.subtitle}</span>
                </div>
                <ScoreRing score={rec.match_score} />
              </div>
              <p>{rec.description}</p>
              <p className="tiny" style={{ color: '#bfe6ff' }}>
                {rec.reason}
              </p>
              <SkillTags skills={rec.required_skills} gaps={rec.required_skills} />
            </article>
          ))}
        </div>

        <div className="row">
          <button className="btn btn-primary" onClick={() => navigate('/resume')}>
            Build my resume with these matches
          </button>
          <button className="btn" onClick={() => navigate('/chat')}>
            Ask the AI about these results
          </button>
        </div>
      </Guarded>
    );
  }

  /* ------------------------------------------------------------------- quiz */
  return (
    <Guarded className="quiz-shell">
      <aside className="card card-tight">
        <div className="stack-sm">
          {steps.map((label, i) => (
            <button
              key={label}
              type="button"
              className={`step ${i === step ? 'current' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => setStep(i)}
              style={{ minWidth: 0 }}
            >
              <span>{i < step ? <IconCheck size={15} /> : i + 1}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="progress-track" style={{ marginTop: '0.75rem' }}>
          <i style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <p className="tiny" style={{ marginTop: '0.6rem', marginBottom: 0 }}>
          {selectedSkillIds.length} skills · {interests.length} interests selected
        </p>
      </aside>

      <section className="card">
        {error ? <Alert tone="error">{error}</Alert> : null}

        {step === 0 && (
          <div className="stack">
            <h2 style={{ marginBottom: 0 }}>About you</h2>
            <p>So the recommendations match your stage, not somebody else's.</p>

            <div className="field">
              <label htmlFor="ut">Where are you right now?</label>
              <select id="ut" className="select" value={userType} onChange={(e) => setUserType(e.target.value)}>
                {USER_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="tr">Which track or strand?</label>
              <select id="tr" className="select" value={track} onChange={(e) => setTrack(e.target.value)}>
                {TRACKS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="stack">
            <h2 style={{ marginBottom: 0 }}>What can you already do?</h2>
            <p>Tap every skill you can do at least a little, then rate yourself honestly from 1 to 5.</p>

            {Object.entries(grouped).map(([category, list]) => (
              <div key={category} className="stack-sm">
                <strong className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {category}
                </strong>
                <div className="chip-grid">
                  {list.map((skill) => (
                    <button
                      type="button"
                      key={skill.id}
                      className={`chip ${skills[skill.id] ? 'selected' : ''}`}
                      onClick={() => toggleSkill(skill.id)}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {selectedSkillIds.length > 0 && (
              <div className="stack-sm">
                <strong>Rate your top skills</strong>
                {selectedSkillIds.map((id) => {
                  const skill = catalog.skills.find((s) => s.id === id);
                  return (
                    <div className="skill-row" key={id}>
                      <div className="head">
                        <span>{skill?.name}</span>
                        <div className="level" role="group" aria-label={`Proficiency for ${skill?.name}`}>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <button
                              type="button"
                              key={level}
                              className={skills[id].proficiency >= level ? 'on' : ''}
                              onClick={() => setLevel(id, level)}
                              aria-label={`Level ${level}`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="stack">
            <h2 style={{ marginBottom: 0 }}>What keeps you interested?</h2>
            <p>Choose what you would happily spend a free weekend on. Pick at least one.</p>
            <div className="chip-grid">
              {catalog.interests.map((interest) => (
                <button
                  type="button"
                  key={interest.id}
                  className={`chip ${interests.includes(interest.id) ? 'selected' : ''}`}
                  onClick={() => toggleInterest(interest.id)}
                >
                  {interest.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="stack">
            <h2 style={{ marginBottom: 0 }}>Your goal</h2>
            <p>Final step — what should SkillForge recommend for you?</p>

            <div className="radio-list">
              {[
                { value: 'job_role', label: 'An entry-level job role', hint: 'Best for fresh graduates and career shifters.' },
                { value: 'college_program', label: 'A college programme', hint: 'Best for Senior High School students choosing a degree.' },
              ].map((option) => (
                <label className={`radio-card ${targetType === option.value ? 'selected' : ''}`} key={option.value}>
                  <input
                    type="radio"
                    name="targetType"
                    value={option.value}
                    checked={targetType === option.value}
                    onChange={() => setTargetType(option.value)}
                  />
                  <span>
                    <b>{option.label}</b>
                    <br />
                    <span className="tiny muted">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="field">
              <label htmlFor="pref">A role or programme already in mind? (optional)</label>
              <input
                id="pref"
                className="input"
                placeholder="e.g. Frontend Developer"
                maxLength={160}
                value={preferredRole}
                onChange={(e) => setPreferredRole(e.target.value)}
              />
            </div>

            <button className="btn btn-primary" onClick={submit} disabled={busy}>
              {busy ? <span className="spinner" /> : null}
              {busy ? 'Asking the AI…' : 'Generate my recommendations'}
            </button>
          </div>
        )}

        <div className="row-between" style={{ marginTop: '1.25rem' }}>
          <button className="btn btn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Back
          </button>
          <div className="row">
            <span className="tiny muted">
              Step {step + 1} of {steps.length}
            </span>
            {step < steps.length - 1 && (
              <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
                Continue
              </button>
            )}
          </div>
        </div>
      </section>
    </Guarded>
  );
}