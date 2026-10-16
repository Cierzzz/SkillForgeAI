import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconCheck } from './Icons.jsx';

/**
 * Career Compass - a side game, and only a side game.
 *
 * It has NO security role. The anti-bot gate stays the server's job: either the
 * built-in challenge or Cloudflare Turnstile. This exists because a sign-in box
 * is the loneliest screen in a product and it should not feel like one.
 *
 * Every question is drawn at random from five kinds, so two people never see the
 * same run and no single topic dominates. All content is real: the strands are
 * the actual Philippine SHS offerings, and the skills, roles, industries and
 * programmes are the project's own seeded catalogue (backend/sql/003_seed_catalog.sql).
 * Nothing here is invented, which is why it is safe to learn from.
 *
 * Accessibility commitments, because PRODUCT.md makes WCAG 2.1 AA binding and a
 * meaningful share of this audience is on a phone or using assistive tech:
 *   - No timer anywhere. There is no way to lose to the clock.
 *   - Every answer is a real <button>: reachable by Tab, fired by Enter/Space.
 *   - Number keys are an enhancement layered on that, never the only way.
 *   - Results are announced, and never signalled by colour alone.
 *   - The answer key is shuffled per question, so position never leaks the answer.
 */

const ROUNDS = 8;

/* ------------------------------------------------------- question bank ---- */

const STRAND_SUBJECTS = [
  { subject: 'Calculus', strand: 'stem' },
  { subject: 'General Chemistry', strand: 'stem' },
  { subject: 'Precalculus', strand: 'stem' },
  { subject: 'Basic Biology', strand: 'stem' },
  { subject: 'Edukasyon sa Pagpapakatao', strand: 'humss' },
  { subject: 'Contemporary Philippine Issues', strand: 'humss' },
  { subject: 'Araling Panlipunan', strand: 'humss' },
  { subject: 'World History', strand: 'humss' },
  { subject: 'Entrepreneurship', strand: 'abm' },
  { subject: 'Financial Accounting', strand: 'abm' },
  { subject: 'Business Mathematics', strand: 'abm' },
  { subject: 'Principles of Marketing', strand: 'abm' },
  { subject: 'Contemporary Philippine Arts from the Regions', strand: 'arts' },
  { subject: 'Music', strand: 'arts' },
  { subject: 'Design and Technology', strand: 'arts' },
  { subject: 'Technical and Livelihood Education', strand: 'arts' },
];

const STRANDS = {
  stem: 'STEM',
  humss: 'HUMSS',
  abm: 'ABM',
  arts: 'Arts & Design',
};

/** Seeded catalogue: skills and their category. */
const SKILL_CATEGORY = {
  'Programming / Coding': 'technical', 'Web Development': 'technical',
  'Database Design': 'technical', 'Data Analysis': 'technical',
  'Cybersecurity': 'technical', 'Computer Networking': 'technical',
  'Machine Learning': 'technical', 'Statistics': 'technical',
  'UI / UX Design': 'technical', 'Graphic Design': 'technical',
  'Mobile App Development': 'technical', 'SQL / Spreadsheets': 'technical',
  'Mathematics Logic': 'technical', 'Technical Writing': 'technical',
  'Communication': 'soft', 'Teamwork': 'soft', 'Leadership': 'soft',
  'Problem Solving': 'soft', 'Critical Thinking': 'soft',
  'Creativity': 'soft', 'Public Speaking': 'soft',
  'Time Management': 'soft', 'Adaptability': 'soft',
  'Organization': 'soft', 'Attention to Detail': 'soft',
  'Client Handling': 'soft', 'Troubleshooting': 'soft',
  'Accounting': 'domain', 'Bookkeeping': 'domain', 'Marketing': 'domain',
  'Sales & Negotiation': 'domain', 'Teaching': 'domain',
  'Nursing & Care': 'domain', 'Engineering Drafting': 'domain',
  'Customer Service': 'domain',
};

/** Seeded catalogue: job role -> industry. */
const ROLE_INDUSTRY = {
  Accountant: 'Finance', 'External Auditor': 'Finance',
  'Backend Developer': 'Software', 'Frontend Developer': 'Software',
  'Full-Stack Developer': 'Software', 'QA / Test Engineer': 'Software',
  'Data Analyst': 'Analytics',
  'Digital Marketing Specialist': 'Marketing',
  'Graphic Designer': 'Creative',
  'UI/UX Designer': 'Product',
  'HR Recruiter': 'Human Resources',
  'IT Support Specialist': 'IT Services',
  'Registered Nurse': 'Healthcare',
  'Sales Associate': 'Sales',
  'Technical Writer': 'Media',
};

