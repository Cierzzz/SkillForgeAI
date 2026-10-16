# Design system

<!-- impeccable:design-schema 1 -->

The Track Board. Enamel and vinyl wayfinding, lit at night.

This file was written from the built system, not before it.

---

## The world

A school corridor wayfinding board, seen at night. Enamel ground, cut-vinyl
lettering that catches overhead light rather than emitting it, a colour-keyed
legend, and one lamp struck forward.

Two rules the system never breaks:

1. **Nothing glows.** Lettering is matte ink. If an element looks lit, it is a
   lamp, and a lamp means *go here*.
2. **The board is flat.** Depth comes from hairlines and one real lift shadow on
   floating things only. There are no floating panels, because a board has none.

---

## Colour

Every colour is mixed in HSL from a single `--sat` multiplier, so the whole
board's ink load scales from one control rather than forty hex values.

| Token | Dark (night) | Light (daylight) | Role |
| --- | --- | --- | --- |
| `--board` | `hsl(203 20% 6%)` | `hsl(42 13% 92%)` | The enamel ground |
| `--board-2` | `hsl(203 17% 9%)` | `hsl(42 20% 97%)` | Inset panel |
| `--key` | `hsl(203 15% 12.5%)` | `hsl(42 16% 99%)` | Raised key face |
| `--rule` | `hsl(203 22% 20%)` | `hsl(42 11% 82%)` | Hairline |
| `--rule-2` | `hsl(203 24% 31%)` | `hsl(42 13% 68%)` | Emphasised hairline |
| `--ink` | `hsl(200 20% 96%)` | `hsl(203 31% 10%)` | Vinyl lettering |
| `--ink-2` | `hsl(203 14% 75%)` | `hsl(203 14% 33%)` | Secondary text |
| `--ink-3` | `hsl(203 12% 56%)` | `hsl(203 11% 42%)` | Tertiary text |
| `--lamp` | `hsl(18 90% 56%)` | `hsl(18 79% 48%)` | **The struck lamp** |
| `--on-lamp` | `hsl(203 40% 7%)` | `hsl(42 36% 99%)` | Text on the lamp |

Legend caps — `--cap-stem`, `--cap-hum`, `--cap-bus`, `--cap-arts` — are the
strand key. Deliberately muted: they are a key, not a call to action.

### The lamp is reserved

`--lamp` is the only saturated colour on the board and it carries exactly one
meaning: *this is struck forward*. It marks the primary action, rank-1 match, and
the active legend/segmented control. Never use it for decoration, never for a
second thing on the same screen.

### Colour strategies not in use

Restrained-with-one-accent is *not* the strategy here; the lamp commits to a
whole region of the landing surface (the destination strip and the primary
action) rather than being scattered. Dark and light are both full scenes, not
inversions of each other.

---

## Saturation

`--sat` ranges `0.55 → 1.5`, default `1`, set by `src/lib/theme.jsx` and
persisted to `localStorage` under `sf.sat`. Light theme defaults to `0.9`,
because heavy ink on paper reads louder than ink on enamel.

It multiplies the saturation channel of **every** colour token, so one slider
governs the palette's whole ink load. Implemented with `hsl(H calc(var(--sat) * N%) L)`.

---

## Type

**Archivo**, self-hosted from `/fonts/` as a variable font with weight
`100–900` and width `62–125`. A grotesque built for signage and high-performance
print. Never a hosted stylesheet.

| Role | Setting |
| --- | --- |
| Board headline | `weight 800`, `wdth 112`, `-0.035em`, `clamp(2.35rem, 7.4vw, 5.25rem)`, `max-width 14ch` |
| Section heading | `weight 700`, `-0.025em`, `clamp(1.6rem, 3.6vw, 2.4rem)` |
| Body | `weight 400`, `1.6` line height, `max-width 68ch`, measure 65–75ch |
| Destination code / label | `--mono`, `0.75rem`, `0.14em`, uppercase |
| Score numeral | `weight 800`, tabular figures |

Display max 6rem. Tracking floor `-0.04em`; display uses `-0.035em`, body `-0.025em`.

Mono is used for codes, scores, and measurement — never as a "technical" costume.

---

## Space and shape

- `--gut: clamp(1.05rem, 3.2vw, 2.25rem)` — one gutter everywhere.
- `--maxw: 1240px`.
- Radii are tight because signage has them: `--r-sm 4px`, `--r 6px`, `--r-lg 10px`.
  Pills (`99px`) are reserved for small controls like `.chip` and scrollbars.
- Section padding `clamp(3.5rem, 9vw, 7rem)`; more space above a heading than below.
- The board's key grid is a visible `88px` hairline field, masked to the top
  70%. It is the board's registration grid, part of the construction.

