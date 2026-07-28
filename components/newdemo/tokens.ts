/**
 * AA-safe text colours for /newdemo, derived from the existing brand tokens.
 *
 * The brief requires every essential piece of copy at 4.5:1 and notes this
 * "corrects a known issue in the current shared chrome". Measured on white,
 * the raw brand colours fail badly as text:
 *
 *   --icon-lime   #A8E063  1.55:1
 *   --icon-yellow #F5C518  1.63:1
 *   --icon-orange #F5A623  2.03:1
 *   --icon-green  #4CB648  2.60:1   ← the most-used, on every eyebrow and link
 *   --icon-teal   #2DAA6E  2.96:1
 *
 * No new colours are introduced. Each value is the existing hue mixed with
 * --foreground (#1A2E12) — the same `color-mix` idiom the design system already
 * uses for its tint pills — at the lowest percentage that clears the
 * threshold with margin (3.25:1 / 4.8:1 measured), so the hue shifts as little
 * as possible while leaving room for antialiasing and future copy changes.
 *
 * `text` is for body copy, labels, links and captions (4.5:1).
 * `display` is for large text only — 24px+, or 18.66px+ bold (3:1). At those
 * sizes it stays visually almost identical to the raw brand colour.
 *
 * Backgrounds, gradients, borders, icons and rules keep the raw tokens: the
 * contrast requirement applies to text, and changing them would alter the
 * visual language the brief says to preserve.
 */
const mix = (token: string, pct: number) =>
  `color-mix(in srgb, var(${token}) ${pct}%, var(--foreground))`

/** ≥ 4.5:1 on white — body copy, labels, links, captions. */
export const text = {
  lime: mix("--icon-lime", 44),
  green: mix("--icon-green", 61),
  teal: mix("--icon-teal", 67),
  yellow: mix("--icon-yellow", 45),
  orange: mix("--icon-orange", 52),
} as const

/** ≥ 3:1 on white — large text only (24px+, or 18.66px+ bold). */
export const display = {
  lime: mix("--icon-lime", 61),
  green: mix("--icon-green", 84),
  teal: mix("--icon-teal", 93),
  yellow: mix("--icon-yellow", 63),
  orange: mix("--icon-orange", 72),
} as const

/* Literal equivalents, for the Digital Twin copy which is styled with inline
   hex rather than CSS variables. Same mixes, pre-computed. */
export const hexText = {
  green: "#3A8535",
  teal: "#278653",
  yellow: "#837615",
  orange: "#95711C",
} as const

export const hexDisplay = {
  green: "#47A843",
  orange: "#C38A1F",
} as const