/** Seeded catalogue: programme -> field. */
const PROGRAM_FIELD = {
  'BS Computer Science': 'Computing',
  'BS Information Technology': 'Computing',
  'BS Computer Science (Data Science)': 'Computing',
  'BS Accounting Information Technology': 'Computing',
  'BS Accountancy': 'Business',
  'BS Business Administration': 'Business',
  'BS Civil Engineering': 'Engineering',
  'BS Architecture': 'Design',
  'BS Graphic Design': 'Design',
  'BS Communication': 'Humanities',
  'BS Psychology': 'Social Sciences',
  'BS Nursing': 'Health Sciences',
};

/** Seeded catalogue: which roles list this skill as required. */
const SKILL_ROLES = {
  'Programming / Coding': ['Backend Developer', 'Frontend Developer', 'Full-Stack Developer'],
  'Data Analysis': ['Data Analyst', 'Digital Marketing Specialist'],
  'Accounting': ['Accountant', 'External Auditor'],
  'Nursing & Care': ['Registered Nurse'],
  'Graphic Design': ['Graphic Designer'],
  'UI / UX Design': ['UI/UX Designer', 'Graphic Designer', 'Frontend Developer'],
  'Bookkeeping': ['Accountant', 'External Auditor'],
  'Sales & Negotiation': ['Sales Associate'],
  'Technical Writing': ['Technical Writer', 'QA / Test Engineer'],
  'Machine Learning': ['Data Analyst'],
  'Statistics': ['Data Analyst'],
  'Database Design': ['Backend Developer', 'Full-Stack Developer'],
  'Web Development': ['Frontend Developer', 'Full-Stack Developer'],
};

const SKILL_CATEGORY_LABEL = { technical: 'Technical', soft: 'Soft skill', domain: 'Domain' };

/* ---------------------------------------------------------- builders ----- */

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Give a question three wrong options drawn from the same pool, plus the answer. */
function options(answer, pool, size = 3) {
  const wrong = shuffle(pool.filter((x) => x !== answer)).slice(0, size);
  return shuffle([answer, ...wrong]);
}

const BUILDERS = [
  {
    kind: 'strand',
    label: 'Senior high strands',
    build() {
      const q = pick(STRAND_SUBJECTS);
      return {
        prompt: 'Which strand offers this subject?',
        subject: q.subject,
        answer: STRANDS[q.strand],
        options: options(STRANDS[q.strand], Object.values(STRANDS)),
        explain: `${q.subject} sits in ${STRANDS[q.strand]}.`,
      };
    },
  },
  {
    kind: 'skill-category',
    label: 'Skill types',
    build() {
      const name = pick(Object.keys(SKILL_CATEGORY));
      const answer = SKILL_CATEGORY_LABEL[SKILL_CATEGORY[name]];
      return {
        prompt: 'What kind of skill is this?',
        subject: name,
        answer,
        options: options(answer, Object.values(SKILL_CATEGORY_LABEL)),
        explain: `${name} is a ${SKILL_CATEGORY_LABEL[SKILL_CATEGORY[name]].toLowerCase()} in the catalogue.`,
      };
    },
  },
  {
    kind: 'industry',
    label: 'Work fields',
    build() {
      const role = pick(Object.keys(ROLE_INDUSTRY));
      const answer = ROLE_INDUSTRY[role];
      return {
        prompt: 'Which field does this job sit in?',
        subject: role,
        answer,
        options: options(answer, Object.values(ROLE_INDUSTRY)),
        explain: `${role} works in ${answer}.`,
      };
    },
  },
  {
    kind: 'programme',
    label: 'Degree fields',
    build() {
      const prog = pick(Object.keys(PROGRAM_FIELD));
      const answer = PROGRAM_FIELD[prog];
      return {
        prompt: 'Which field of study is this programme in?',
        subject: prog,
        answer,
        options: options(answer, Object.values(PROGRAM_FIELD)),
        explain: `${prog} is under ${answer}.`,
      };
    },
  },
  {
    kind: 'skill-role',
    label: 'Skills to jobs',
    build() {
      const skill = pick(Object.keys(SKILL_ROLES));
      const answer = pick(SKILL_ROLES[skill]);
      const pool = [...new Set(Object.values(SKILL_ROLES).flat())];
      return {
        prompt: 'Which job most needs this skill?',
        subject: skill,
        answer,
        options: options(answer, pool),
        explain: `${answer} lists ${skill} among its required skills.`,
      };
    },
  },
];

