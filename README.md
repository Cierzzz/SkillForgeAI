# SkillForge AI — Frontend

**SkillForge AI** is an AI-powered career guidance platform for Senior High School students and fresh college
graduates. Students take a short skills-and-interests quiz, get personalised college-programme or entry-level job
recommendations with explanations, practise job interviews against an AI recruiter, and build an ATS-friendly resume.

> **What this repository contains**
> This is the **frontend only**. The application talks to a private REST API over HTTPS. No database credentials,
> no API keys and no backend logic are present in this repository or in the built bundle — by design.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | React 18 (JSX) |
| Build tool | Vite 5 |
| Routing | React Router 6 |
| Styling | Plain modern CSS (custom properties, CSS grid, no UI framework) |
| Language | HTML · CSS · JavaScript (JSX) |

---

## Features

| Screen | What it does |
| --- | --- |
| **Landing** | Product overview and call to action |
| **Sign in** | E-mail + password, with a captcha that unlocks after 5 failed attempts |
| **Create account** | Registration protected by a one-time code **and** a captcha |
| **Intake quiz** | Multi-step: your track, your skills (rated 1–5), your interests, your goal |
| **Recommendations** | Your top three programmes or job roles with a match score and the reasoning |
| **AI chat** | Career counseling mode and mock-interview mode with per-answer scoring |
| **Resume builder** | Generates a resume, preview it, download as HTML/text, print to PDF |
| **Skill trends** | Which skills employers are demanding, and where your profile has gaps |
| **Profile** | Personal details and password change |
| **Admin panel** | Accounts, registration codes, security log and AI usage (admin role only) |

---

## Responsive design

Built mobile-first and tested across every screen size:

- **Phones (360 px+)** — single column, drawer navigation, 44 px touch targets
- **Tablets (768 px+)** — two-column grids
- **Laptops / desktops (1024 px+)** — full navigation bar, three-column dashboards, side-by-side layouts

Type scales fluidly with `clamp()`, inputs use a 16 px font (prevents iOS zoom on focus), layouts respect
safe-area insets, and `prefers-reduced-motion` is honoured.

---

## Getting started

```bash
npm install
cp .env.example .env      # set the API base URL
npm run dev               # http://localhost:5173
```

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Public URL of the API, e.g. `https://your-api-host.example.com/api` |

Production build:

```bash
npm run build             # outputs dist/
npm run preview           # preview the production build locally
```

---

## Deployment

This repository is the **frontend only**. It is one of two repositories:

| Repository | Visibility | Contains |
| --- | --- | --- |
| `SkillForgeAI` (this one) | Public | The browser application |
| `SkillForgeAI-api` | Private | REST API, database migrations, deployment ops |

They are coupled through exactly one value — `VITE_API_BASE_URL` — and nothing
else. There is no submodule, no shared package and no cross-repo import, so
either can be cloned, built and deployed without the other being present.

### Deploying this repository

#### Deploying to Netlify

The repository is pre-configured for Netlify with `netlify.toml` at the root and `frontend/public/_redirects`:

1. **Import Project:** In Netlify, click **Add new site** → **Import an existing project** → select `SkillForgeAI`.
2. **Build settings:** Automatically inferred from `netlify.toml`:
   - **Base directory:** `frontend`
   - **Build command:** `npm install --include=dev && npm run build`
   - **Publish directory:** `frontend/dist`
3. **Set Environment Variable:**
   - Navigate to **Site configuration** → **Environment variables**.
   - Add `VITE_API_BASE_URL` set to your deployed `SkillForgeAI-api` URL (e.g. `https://your-api-host.example.com/api`).
4. **Deploy:** Click **Deploy**. Since Vite bakes `VITE_API_BASE_URL` into the frontend bundle at build time, any changes to this URL require a redeploy.

#### Deploying to Vercel

1. Vercel → **Add New → Project** → import this repository
2. **Root Directory:** `frontend`
3. **Framework Preset:** Vite
4. Add the environment variable `VITE_API_BASE_URL` → your deployed API URL
5. **Deploy**, then redeploy once — the variable is baked in at build time

`frontend/vercel.json` already sets the build command, output directory, SPA
rewrites and every security header. Leave it alone.

### Connecting with `SkillForgeAI-api`

The frontend (`SkillForgeAI`) and backend (`SkillForgeAI-api`) are decoupled and connect over HTTPS:

1. **CORS Origin:** Once the Netlify frontend is deployed (e.g. `https://profound-sherbet-44cced.netlify.app`), add its exact origin to the `SkillForgeAI-api` backend environment variable `ALLOWED_ORIGINS` and redeploy the API.
2. **Reverse Proxy (Optional):** To eliminate CORS configurations entirely, proxy `/api/*` requests through Netlify directly to the API host by adding this redirect in `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://your-api-host.example.com/api/:splat"
     status = 200
     force = true
   ```
   When using the proxy, `VITE_API_BASE_URL` defaults to `/api` in production.

#### Deploying the `SkillForgeAI-api` repository

The backend repository (`SkillForgeAI-api`) contains the Node/Express 4 REST API, Supabase PostgreSQL schema/migrations, and AI provider integrations:
- Deploy `SkillForgeAI-api` on your preferred Node hosting platform (e.g., Render, Railway, Fly.io, Heroku) or as serverless functions.
- Configure its backend environment variables: database connection string, JWT secrets, AI API key(s), and `ALLOWED_ORIGINS` containing the Netlify URL.

### The one thing that breaks

After this site is live, add its **exact origin** to the API's
`ALLOWED_ORIGINS` and redeploy the API. Scheme and host must match precisely, no
trailing slash.

Miss this and every API call fails in the browser with `Failed to fetch` while
the API is perfectly healthy and returns 200 to anyone who asks directly. It is
the single most common thing to go wrong when the two halves are deployed
separately.

### Check it worked

```powershell
curl https://your-api-host/api/health    # {"status":"ok", ...}
```

If that returns JSON, the API is fine and any remaining problem is CORS.

### Security headers

`frontend/vercel.json` ships with:

- `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` — the application is private and must not be indexed
- `Content-Security-Policy` with a strict `connect-src` allowing only the API origin
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`
- `Cache-Control: no-store` on HTML so no shared cache can retain personal pages

`public/robots.txt` additionally disallows all crawling.

---

## Project structure

```
frontend/
├── index.html                 entry document (includes noindex meta tags)
├── vercel.json                Vercel build, SPA rewrite and header configuration
├── vite.config.js
└── src/
    ├── main.jsx               React entry point
    ├── App.jsx                routes and guards
    ├── lib/api.js             the single network boundary to the API
    ├── context/AuthContext.jsx  session state, silent token refresh
    ├── components/            Layout, Captcha, PasswordField, Protected, Toast, UI primitives
    ├── pages/                 one file per screen
    └── styles/                global.css (design tokens) and pages.css
```

---

## Security notes

- **No secrets in the browser.** The bundle contains no database URL, no API key and no privileged token.
- **Tokens** — the short-lived access token is held in memory; the refresh token lives in `sessionStorage`,
  never in `localStorage`, and is rotated by the API on every refresh.
- **Captcha** — self-hosted, generated by the API, solved in-app, and required for registration.
- **Content protection** — private screens carry a per-user watermark, responses are never cached, and the
  application refuses to be indexed by search engines or AI crawlers.

---

## Licence

Provided as-is for an academic project. Add your own licence before any public release.