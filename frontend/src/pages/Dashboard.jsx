import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Guarded } from '../components/Protected.jsx';
import { Alert, EmptyState, LoadingBlock, ScoreRing, SkillTags, Stat } from '../components/ui.jsx';
import {
  IconChat,
  IconQuiz,
  IconResume,
  IconSpark,
  IconTarget,
  IconTrends,
  IconBrain,
} from '../components/Icons.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [recs, setRecs] = useState([]);
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, r, s] = await Promise.all([
          api.profile(),
          api.recommendations().catch(() => ({ recommendations: [] })),
          api.interviewScores().catch(() => null),
        ]);
        if (cancelled) return;
        setProfile(p);
        setStats(p.stats);
        setRecs((r.recommendations || []).slice(0, 3));
        setScores(s?.summary ?? null);
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

  const ownedSkills = useMemo(() => (profile?.skills ?? []).map((s) => s.name), [profile]);
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  return (
    <Guarded>
      <div className="stack" style={{ gap: '1.25rem' }}>
        <header className="row-between">
          <div>
            <h1 style={{ margin: '0.6rem 0 0.25rem' }}>Hi {firstName} 👋</h1>
            <p style={{ marginBottom: 0 }}>
              {recs.length
                ? 'Here is where you stand today. Run the quiz again any time your skills change.'
                : 'Start with the intake quiz so the AI can build your personal recommendations.'}
            </p>
          </div>
          <Link to="/intake" className="btn btn-primary">
            <IconQuiz size={17} /> {recs.length ? 'Retake the quiz' : 'Start the quiz'}
          </Link>
        </header>

        {error ? <Alert tone="error">{error}</Alert> : null}

        {loading ? (
          <div className="grid grid-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="kpi">
                <div className="skeleton" style={{ height: 30, width: '60%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-4">
            <Stat value={stats?.recommendations ?? 0} label="Recommendations" />
            <Stat value={stats?.messages ?? 0} label="AI messages" />
            <Stat value={stats?.resumes ?? 0} label="Resumes built" />
            <Stat value={scores?.average ? `${scores.average}%` : '—'} label="Interview avg" />
          </div>
        )}

        <div className="grid grid-2">
          <section className="card">
            <div className="row-between" style={{ marginBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                <IconTarget size={18} /> Your top matches
              </h2>
              <Link to="/intake" className="tiny">
                Regenerate
              </Link>
            </div>

            {loading ? (
              <LoadingBlock />
            ) : recs.length === 0 ? (
              <EmptyState
                title="No recommendations yet"
                action={
                  <Link to="/intake" className="btn btn-primary">
                    Take the intake quiz
                  </Link>
                }
              >
                Answer about ten questions and SkillForge will match you against college programmes and entry-level job
                roles.
              </EmptyState>
            ) : (
              <div className="stack">
                {recs.map((rec) => (
                  <article className="card card-tight rec-card" key={rec.id} style={{ background: 'rgba(7,13,25,0.35)' }}>
                    <div className="rec-head">
                      <div>
                        <span className="badge">{rec.rank === 1 ? 'Best match' : `Match #${rec.rank}`}</span>
                        <h3 className="rec-title" style={{ marginTop: '0.4rem' }}>
                          {rec.title}
                        </h3>
                        <span className="tiny muted">{rec.subtitle}</span>
                      </div>
                      <ScoreRing score={rec.match_score} />
                    </div>
                    <p style={{ marginBottom: '0.35rem' }}>{rec.description}</p>
                    <SkillTags skills={rec.required_skills} owned={ownedSkills} />
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="stack">
            <section className="card">
              <h2 style={{ fontSize: '1.2rem' }}>
                <IconChat size={18} /> Talk to the AI
              </h2>
              <p>Ask about your matches, your resume, or switch into recruiter mode for a mock interview.</p>
              <div className="row">
                <Link to="/chat" className="btn btn-primary">
                  <IconChat size={16} /> Open AI chat
                </Link>
                <Link to="/chat?mode=interview" className="btn">
                  Mock interview
                </Link>
              </div>
            </section>

            <section className="card">
              <h2 style={{ fontSize: '1.2rem' }}>
                <IconResume size={18} /> Resume builder
              </h2>
              <p>Turn your profile into an ATS-friendly resume in one click. Download it or print to PDF.</p>
              <Link to="/resume" className="btn">
                <IconResume size={16} /> Build my resume
              </Link>
            </section>

            <section className="card">
              <h2 style={{ fontSize: '1.2rem' }}>
                <IconTrends size={18} /> Skill demand
              </h2>
              <p>See which skills employers are hiring for right now, and which ones you are still missing.</p>
              <Link to="/trends" className="btn">
                <IconBrain size={16} /> View skill trends
              </Link>
            </section>
          </div>
        </div>
      </div>
    </Guarded>
  );
}