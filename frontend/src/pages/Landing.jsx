import { Link } from 'react-router-dom';
import { IconShield, IconTarget } from '../components/Icons.jsx';

/**
 * The landing page is a lit wayfinding board.
 *
 * The product's real mechanism is a ranked shortlist where every match carries
 * its reasoning, so that is what the board leads with: a departure strip of
 * destinations, each with a platform code, a match score, and one sentence
 * saying why. The action, starting the quiz, is set in the same vocabulary
 * rather than parked in a centred button.
 *
 * The catalogue figures below are authored reference data seeded with the
 * project. They are illustrative, not observed labour-market results.
 */

const DESTINATIONS = [
  {
    code: 'BS-CS',
    field: 'College programme',
    name: 'BS Computer Science',
    score: 92,
    why: 'Your programming and problem-solving ratings sit above the profile this programme expects to admit.',
  },
  {
    code: 'BS-IT',
    field: 'College programme',
    name: 'BS Information Technology',
    score: 84,
    why: 'Matches your web development rating and your stated preference for a Computing track.',
  },
  {
    code: 'BS-IS',
    field: 'College programme',
    name: 'BS Information Systems',
    score: 71,
    why: 'Keeps the technical load but trades heavy maths for the database work you rate highest.',
  },
];

const CAPS = [
  { key: 'stem', label: 'STEM', note: 'Science, Technology, Engineering, Mathematics' },
  { key: 'hum', label: 'HUMSS', note: 'Humanities, Social Sciences, Political Science' },
  { key: 'bus', label: 'ABM', note: 'Accountancy, Business, Management' },
  { key: 'arts', label: 'Arts & Design', note: 'Media, Arts, Design' },
];

const ROOMS = [
  {
    code: '01',
    title: 'Take the quiz',
    body: 'Ten questions about your track, the skills you already have, what you enjoy, and what you are aiming at. No sign-up wall until you have seen a result.',
  },
  {
    code: '02',
    title: 'Read the reasoning',
    body: 'Three programmes or roles, each with a match score and the specific answer of yours that moved it. You can disagree with it, and the reasoning is what lets you.',
  },
  {
    code: '03',
    title: 'Prepare with it',
    body: 'Practise against an AI recruiter, build a resume from the same profile, and see which demanded skills your profile is missing.',
  },
];

export default function Landing() {
  return (
    <>
      {/* The board itself. Full-bleed, nothing centred, nothing floating. */}
      <section className="board-head">
        <div className="container">
          <h1 className="board-title">
            Find the door<br />that fits you.
          </h1>
          <p className="lead board-lead">
            SkillForge scores you against a catalogue of programmes and entry-level roles, then shows
            you the reasoning behind every match. Not a list — an argument you can check.
          </p>

          <div className="row board-actions">
            <Link className="btn btn-primary" to="/register">
              Start the intake quiz <IconTarget size={16} />
            </Link>
            <Link className="btn btn-ghost" to="/login">Sign in</Link>
          </div>

          {/* The memorable moment: ranked matches as lit departures. */}
          <div className="destinations board-destinations" aria-label="Example results">
            {DESTINATIONS.map((d, i) => (
              <article className="destination" data-rank={i + 1} key={d.code}>
                <div className="destination-code">
                  <span>{d.code}</span>
                  <span className="destination-score">{d.score}</span>
                </div>
                <h3 className="destination-name">{d.name}</h3>
                <p className="destination-why">{d.why}</p>
                <div className="meter" aria-hidden="true">
                  <i style={{ transform: `scaleX(${d.score / 100})` }} />
                </div>
                <span className="tiny">{d.field}</span>
              </article>
            ))}
          </div>

          <p className="tiny board-note">
            Illustrative results using the seeded reference catalogue, not observed placement data.
          </p>

          <div className="legend">
            {CAPS.map((c) => (
              <span className="legend-item" key={c.key} title={c.note}>
                <span className="legend-swatch" style={{ background: `var(--cap-${c.key})` }} aria-hidden="true" />
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <main className="app-main">
        {/* What the board actually does, as rooms on the same corridor. */}
        <section className="section">
          <div className="container">
            <h2 className="section-head">Three rooms, one profile</h2>
            <div className="stack" style={{ maxWidth: '72ch' }}>
              {ROOMS.map((r) => (
                <div className="how-item" key={r.code}>
                  <div className="bar-row" style={{ marginBottom: '0.5rem' }}>
                    <h3 className="rec-title">{r.title}</h3>
                    <span className="level mono">{r.code}</span>
                  </div>
                  <p style={{ margin: 0 }}>{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The privacy posture is a product fact, so it is stated as one. */}
        <section className="section">
          <div className="container">
            <div className="cta-band">
              <div className="row" style={{ alignItems: 'flex-start', gap: '1rem' }}>
                <IconShield size={22} />
                <div>
                  <h2 style={{ marginBottom: '0.4rem' }}>Your answers stay yours</h2>
                  <p style={{ margin: 0, maxWidth: '62ch' }}>
                    This is a private, login-gated application. It asks search engines and AI crawlers not
                    to index it, your screens carry your own watermark, and the browser holds no database
                    key at all — every request goes through the API. Your profile is never cached on a
                    shared server.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="row-between" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <h2 style={{ marginBottom: '0.3rem' }}>Ten questions is all it takes</h2>
                <p style={{ margin: 0, maxWidth: '52ch' }}>
                  You will have a ranked shortlist and the reasoning behind it before you decide whether
                  to keep going.
                </p>
              </div>
              <Link className="btn btn-primary" to="/register">
                Start the intake quiz <IconTarget size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}