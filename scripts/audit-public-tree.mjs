/**
 * One-off audit: what would a PUBLIC repository actually expose?
 *
 *   node scripts/audit-public-tree.mjs
 *
 * The secret scanner answers "is a credential committed". This answers a
 * different and broader question: "what does publishing this tree tell the
 * world?" A frontend repo can be perfectly secret-free and still hand over a
 * map of the system - every route name, every threshold, every internal host.
 *
 * It runs in report mode: it prints findings, it does not fail the build. This
 * is a review aid, not a gate. The gate is scripts/check-secrets.mjs.
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

/** Each probe: what an attacker learns, and whether it is acceptable. */
const PROBES = [
  {
    label: 'seeded registration codes',
    re: /SKILLFORGE-(?:ADMIN|USER|DEMO)-[A-Z0-9]+/g,
    severity: 'critical',
    why: 'A code is a bearer credential. A published admin code mints admins.',
  },
  {
    label: 'demo account passwords',
    re: /(?:Admin|User)@SkillForge\d/g,
    severity: 'critical',
    why: 'Direct access to a live account.',
  },
  {
    label: 'database password',
    re: /systemdatabase1421/g,
    severity: 'critical',
    why: 'Connects as the privileged role and therefore bypasses RLS entirely.',
  },
  {
    label: 'Google API key',
    re: /AIza[0-9A-Za-z_-]{35,}/g,
    severity: 'critical',
    why: 'Direct billing exposure.',
  },
  {
    label: 'Supabase project ref',
    re: /[a-z]{20,}\.supabase\.co|postgresql:\/\/postgres\.[a-z0-9]{8,}/g,
    severity: 'note',
    why: 'Identifies the project. Public in the site URL, but do not publish it by accident.',
  },
  {
    label: 'internal hosts',
    re: /\.onrender\.com|192\.168\.\d+\.\d+/g,
    severity: 'note',
    why: 'Points at internal infrastructure that should not outlive a project.',
  },
  {
    label: 'security thresholds',
    re: /\b(?:LOGIN_CAPTCHA_AFTER|AUTH_MAX_ATTEMPTS|BURST_LIMIT|RATE_WINDOW_MINUTES)\s*[:=]\s*\d+/g,
    severity: 'info',
    why: 'Not a secret, but it tells someone exactly where the walls are thin.',
  },
];

console.log(`\n=== public tree audit: ${staged.length} staged file(s) ===\n`);

let critical = 0;
let note = 0;

for (const probe of PROBES) {
  const hits = [];
  for (const file of staged) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (probe.re.test(line)) hits.push(`${file}:${i + 1}`);
      probe.re.lastIndex = 0;
    });
  }

  if (hits.length === 0) {
    console.log(`  \x1b[32mclean\x1b[0m  ${probe.label}`);
  } else {
    const colour = probe.severity === 'critical' ? '\x1b[31mHIT  ' : '\x1b[33mnote ';
    console.log(`  ${colour}\x1b[0m  ${probe.label}  ->  ${hits.slice(0, 6).join(', ')}`);
    console.log(`          ${probe.why}`);
    if (probe.severity === 'critical') critical += hits.length;
    if (probe.severity === 'note') note += hits.length;
  }
}

console.log(
  critical === 0
    ? `\n  \x1b[32mno credential is present in this tree\x1b[0m\n`
    : `\n  \x1b[31m${critical} critical finding(s) - do not publish\x1b[0m\n`,
);

process.exit(critical === 0 ? 0 : 1);