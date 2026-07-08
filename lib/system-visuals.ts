import { SYSTEMS, type SystemKey, type SystemFamily, type SystemStatus } from "@/lib/systems"

/**
 * lib/system-visuals.ts — the single visual-token source for every system
 * card, badge, and nav entry across the site. Pairs with the content catalog
 * in lib/systems.ts (which stays the source of truth for the raw accent/
 * gradient CSS values) and adds the Tailwind-class side of the system: complete,
 * literal class strings only — never `border-${accent}-500`-style interpolation,
 * since Tailwind can't reliably discover a dynamically-built class name at
 * build time. Every string below is copy-pasteable and already present in the
 * compiled CSS (registered via the `--color-icon-*` tokens in app/globals.css).
 *
 * Colour logic (see the family comments in lib/systems.ts for the full brief):
 *   - Foundation (You, Family): one shared identity — green, with a soft lime glow.
 *     They're the starting point; nothing should visually outrank them.
 *   - Health: a connected green → gold → orange spectrum, not six unrelated hues.
 *     Stability/Mind/Recovery/Longevity all start from a green tone and diverge
 *     toward teal (steady/deep) or yellow (gold) — the greener/lighter the start,
 *     the "softer" the system; the deeper the start (teal), the more "mature".
 *     Glucose/Performance sit at the gold→orange end (amber vs. gold framing).
 *   - Life (Pregnancy, Birth, Baby): the same warm green/gold/amber tones as
 *     Health, but softer — lower-opacity borders and glows, no teal (teal reads
 *     as a "deep/mature" Health marker, not a Life one) — so the family reads as
 *     one gentle group with three individual accents (lime / yellow / green).
 */

export interface SystemVisuals {
  family: SystemFamily
  /** Raw CSS value (var(--icon-*)) — for inline style `color`/`borderColor`. */
  accent: string
  /** Human label for the accent, e.g. "green" — for copy/QA, not styling. */
  accentName: string
  /** Raw CSS linear-gradient string — for inline style `background` on badges/bars. */
  gradient: string
  /** Literal Tailwind border-color class. */
  borderClass: string
  /** Literal Tailwind text-color class, for icons. */
  iconClass: string
  /** Literal Tailwind bg-color class — flat badge/dot fallback (gradient is used for icon badges). */
  badgeClass: string
  /** Literal Tailwind hover:text-color class. */
  hoverClass: string
  /** Literal Tailwind ring-color class. */
  ringClass: string
  /** Literal Tailwind bg-color/opacity class — soft ambient wash behind a card/hero. */
  glowClass: string
}

interface VisualTokens {
  accentName: string
  borderClass: string
  iconClass: string
  badgeClass: string
  hoverClass: string
  ringClass: string
  glowClass: string
}

/** Foundation — one shared green identity for both You and Family. */
const FOUNDATION_TOKENS: VisualTokens = {
  accentName: "green",
  borderClass: "border-icon-green",
  iconClass: "text-icon-green",
  badgeClass: "bg-icon-green",
  hoverClass: "hover:text-icon-green",
  ringClass: "ring-icon-green",
  glowClass: "bg-icon-lime/10",
}

