#!/usr/bin/env node
/**
 * Secret scanner - run before every commit (see .githooks/pre-commit).
 *
 * Fails the commit when a staged file looks like it contains a real
 * credential, or when a file that must never be committed is staged at all.
 *
 *   node scripts/check-secrets.js            # scan staged files
 *   node scripts/check-secrets.js --all      # scan every tracked file
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const git = process.env.GIT ?? 'git';
const scanAll = process.argv.includes('--all');

const run = (args) => execFileSync(git, args, { encoding: 'utf8' }).trim();

/* Files that must never exist in the repository, whatever they contain. */
const FORBIDDEN_FILES = [
  /^\.env$/,
  /^\.env\.(?!example$|sample$|template$)/,
  /(^|\/)\.env\.(?!example$|sample$|template$)/,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /(^|\/)id_rsa/i,
  /\.netrc$/i,
  /\.npmrc$/i,
  /(^|\/)secrets\.json$/i,
  /\.dump$/i,
  /\.backup$/i,
  /\.sqlite3?$/i,
];

/* Places where a "secret" is expected and therefore allowed. */
const ALLOWLIST = [
  /^docs\/CREDENTIALS\.md$/, // demo passwords are published on purpose
  /\.example$/,
  /\.sample$/,
  /\.template$/,
  /^README\.md$/,
  // Test suites deliberately use throwaway secrets - they must stay non-trivial
  // in length so the code under test exercises real HMAC verification.
  /^backend\/scripts\/integration-test\.js$/,
  /^backend\/scripts\/smoke\.js$/,
  // The scanner necessarily contains example key shapes in its own rule comments.
  /^scripts\/check-secrets\.mjs$/,
];

const RULES = [
  {
    name: 'Supabase connection string',
    // postgresql://user:password@host  (password present = real secret)
    re: /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]{6,}@[^\s/]+/gi,
    allowExample: true,
  },
  {
    name: 'Google API key',
    // Real keys are AIza + 35 chars; allow 35+ so an over-long paste still trips.
    re: /\bAIza[0-9A-Za-z\-_]{35,}/g,
  },
  {
    name: 'OpenAI-style API key',
    re: /\bsk-[A-Za-z0-9]{20,}\b/g,
  },
  {
    name: 'Anthropic API key',
    re: /\bsk-ant-[A-Za-z0-9\-_]{20,}\b/g,
  },
  {
    name: 'AWS access key id',
    re: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    name: 'GitHub personal access token',
    re: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g,
  },
  {
    name: 'Stripe live secret key',
    re: /\bsk_live_[A-Za-z0-9]{20,}\b/g,
  },
  {
    name: 'Slack token',
    re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    name: 'Private key block',
    re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g,
  },
  {
    name: 'secret assigned a literal',
    // When the NAME says secret, the value does not need to look random.
    //
    // The earlier 32-character floor was there to avoid flagging short test
    // values, but it quietly created a hole: a real database password is often
    // 16-24 characters, so an assignment like `DB_PASSWORD = "hunter2hunter2"`
    // passed. An 8-character floor is the better trade - anything shorter is
    // not a secret worth protecting, and PLACEHOLDER still discards the
    // documented dummy values.
    //
    // The value may be wrapped in quotes OR BACKTICKS. That is not cosmetic:
    // while documenting this rule I pasted a real password into a comment as
    // `DB_PASSWORD = "..."`, and the `["']?` below did not match the backticks,
    // so the scanner reported the file CLEAN while the credential sat in it.
    // Wrapping characters are now tolerated on both sides.
    re: /\b(JWT_SECRET|JWT_REFRESH_SECRET|CAPTCHA_SECRET|DB_PASSWORD|SUPABASE_SERVICE_ROLE_KEY)\s*[=:]\s*["'`]*[A-Za-z0-9_\-]{8,}["'`]*/g,
    skipPlaceholders: true,
  },
];

