/**
 * Shared design tokens for the mobile-app concept mockups (/app-preview + /app-*).
 * LIGHT theme — mirrors the REAL iOS app's kickoff design spec (relayed by the
 * EatoBiotics-App session): light background, forest-green primary, apricot for
 * the streak chip only, white cards. The per-check + biotic colours are the
 * app's real accent palette. Concept-only; nothing here touches production.
 *
 * Fonts approximate the app's Fraunces (display) + Inter (UI) with graceful
 * fallbacks — exact font loading is a tracked fidelity item, not done here.
 */

export const APP = {
  /** App screen background. */
  bg: "#F2F5EE",
  /** Primary text. */
  ink: "#1B2A20",
  inkDim: "rgba(27,42,32,0.62)",
  inkFaint: "rgba(27,42,32,0.4)",
  /** Forest-green primary (buttons, active states, scores). */
  green: "#2E5B3F",
  /** Apricot accent — STREAK CHIP ONLY per the app spec. */
  apricot: "#E8A055",
  card: "#FFFFFF",
  border: "#E4E9E2",
  /** Subtle fill for inactive tiles. */
  fill: "#EAEEE4",
  display: "'Fraunces', 'Lora', Georgia, serif",
  ui: "'Inter', system-ui, -apple-system, sans-serif",
} as const

/** The five daily-ritual checks — keys, labels and colours match the real app
    (fermented #2DAA6E, plants #A8E063, moved #4CB648, slept #F5C518,
    feeling #F5A623). In the app these colour the culture-ring segments + check
    dots.

    ⚠️ DO NOT SIMPLIFY AWAY the `node` coordinates. They look unused when the
    culture ring is the default centrepiece, but they are the anchor for the
    ALTERNATE living-figure visualisation, which the D2 ruling deliberately
    kept switchable (see TodayShowcase's ring/figure toggle). Deleting them as
    "dead data" would quietly foreclose that choice. Mirrors the same guard on
    the app side (lib/ritual/checks.ts). */
export const RITUAL_CHECKS = [
  { key: "fermented", label: "Fermented food", short: "Fermented", color: "#2DAA6E", node: { x: 54, y: 56 } },
  { key: "plants", label: "5+ plants", short: "5+ plants", color: "#A8E063", node: { x: 47, y: 62 } },
  { key: "moved", label: "Moved today", short: "Moved", color: "#4CB648", node: { x: 48, y: 46 } },
  { key: "slept", label: "Slept well", short: "Slept well", color: "#F5C518", node: { x: 48, y: 30 } },
  { key: "feeling", label: "Feeling good", short: "Feeling", color: "#F5A623", node: { x: 50, y: 20 } },
] as const

export const BIOTICS = [
  { label: "Prebiotics", color: "#A8E063" },
  { label: "Probiotics", color: "#2DAA6E" },
  { label: "Postbiotics", color: "#F5C518" },
] as const

/**
 * The mocked screens (drives the landing gallery + per-screen pages).
 * Reconciled to the REAL app: there is no separate Home — the home IS the
 * Today/ritual screen — and onboarding exists. So: Onboarding, Today, Meal,
 * Progress. (/app-ritual redirects to /app-home, the Today screen.)
 */
export const SCREENS = [
  { slug: "app-onboarding", name: "Sign in", tagline: "One account, everywhere", blurb: "Native email + password, on the same EatoBiotics system as the website — sign in or create your account and your food-system history follows you." },
  { slug: "app-home", name: "Today", tagline: "Five taps, one living day", blurb: "The home screen IS the ritual: your culture ring fills as you check off fermented, plants, movement, sleep and mood — today's score and streak right there." },
  { slug: "app-meal", name: "Meal", tagline: "Snap it, see it", blurb: "Photograph or describe a meal and watch the Biotics score count up — three pillars, one honest insight, or an honest 'couldn't read that' when the photo won't scan." },
  { slug: "app-scores", name: "Progress", tagline: "Watch it climb", blurb: "Your score over time, your streak, your weekly shape — proof the small daily things compound into a healthier gut." },
] as const

export type ScreenSlug = (typeof SCREENS)[number]["slug"]

/** Which centrepiece the Today screen shows. Per the human's D2 ruling both
    the app's real culture ring and the concept's living figure are supported,
    switchable, so the two can be compared before one is locked in. */
export type TodayViz = "ring" | "figure"
