/**
 * The SkillForge AI brandmark, inlined so it inherits the board's tokens.
 *
 * This must NOT be an <img src="/brandmark.svg">. An SVG loaded through <img>
 * is rendered in an isolated document: CSS custom properties do not cross that
 * boundary, so every var() falls back and the mark renders empty (a broken
 * image). Inlining puts the SVG in the same document as the page, so it reads
 * --ink / --lamp / --ink-2 live and follows the scene and the ink slider.
 *
 * The flat, token-free version still ships as /brandmark.svg for the favicon,
 * which is painted outside the page and has no access to custom properties.
 *
 * The mark is an anvil: two struck plates under a hovering node. The node is
 * the lamp - the only signal colour on the board - because it is the one part
 * that is "struck forward". The plates are vinyl.
 */
export default function Brandmark({ size = 30, className = 'brand-mark', title }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 300 300"
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      {/* Vinyl plates. The lower one recedes, the way shadowed enamel does. */}
      <path d="M50 175 L150 235 L250 175 L250 195 L150 255 L50 195 Z" fill="var(--ink)" />
      <path d="M50 212 L150 272 L250 212 L250 232 L150 292 L50 232 Z" fill="var(--ink)" opacity="0.45" />

      {/* Alignment stem: ink above the lamp, lamp below it. */}
      <path d="M150 66 L150 100" stroke="var(--ink-2)" strokeWidth="6" />
      <path d="M150 196 L150 226" stroke="var(--lamp)" strokeWidth="6" />

      {/* The struck node. */}
      <path
        d="M150 26 L208 100 L150 174 L92 100 Z"
        fill="none"
        stroke="var(--lamp)"
        strokeWidth="11"
        strokeLinejoin="miter"
      />
      <rect x="139" y="89" width="22" height="22" fill="var(--lamp)" transform="rotate(45 150 100)" />
    </svg>
  );
}