---

## Components

| Component | Rule |
| --- | --- |
| `.btn` | 44px min-height minimum, `--r` radius, 1px `--rule-2` edge |
| `.btn-primary` | The struck key. `--lamp` ground, `--on-lamp` text. The only loud button. |
| `.input` | `1rem` (16px) minimum — anything smaller makes iOS zoom on focus. 46px tall. |
| `.destination` | One match. Lamp rule on the left, `scaleY(0→1)` on hover/focus, rank-1 struck at rest. |
| `.tab` | Legend strip. Active key gets a `--lamp` underline. |
| `.alert` | Whole panel tinted toward `--alert-hue` with a small square marker. **Never** a thick one-side border. |
| `.segmented-btn` | Two scenes. Active takes `--lamp`. |
| `.sat-range` | The ink-load slider. Square thumb, matching the board's corners. |

### Elevation

Declared once. `--lift` and `--lift-hi` are a hairline **plus** a real offset
and blur, used only on floating surfaces (toasts, mobile nav). Cards get a 1px
hairline and nothing else — a hairline under a wide shadow is a ghost card.

---

## Motion

One authored moment: **the lamp strikes forward.**

- `260ms cubic-bezier(0.16, 1, 0.3, 1)` — exponential ease-out.
- The lamp is a hard opacity/scale step, not a fade. The old glow decays over
  one beat as the new one strikes.
- Only three other motions exist: nav-link underline `scaleX`, skeleton sweep,
  and the spinner. Nothing else moves.

All motion collapses under `prefers-reduced-motion: reduce`.

Motion never gates content: every animated element is visible at its final
state by default.

---

## Theme

`data-theme="dark" | "light"` on `<html>`. Default follows the OS
`prefers-color-scheme`, then persists to `localStorage` under `sf.theme`.
`ThemeProvider` also keeps `<meta name="theme-color">` in step.

---

## Accessibility

WCAG 2.1 AA or better is a requirement.

- Body and secondary text meet 4.5:1 in both scenes; large text meets 3:1.
- Every interactive target is at least 44px.
- Focus is a 2px `--lamp` ring with 2px offset — never removed, never subtle.
- Inputs are 16px minimum so iOS does not zoom.
- `prefers-reduced-motion` is honoured globally.
- Mobile-first: single column at 360px, two at 640, three at 1024.
- The destination strip is a semantic `article` list, not a set of divs.
- Status colours are never the only signal — each alert also carries a marker
  and prose.

---

## Side game — Strand Sort

A deliberate exception, recorded so a later pass does not either "fix" it into a
security control or strip it as decoration.

`src/components/StrandGame.jsx`, shown on Login and Register.

**It is not a captcha.** The anti-bot gate stays server-side — the built-in
challenge, or Cloudflare Turnstile when `CAPTCHA_PROVIDER=turnstile`. The game
has no security role and never gates submission. It exists because a sign-in box
is the loneliest screen in a product.

Content is the product's own subject matter: real Philippine SHS subjects
matched to their real strands. The play is genuine reference content, not a
gimmick, and it teaches the user what the product's catalogue contains.

Accessibility, because this audience is largely on phones and WCAG AA is binding:

- **No timer anywhere.** There is no way to lose to the clock.
- Every strand is a real `<button>`, 46px, reachable by Tab, fired by Enter/Space.
- Number keys `1`–`4` are an *enhancement* layered on top, and are suppressed
  while the visitor is typing in a field.
- On answering, focus moves to **Next subject**, so Enter advances through native
  button behaviour. Nothing is hijacked.
- Results are announced via `aria-live`, and never signalled by colour alone —
  the wrong key says which strand was correct, in words.
- Correct/wrong uses `--ok` / `--bad` with the label changing too.
- Honours `prefers-reduced-motion`.

It reads in the board's vocabulary because it is built from keys: answering
strikes a lamp, which is the board's existing word for *this one*.

---

## Refused, deliberately

Recorded so a later pass does not reintroduce them:

- **No neon glow.** This is the category default and the previous world.
- **No gradient text**, no glass as decoration, no emoji or unicode icons.
- **No kicker/eyebrow above a heading.** The heading carries its own weight.
- **No section numbers.** The destination codes are data, not decoration.
- **No same-size icon+heading+text card grid** as the page structure.
- **No thick one-side border** on cards, alerts, or list items.
- **No hard offset block shadows.**
- **No progress rings** standing in for a score — the score is a numeral and a
  meter, because it is a real measurement.
- **No rounded blobs.** Radii stay 4–10px.