/** A round-robin of every kind, shuffled, so all five appear in one run. */
function buildDeck() {
  const kinds = shuffle(BUILDERS);
  const rounds = [];
  for (let i = 0; i < ROUNDS; i += 1) rounds.push(kinds[i % kinds.length]);
  return shuffle(rounds).map((b) => b.build());
}

/* ------------------------------------------------------------- view ------ */

export default function StrandGame({ compact = false }) {
  const [deck, setDeck] = useState(buildDeck);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [picked, setPicked] = useState(null);
  const [phase, setPhase] = useState('playing');
  const rootRef = useRef(null);
  const nextRef = useRef(null);

  const current = deck[index];
  const finished = phase === 'done' || index >= deck.length || !current?.options;
  const answered = picked !== null;
  const wasRight = answered && picked === current?.answer;
  const optionCount = current?.options?.length ?? 0;

  const answer = useCallback((value) => {
    if (answered || finished) return;
    setPicked(value);
    if (value === current.answer) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const n = s + 1;
        setBest((b) => Math.max(b, n));
        return n;
      });
    } else {
      setStreak(0);
    }
  }, [answered, finished, current]);

  const next = useCallback(() => {
    setPicked(null);
    if (index + 1 >= deck.length) setPhase('done');
    else setIndex((i) => i + 1);
  }, [index, deck.length]);

  const replay = useCallback(() => {
    setDeck(buildDeck());
    setIndex(0);
    setScore(0);
    setStreak(0);
    setPicked(null);
    setPhase('playing');
    setTimeout(() => rootRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (answered || finished) return undefined;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (!/^[1-9]$/.test(e.key)) return;
      const choice = Number(e.key) - 1;
      if (choice >= (current?.options?.length ?? 0)) return;
      e.preventDefault();
      answer(current.options[choice]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, finished, answer, current]);

  useEffect(() => {
    if (!answered) return;
    nextRef.current?.focus();
  }, [answered]);

  const remaining = useMemo(() => Math.max(0, ROUNDS - index), [index]);

  return (
    <div className={`strand-game${compact ? ' is-compact' : ''}`} ref={rootRef} tabIndex={-1}>
      <div className="strand-game-head">
        <div>
          <span className="level">Side game</span>
          <h3 className="strand-game-title">Career Compass</h3>
        </div>
        <div className="strand-game-score">
          <span className="mono">{score}</span>
          <span className="tiny">/ {ROUNDS}</span>
        </div>
      </div>

      {finished ? (
        <div className="strand-game-done">
          <p className="strand-game-final">
            You placed <strong>{score}</strong> of {ROUNDS}.
            {streak > 1 ? ` Best run: ${best} in a row.` : ''}
          </p>
          <p className="tiny">Every run is a fresh mix. Optional - it never gates your sign-in.</p>
          <button type="button" className="btn btn-sm btn-ghost" onClick={replay}>New mix</button>
        </div>
      ) : (
        <>
          <div className="strand-prompt">
            <span className="level">{current.prompt}</span>
            <p className="strand-subject">{current.subject}</p>
            <span className="tiny">{remaining} left</span>
          </div>

          <div className="strand-keys" role="group" aria-label="Choose an answer">
            {current.options.map((opt, i) => {
              const chosen = picked === opt;
              const reveal = answered && opt === current.answer;
              const miss = answered && chosen && !wasRight;
              return (
                <button
                  key={opt}
                  type="button"
                  className="strand-key"
                  data-state={reveal ? 'right' : miss ? 'wrong' : chosen ? 'picked' : 'idle'}
                  onClick={() => answer(opt)}
                  disabled={answered}
                >
                  <span className="strand-key-num mono" aria-hidden="true">{i + 1}</span>
                  <span className="strand-key-label">{opt}</span>
                  {reveal ? <IconCheck size={15} /> : null}
                </button>
              );
            })}
          </div>

          <p
            className="status-line"
            data-state={answered ? (wasRight ? 'done' : 'working') : 'idle'}
            aria-live="polite"
          >
            {answered
              ? wasRight
                ? `Correct. ${current.explain}`
                : `Not quite. ${current.explain}`
              : `Choose an answer. ${optionCount} options.`}
          </p>

          {answered ? (
            <button type="button" className="btn btn-sm btn-primary" onClick={next} ref={nextRef}>
              Next question
            </button>
          ) : null}
        </>
      )}

      <p className="tiny strand-game-foot">
        Keyboard: Tab to an answer and press Enter, or press {Array.from({ length: optionCount }, (_, i) => i + 1).join('–')}. No timer.
      </p>
    </div>
  );
}