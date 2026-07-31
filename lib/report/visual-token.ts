/**
 * Report visual tokens — the replacement for food emoji.
 *
 * Reports used to carry an `emoji` string per food. That made every report read
 * as a colourful checklist rather than an explanation of the reader's Food
 * System, and it baked emoji into the Claude response contract, so redesigning
 * the UI alone would not have fixed it.
 *
 * A token carries meaning instead of decoration: which biotic pathway a food
 * belongs to, and a lucide icon to render it with. The pathway is the part that
 * matters — it lets a food card say "this is prebiotic fuel" rather than "🌿".
 *
 * ── Colour safety ────────────────────────────────────────────────────────────
 *
 * `accent` names a brand hue, and the two getters below are NOT interchangeable.
 * The raw --icon-* hues measure 1.55:1 (lime) to 2.96:1 (teal) on white and fail
 * WCAG AA as copy — see the comment block in app/globals.css and PRs #184/#187.
 *
 *   accentFill(accent)  → raw hue. Fills, rings, capsule backgrounds, gradients.
 *   accentText(accent)  → the calibrated -text variant. Anything readable.
 *
 * Deliberately kept small. The fuller report model (educational modules, body
 * zones, family rhythms) lands with the shared report schema; this is the subset
 * needed to delete emoji from the live surfaces, shaped so that schema can
 * absorb it rather than replace it.
 */

export type BioticKey = "prebiotics" | "probiotics" | "postbiotics" | "synbiotic"

/** Legacy pillar keys. The KEY is load-bearing — see feed-seed-heal.tsx. */
export type PillarAlias = "feed" | "seed" | "heal"

export type VisualAccent = "lime" | "green" | "teal" | "yellow" | "orange"

export interface ReportVisualToken {
  accent: VisualAccent
  /** A lucide-react export name, e.g. "Wheat". Verified against lucide 0.454. */
  iconName: string
}

/* ── Pathway → accent ────────────────────────────────────────────────────── */

const BIOTIC_ACCENT: Record<BioticKey, VisualAccent> = {
  prebiotics: "lime",
  probiotics: "teal",
  postbiotics: "orange",
  synbiotic: "green",
}

const PILLAR_TO_BIOTIC: Record<PillarAlias, BioticKey> = {
  feed: "prebiotics",
  seed: "probiotics",
  heal: "postbiotics",
}

const BIOTIC_LABEL: Record<BioticKey, string> = {
  prebiotics: "Prebiotic",
  probiotics: "Probiotic",
  postbiotics: "Postbiotic",
  synbiotic: "Synbiotic",
}

export function bioticFromPillar(pillar: PillarAlias): BioticKey {
  return PILLAR_TO_BIOTIC[pillar]
}

export function bioticAccent(biotic: BioticKey): VisualAccent {
  return BIOTIC_ACCENT[biotic]
}

export function bioticLabel(biotic: BioticKey): string {
  return BIOTIC_LABEL[biotic]
}

/* ── Accent → CSS ────────────────────────────────────────────────────────── */

/** Fills, rings, capsule backgrounds, gradients. Never readable text. */
export function accentFill(accent: VisualAccent): string {
  return `var(--icon-${accent})`
}

/** AA-safe on white. Use for any text the reader has to read. */
export function accentText(accent: VisualAccent): string {
  return `var(--icon-${accent}-text)`
}

/**
 * Icon for a pathway itself (as opposed to a food on that pathway).
 * Used by the 3-Biotics explainer cards and the supplement cards.
 */
const PATHWAY_ICON: Record<BioticKey, string> = {
  prebiotics: "Sprout",
  probiotics: "Amphora",
  postbiotics: "FlaskConical",
  synbiotic: "Sparkles",
}

export function pathwayIcon(biotic: BioticKey): string {
  return PATHWAY_ICON[biotic]
}

/* ── Food → icon ─────────────────────────────────────────────────────────── */

/**
 * Matched on substrings so "Oats (rolled or steel-cut)" and "Oats" both resolve.
 * Order matters: the first hit wins, so put specific terms above generic ones.
 */
const FOOD_ICON: Array<[RegExp, string]> = [
  [/kefir|yoghurt|yogurt|milk|lassi/i, "Milk"],
  [/kimchi|sauerkraut|cabbage|pickle/i, "Salad"],
  [/miso|tempeh|natto|kombucha|ferment/i, "Amphora"],
  [/oat|rye|barley|wheat|grain|bread|flax|seed|quinoa|rice/i, "Wheat"],
  [/bean|lentil|pulse|chickpea|dal|legume/i, "Bean"],
  [/leek|onion|garlic|shallot|scallion/i, "Sprout"],
  [/broccoli|kale|spinach|watercress|greens|leaf|herb|rocket|salad/i, "Leaf"],
  [/carrot|parsnip|beet|radish|turnip|artichoke|potato|squash|pumpkin/i, "Carrot"],
  [/apple|pear|banana|berry|berries|cherry|grape|kiwi|fruit/i, "Apple"],
  [/orange|lemon|lime|citrus|grapefruit/i, "Citrus"],
  [/walnut|almond|nut|pistachio|cashew/i, "Nut"],
  [/salmon|fish|sardine|mackerel|tuna/i, "Fish"],
  [/egg/i, "Egg"],
  [/ginger|turmeric|chilli|chili|pepper|spice|fennel/i, "Flame"],
  [/chocolate|cocoa/i, "Cookie"],
  [/soup|stew|broth|dal/i, "Soup"],
  [/water|tea|coffee|drink/i, "Droplet"],
  [/olive|avocado|oil|fat/i, "Droplet"],
]

/** Falls back to a neutral plate icon rather than guessing wrong. */
export function foodIcon(food: string): string {
  for (const [pattern, icon] of FOOD_ICON) if (pattern.test(food)) return icon
  return "Utensils"
}

/* ── The one call sites use ──────────────────────────────────────────────── */

export function foodVisualToken(
  food: string,
  biotic: BioticKey | PillarAlias,
): ReportVisualToken {
  const key: BioticKey =
    biotic === "feed" || biotic === "seed" || biotic === "heal"
      ? bioticFromPillar(biotic)
      : biotic
  return { accent: bioticAccent(key), iconName: foodIcon(food) }
}

/**
 * Maps lib/foods.ts's singular `BioticType` onto a pathway.
 *
 * That food database is shared with the food directory, /today, myplate and the
 * condition pages, so it keeps its own vocabulary (and its emoji, which those
 * non-report surfaces still use). This adapter lets report surfaces render from
 * it without changing it.
 */
export function bioticFromFoodType(
  type: "prebiotic" | "probiotic" | "postbiotic" | "protein" | "all",
): BioticKey {
  if (type === "probiotic") return "probiotics"
  if (type === "postbiotic") return "postbiotics"
  if (type === "all") return "synbiotic"
  // "protein" has no pathway of its own; it reads as system-supporting input.
  return "prebiotics"
}

/** Narrows an arbitrary string (e.g. Claude output) to a BioticKey. */
export function coerceBiotic(value: unknown): BioticKey {
  return value === "prebiotics" || value === "probiotics" || value === "postbiotics" || value === "synbiotic"
    ? value
    : "prebiotics"
}
