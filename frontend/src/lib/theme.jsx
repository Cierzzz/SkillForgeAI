import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'sf.theme';
const SAT_KEY = 'sf.sat';
const ROOT = document.documentElement;

/** The board's scene decides its ground: lit at night, or daylight. */
const SCENES = [
  { id: 'dark', label: 'Night board', hint: 'Lit enamel, default' },
  { id: 'light', label: 'Daylight', hint: 'Pale enamel, ink on paper' },
];

const SAT_RANGE = { min: 0.55, max: 1.5, step: 0.05, neutral: 1 };

const ThemeContext = createContext(null);

function readScene() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch { /* private mode */ }
  // No stored choice: honour the OS, which is the visitor's own stated scene.
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function readSat() {
  try {
    const raw = Number(localStorage.getItem(SAT_KEY));
    if (Number.isFinite(raw) && raw >= SAT_RANGE.min && raw <= SAT_RANGE.max) return raw;
  } catch { /* private mode */ }
  return SAT_RANGE.neutral;
}

export function ThemeProvider({ children }) {
  const [scene, setScene] = useState(readScene);
  const [sat, setSatState] = useState(readSat);

  useEffect(() => {
    ROOT.setAttribute('data-theme', scene);
    // Keep the browser's own chrome in step with the board.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', scene === 'light' ? '#efe9e0' : '#0c1216');
  }, [scene]);

  useEffect(() => {
    // One number governs the whole palette: every colour is mixed in HSL from
    // the same --sat, so this scales the board's ink load, not one swatch.
    ROOT.style.setProperty('--sat', String(sat));
  }, [sat]);

  const setScenePersist = useCallback((next) => {
    setScene(next);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  }, []);

  const setSat = useCallback((next) => {
    const clamped = Math.min(SAT_RANGE.max, Math.max(SAT_RANGE.min, Number(next.toFixed(2))));
    setSatState(clamped);
    try { localStorage.setItem(SAT_KEY, String(clamped)); } catch { /* ignore */ }
  }, []);

  const value = useMemo(
    () => ({ scene, setScene: setScenePersist, sat, setSat, scenes: SCENES, range: SAT_RANGE }),
    [scene, sat, setScenePersist, setSat],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/**
 * Board settings: scene and ink load. Rendered in the topbar, and it is the
 * only place in the product that offers a preference - the rest of the board
 * keeps its hands off the visitor's choices.
 */
export function BoardControls({ compact = false }) {
  const { scene, setScene, sat, setSat, scenes, range } = useTheme();

  return (
    <div className={`board-controls${compact ? ' is-compact' : ''}`}>
      <div className="segmented" role="group" aria-label="Colour scheme">
        {scenes.map((s) => (
          <button
            key={s.id}
            type="button"
            className="segmented-btn"
            aria-pressed={scene === s.id}
            title={s.hint}
            onClick={() => setScene(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <label className="sat-control">
        <span className="sr-only">Colour intensity</span>
        <span className="sat-label" aria-hidden="true">Ink</span>
        <input
          className="sat-range"
          type="range"
          min={range.min}
          max={range.max}
          step={range.step}
          value={sat}
          onChange={(e) => setSat(Number(e.target.value))}
          aria-valuetext={`${Math.round(((sat - range.min) / (range.max - range.min)) * 100)} per cent colour`}
        />
      </label>
    </div>
  );
}