/** Health — a connected green → gold → orange spectrum, six distinct pairings. */
const HEALTH_TOKENS: Record<"stability" | "glucose" | "mind" | "performance" | "recovery" | "longevity", VisualTokens> = {
  // Steady/deep: starts at the primary green, deepens toward teal.
  stability: {
    accentName: "green",
    borderClass: "border-icon-green",
    iconClass: "text-icon-green",
    badgeClass: "bg-icon-green",
    hoverClass: "hover:text-icon-teal",
    ringClass: "ring-icon-green",
    glowClass: "bg-icon-teal/10",
  },
  // Amber/orange.
  glucose: {
    accentName: "orange",
    borderClass: "border-icon-orange",
    iconClass: "text-icon-orange",
    badgeClass: "bg-icon-orange",
    hoverClass: "hover:text-icon-orange",
    ringClass: "ring-icon-orange",
    glowClass: "bg-icon-orange/10",
  },
  // Green-gold: fresh, clear — green branching toward yellow.
  mind: {
    accentName: "green",
    borderClass: "border-icon-green",
    iconClass: "text-icon-green",
    badgeClass: "bg-icon-green",
    hoverClass: "hover:text-icon-yellow",
    ringClass: "ring-icon-green",
    glowClass: "bg-icon-yellow/10",
  },
  // Gold/orange.
  performance: {
    accentName: "yellow",
    borderClass: "border-icon-yellow",
    iconClass: "text-icon-yellow",
    badgeClass: "bg-icon-yellow",
    hoverClass: "hover:text-icon-orange",
    ringClass: "ring-icon-yellow",
    glowClass: "bg-icon-yellow/10",
  },
  // Soft green-gold: lime (the softest green) branching toward yellow.
  recovery: {
    accentName: "lime",
    borderClass: "border-icon-lime",
    iconClass: "text-icon-lime",
    badgeClass: "bg-icon-lime",
    hoverClass: "hover:text-icon-yellow",
    ringClass: "ring-icon-lime",
    glowClass: "bg-icon-yellow/10",
  },
  // Mature/deep green-gold: teal (the deepest green) branching toward yellow.
  longevity: {
    accentName: "teal",
    borderClass: "border-icon-teal",
    iconClass: "text-icon-teal",
    badgeClass: "bg-icon-teal",
    hoverClass: "hover:text-icon-yellow",
    ringClass: "ring-icon-teal",
    glowClass: "bg-icon-yellow/10",
  },
}

/** Life — the same warm tones as Health, softer: lower-opacity border/glow, no teal. */
const LIFE_TOKENS: Record<"pregnancy" | "birth" | "baby", VisualTokens> = {
  pregnancy: {
    accentName: "lime",
    borderClass: "border-icon-lime/50",
    iconClass: "text-icon-lime",
    badgeClass: "bg-icon-lime",
    hoverClass: "hover:text-icon-green",
    ringClass: "ring-icon-lime",
    glowClass: "bg-icon-lime/8",
  },
  birth: {
    accentName: "yellow",
    borderClass: "border-icon-yellow/50",
    iconClass: "text-icon-yellow",
    badgeClass: "bg-icon-yellow",
    hoverClass: "hover:text-icon-orange",
    ringClass: "ring-icon-yellow",
    glowClass: "bg-icon-yellow/8",
  },
  baby: {
    accentName: "green",
    borderClass: "border-icon-green/50",
    iconClass: "text-icon-green",
    badgeClass: "bg-icon-green",
    hoverClass: "hover:text-icon-lime",
    ringClass: "ring-icon-green",
    glowClass: "bg-icon-green/8",
  },
}

function tokensFor(key: SystemKey, family: SystemFamily): VisualTokens {
  if (family === "foundation") return FOUNDATION_TOKENS
  if (family === "health") return HEALTH_TOKENS[key as keyof typeof HEALTH_TOKENS]
  return LIFE_TOKENS[key as keyof typeof LIFE_TOKENS]
}

/**
 * The full visual token bundle for one system. `accent`/`gradient` are read
 * straight from the lib/systems.ts catalog (the single source of raw CSS
 * values); everything else is the literal-Tailwind-class layer defined above.
 */
export function getSystemVisuals(key: SystemKey): SystemVisuals {
  const system = SYSTEMS[key]
  const tokens = tokensFor(key, system.family)
  return {
    family: system.family,
    accent: system.accent,
    gradient: system.gradient,
    ...tokens,
  }
}

/** Shared "Coming soon" treatment for any non-live system, independent of family. */
export function getStatusClass(status: SystemStatus): string {
  return status === "live" ? "" : "text-muted-foreground"
}
