// lib/pdf/pdf-brand.ts
// The PDF palette. One source, so a single document cannot mix two greens.

/**
 * These are the real brand hues from `app/globals.css` (`--icon-*`), not the
 * drifted approximations the paid renderer had been carrying — it used `#7fc47e`
 * where the brand is `#A8E063`, `#4caf7d` for `#4CB648`, and so on. With the
 * educational Food System pages added to the same document, keeping the old
 * values would have put two different greens on facing pages.
 *
 * `*Text` are the AA-calibrated variants. Print has no contrast checker, but the
 * raw hues measure 1.55:1–2.96:1 on white and are just as unreadable on paper as
 * they were on screen (#184 / #187). Fills and bars use the raw hue; anything
 * the reader reads uses the -Text variant.
 */
export const BRAND = {
  lime: "#A8E063",
  green: "#4CB648",
  teal: "#2DAA6E",
  yellow: "#F5C518",
  orange: "#F5A623",

  limeText: "#587C36",
  greenText: "#398133",
  tealText: "#278150",
  yellowText: "#7D7215",
  orangeText: "#8C6C1B",

  white: "#ffffff",
  offWhite: "#f9f9f9",
  lightGrey: "#eeeeee",
  mutedGrey: "#999999",
  bodyText: "#444444",
  darkText: "#222222",
  subText: "#666666",
} as const

export type BrandAccent = "lime" | "green" | "teal" | "yellow" | "orange"

/** Fills, bars, rings. Never body copy. */
export function accentFill(accent: BrandAccent): string {
  return BRAND[accent]
}

/** Readable on white. Use for any text. */
export function accentText(accent: BrandAccent): string {
  return BRAND[`${accent}Text` as const]
}

/**
 * A translucent brand tint, as `rgba()` — for BACKGROUNDS ONLY.
 *
 * **Never use a translucent colour on a border.** react-pdf renders it as an
 * unrelated hue: the priority-lever card's faint green border came out salmon,
 * first with `${BRAND.green}40` and again with the equivalent rgba(). Only a
 * solid colour fixed it. Backgrounds honour alpha correctly.
 *
 * Both attempts were caught by rasterising the pages with pdftoppm. The element
 * tree, the tests, and a valid %PDF- header all looked identical either way —
 * this class of defect is invisible to everything except looking at the page.
 */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
