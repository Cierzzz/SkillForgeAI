# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Confirmed from the existing SkillForge AI codebase (repository lives outside this
folder; this record is the durable context authority for it).

- **Frontend:** React 18 (JSX), Vite 5, React Router 6, plain modern CSS with
  custom properties. No UI framework.
- **Backend:** Node 18+ with Express 4, decoupled from the frontend over a
  private REST API.
- **Database:** PostgreSQL on Supabase. Row Level Security is enabled and
  forced on every table; the `anon` and `authenticated` roles hold no grants, so
  the browser's publishable key can read nothing. All access goes through the
  backend connection.
- **AI:** pluggable provider (Gemini, OpenAI, or a built-in offline mock engine).

## Users

**Senior high school students** in the Philippines deciding which college
programme to enter. They take a short quiz about their track, skills, and
interests, and need a shortlist with enough reasoning to trust it.

**Fresh college graduates and early-career entrants** choosing an entry-level
role. Same audience shape, higher stakes on the job side.

**Administrators** manage accounts, registration codes, the security log, and AI
usage. A small, trusted group.

## Product Purpose

SkillForge AI turns a short self-assessment into concrete career direction: a
shortlist of college programmes or entry-level job roles with match scores and
the reasoning behind them. It then supports that decision with an AI career
advisor, a mock interview that scores each answer, a resume builder, and a view
of which skills employers are demanding versus where a given profile has gaps.

Success means the user leaves with a decision they can act on and artifacts they
can use — not a list to keep scrolling.

## Positioning

Recommendations are scored against a seeded catalogue and shown **with the
reasoning attached**, not as an opaque ranking. The same product then carries
the user through interview practice and the resume, so guidance and preparation
happen in one place rather than across disconnected tools.

The application is private and login-gated. It is deliberately not indexed by
search engines or AI crawlers.

## Operating Context

- **Registration is gated.** An account cannot be created without a valid
  registration (signup) code. Codes carry a role grant, a use limit, and an
  expiry, and are consumed atomically.
- **Captcha is adaptive.** It is required for every registration, and for login
  after five failed attempts. Accounts lock temporarily after repeated failures.
- **Security is a first-class feature.** A security log, rate limiting, origin
  checks, and honeypot fields are part of normal operation, not incident response.
- **Administrators** review accounts, mint registration codes, and watch AI usage
  and security events.
- **Deployment is self-hosted.** The user manages hosting; the frontend, the API,
  and the database are three separately operated pieces.

## Capabilities and Constraints

**Capabilities**

- Multi-step intake quiz: track, self-rated skills (1–5), interests, goal.
- Recommendations: top three programmes or roles, each with a match score and reasoning.
- AI chat in two modes: career counseling and mock interview, the latter scoring
  each answer for strengths and improvements.
- Resume builder: generate, preview, download as HTML/text, print to PDF.
- Skill trends: demanded skills versus gaps in the user's own profile.
- Profile management, including password change.
- Admin panel: accounts, registration codes, security log, AI usage.

**Constraints**

- No secrets in the browser bundle. The frontend holds no database key, no AI
  key, and no privileged token; the access token lives in memory and the refresh
  token in `sessionStorage`.
- The browser's Supabase key is powerless by design — the API is the only
  network boundary to the database.
- Passwords are bcrypt at cost 12.
- Private by default: `noindex` headers, a restrictive Content-Security-Policy,
  per-user watermarking, and no shared caching of personal pages.
- **Academic versus commercial framing is undecided.** Future work must not
  assume either. This was asked and deliberately left open, so tone, permitted
  claims, and how defensively the interface reads all remain genuinely open
  questions rather than settled facts.

## Brand Commitments

- **Name:** SkillForge AI.
- **Voice:** clear, encouraging, and plain. Career guidance for students who may
  be anxious about a high-stakes decision — supportive without being
  patronising or promising outcomes.
- The mark is an anvil struck under a lamp, in litre orange; the interface reads
  as a calm, dark, focused workspace rather than a marketing page.

  *(This supersedes an earlier "SF in a rounded mark". The anvil replaced it,
  and the colour changed with it: the cyan `#00E5B5` was retired because it had
  no meaning in the palette — litre orange `--lamp` is reserved for exactly one
  thing, a candidate being struck forward. The mark is inlined SVG, not an
  `<img>`, because CSS variables do not cross the `<img>` boundary and an
  external file could not follow the theme.)*

## Evidence on Hand

- **Working system.** The full application runs and has been verified end to end:
  login, dashboard, and seeded data reads from the live database.
- **Seeded catalogue:** 35 skills, 22 interests, 12 college programmes, 15 job
  roles, and 17 market-trend rows. This is reference data authored for the
  project, not observed labour-market data.
- **Demo accounts:** an administrator and a student account exist with seeded
  profiles, skills, and interests.
- **Automated coverage:** a 51-check backend suite covering auth, profiles,
  assessments, chat, resumes, and AI-usage metering, plus dedicated captcha checks.

**Absent, and must not be fabricated:** there are no real users, testimonials,
customer logos, press mentions, case studies, outcome statistics, or third-party
benchmarks. Any future surface that implies traction is inventing evidence.

## Product Principles

1. **Show the reasoning.** A recommendation the user cannot interrogate is not
   advice. Every score carries its explanation.
2. **One decision at a time.** The product should carry a user from uncertainty to
   a decision, not present every available tool at once.
3. **Earn trust before asking for effort.** Guidance first, resume and interview
   work second, because that is the order the user needs them in.
4. **Privacy is a feature, not a setting.** No indexing, no secrets in the
   browser, no silent caching of personal pages.
5. **Do not manufacture authority.** With no real outcome data, be transparent
   about what the recommendations are based on rather than implying certainty.

## Accessibility & Inclusion

WCAG 2.1 AA or better is a requirement, not a goal.

Specific obligations already established for this product: inputs use a 16px
font so iOS does not zoom on focus; touch targets are at least 44px; visible
focus states are required on every interactive element; `prefers-reduced-motion`
is honoured; and the interface must meet the standard on mobile, since a
meaningful share of the audience will be on a phone rather than a laptop.