/**
 * Markers that mean "this is a template, not a credential".
 *
 * Applied to the whole match, not just the value, because a real secret is an
 * opaque random string while a template is made of words. Two additions:
 *
 *   <ANGLE_BRACKETS>  the clearest possible placeholder. No credential can
 *                     contain `<` or `>`, so this cannot hide a real secret.
 *   ${...}            a JS template literal, i.e. a URI assembled from
 *                     variables at runtime. Nothing secret is ever interpolated
 *                     into a source file like that.
 *
 * This exists so a document can show the real SHAPE of a connection string
 * without the scanner flagging it - and without anyone having to add an
 * allowlist entry, which would be a hole large enough to park a real password in.
 */
const PLACEHOLDER =
  /(change_me|your_|yourprojectref|replace|example|placeholder|dummy|redacted|xxxx|xxx+|\*+|^dev_|^test_|^demo_|^sample_|^fake_|^notreal|PLACEHOLDER|[<][^<>]+[>]|\$\{[^}]*\})/i;

function stagedFiles() {
  const out = run(['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
  return out ? out.split('\n').filter(Boolean) : [];
}

/**
 * Everything that would end up in the repository.
 *
 * `--cached` is tracked files, `--others --exclude-standard` is untracked files
 * that are NOT ignored. Together that is exactly the set `git add .` would
 * stage, which is the only set worth scanning.
 *
 * Plain `git ls-files` (tracked only) is the wrong list and was a real gap: on
 * a first commit it reports zero files and prints "clean", having examined
 * nothing at all. A green secret scan that read no files is worse than no scan,
 * because it is believed.
 */
function committableFiles() {
  const out = run(['ls-files', '--cached', '--others', '--exclude-standard']);
  return out ? out.split('\n').filter(Boolean) : [];
}

function read(file) {
  try {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) return null;
    const stat = fs.statSync(abs);
    if (stat.size > 2_000_000) return null; // skip binaries / huge files
    return fs.readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
}

function main() {
  const files = scanAll ? committableFiles() : stagedFiles();
  const problems = [];

  for (const file of files) {
    if (ALLOWLIST.some((re) => re.test(file))) continue;

    if (FORBIDDEN_FILES.some((re) => re.test(file))) {
      problems.push({ file, line: 0, kind: 'forbidden-file', message: 'This file must never be committed.' });
      continue;
    }

    const content = read(file);
    if (!content) continue;

    const lines = content.split('\n');
    lines.forEach((line, index) => {
      for (const rule of RULES) {
        const matches = line.match(rule.re);
        if (!matches) continue;
        for (const match of matches) {
          const masked = mask(match);
          if (rule.skipPlaceholders && PLACEHOLDER.test(match)) continue;
          if (rule.allowExample && PLACEHOLDER.test(match)) continue;
          if (PLACEHOLDER.test(match) && !/^[A-Za-z0-9_\-]{32,}$/.test(match)) continue;
          problems.push({ file, line: index + 1, kind: rule.name, message: `possible ${rule.name}: ${masked}` });
        }
      }
    });
  }

  if (problems.length) {
    console.error('\n\x1b[31m✖ SECRET SCAN FAILED\x1b[0m — commit blocked.\n');
    for (const p of problems) {
      console.error(`  ${p.file}${p.line ? `:${p.line}` : ''}  [${p.kind}]\n      ${p.message}`);
    }
    console.error('\nIf this is a false positive, move the value into an .env file and add it to .gitignore.');
    console.error('Run `node scripts/check-secrets.mjs --all` for a full-repository scan.\n');
    process.exit(1);
  }

  console.log(`✔ secret scan clean (${files.length} file(s) ${scanAll ? 'would be committed' : 'staged'})`);
}

function mask(value) {
  const trimmed = String(value).trim();
  return trimmed.length <= 12 ? '***' : `${trimmed.slice(0, 6)}…${trimmed.slice(-4)} (${trimmed.length} chars)`;
}

main();