import type { PresentationAccent, PrintBreak } from "@/lib/report/presentation/model"
import { BRAND, type BrandAccent } from "@/lib/pdf/pdf-brand"

/**
 * Print tokens for the canonical Report — Phase 4B-S3A.
 *
 * ══ WHY THE WEB'S COLOUR VALUES CANNOT BE COPIED ACROSS ═════════════════════
 *
 * The web renderer expresses tints as `color-mix(in srgb, …)`, which is a CSS
 * function react-pdf does not evaluate, and — more dangerously — the legacy
 * palette module records that a TRANSLUCENT COLOUR ON A BORDER renders as an
 * unrelated hue: a faint green border came out SALMON, twice, once as hex-alpha
 * and once as the equivalent rgba. Only a solid colour fixed it.
 *
 * So every value this module hands the renderer is a fully opaque hex. The
 * mixing happens HERE, at build time, against a known ground — which is what
 * `color-mix` was doing on the web anyway. The output is the same colour; the
 * difference is that the PDF is told the answer rather than the sum.
 *
 * That defect class is also why `lib/pdf/pdf-brand.ts` says it was "caught by
 * rasterising the pages": the element tree, the tests and a valid `%PDF-`
 * header all looked identical either way. S3A keeps a raster gate for exactly
 * this reason.
 *
 * ══ THE ACCENT INTENT IS OBEYED, NOT REINTERPRETED ══════════════════════════
 *
 * The model names an accent and what it is FOR. The raw hues fail AA as copy on
 * white and the calibrated variants fail on a dark ground, so ground decides
 * the getter here exactly as it does on the web. Print has no contrast checker;
 * unreadable is unreadable on paper too.
 */

/* ══ Solid mixing ═════════════════════════════════════════════════════════ */

function channels(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")
}

/**
 * `percent`% of `colour` over a solid `ground`, as a solid hex.
 *
 * The exact arithmetic `color-mix(in srgb, X p%, GROUND)` performs, done once
 * and handed over as an opaque value. Never returns an alpha channel — that is
 * the whole point.
 */
function mix(colour: string, percent: number, ground: string): string {
  const [r1, g1, b1] = channels(colour)
  const [r2, g2, b2] = channels(ground)
  const p = percent / 100
  const q = 1 - p
  return `#${toHex(r1 * p + r2 * q)}${toHex(g1 * p + g2 * q)}${toHex(b1 * p + b2 * q)}`
}

const WHITE = "#ffffff"
const BLACK = "#000000"

/* ══ Accents ══════════════════════════════════════════════════════════════ */

/** Fills, rules and capsules. Never body copy — these fail AA as text on white. */
export function fill(accent: BrandAccent): string {
  return BRAND[accent]
}

/** AA-safe on white. The calibrated variant, exactly as the web uses it. */
export function textOnWhite(accent: BrandAccent): string {
  return BRAND[`${accent}Text` as const]
}

/**
 * AA-safe on a tinted ground.
 *
 * The `-Text` variants are calibrated on WHITE, so a tint eats the margin.
 * Darkening the same hue keeps the colour coding and restores the ratio — the
 * same 78% mix the web's `accentTextOnTint` performs, resolved to a solid.
 */
export function textOnTint(accent: BrandAccent): string {
  return mix(BRAND[`${accent}Text` as const], 78, BLACK)
}

/** A calm wash of an accent, as a SOLID colour. Backgrounds and rules only. */
export function tint(accent: BrandAccent, percent: number): string {
  return mix(BRAND[accent], percent, WHITE)
}

/**
 * The single place an accent INTENT becomes a value, mirroring the web
 * renderer's one resolver so the two targets cannot diverge on the decision
 * that is a correctness question rather than a styling one.
 */
export function accentColour(accent: PresentationAccent): string {
  return accent.intent === "fill" ? fill(accent.accent) : textOnWhite(accent.accent)
}

/* ══ Pagination ═══════════════════════════════════════════════════════════ */

/**
 * What react-pdf must be told for a given break intent.
 *
 * THE ONLY translation from model intent to pagination in this target. The
 * renderer authors no break of its own — that rule was learned in S2, where a
 * hardcoded keep-together class in JSX produced correct paper while putting a
 * rule into one target's markup that the other could not read. Here the same
 * mistake would be a `break` or `wrap={false}` written inline.
 *
 * `break` forces a new page BEFORE the element; `wrap={false}` refuses to split
 * it across a boundary. `none` sets neither, deliberately returning undefined
 * rather than `false` — `wrap={false}` and "no opinion" are different
 * instructions, and conflating them would silently make every unmarked block
 * unsplittable.
 */
export interface PrintBreakProps {
  readonly break?: true
  readonly wrap?: false
}

export function breakProps(printBreak: PrintBreak): PrintBreakProps {
  switch (printBreak) {
    case "page-before":
      return { break: true }
    case "avoid-inside":
      return { wrap: false }
    case "none":
      return {}
  }
}
