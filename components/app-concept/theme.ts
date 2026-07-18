/**
 * Shared design tokens for the mobile-app concept mockups (/app + /app-*).
 * Mirror the real companion app's dark "stage" language — the same palette
 * used by components/account/twin/* and lib/account/ritual.ts — so these
 * mockups read as the actual product, not an invention. Concept-only:
 * nothing here is imported by production surfaces.
 */

export const APP = {
  /** The dark stage the living Food System sits on. */
  bg: "linear-gradient(175deg, #10200A 0%, #0B1607 70%)",
  /** The five-stop biotic hairline that tops every real app surface. */
  hairline: "linear-gradient(90deg, #A8E063, #4CB648, #2DAA6E, #F5C518, #F5A623)",
  cream: "#FDFBF7",
  lime: "#A8E063",
  green: "#4CB648",
  teal: "#2DAA6E",
  yellow: "#F5C518",
  orange: "#F5A623",
  /** Translucent creams used for text/among the dark. */
  ink: "rgba(253,251,247,0.92)",
  inkDim: "rgba(253,251,247,0.6)",
  inkFaint: "rgba(253,251,247,0.35)",
  line: "rgba(253,251,247,0.14)",
  fill: "rgba(253,251,247,0.06)",
} as const

/** The five daily-ritual checks — keys, labels, colours and body-node
    positions all match lib/account/ritual.ts's RITUAL_CHECKS. */
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

/** The four mocked screens — drives the landing gallery + per-screen pages. */
export const SCREENS = [
  { slug: "app-home", name: "Home", tagline: "Your living Food System", blurb: "Open the app to a body that's alive with everything you've fed it — today's score, this week's rhythm, one tap from the next meal." },
  { slug: "app-ritual", name: "Daily Ritual", tagline: "Five taps, one minute", blurb: "Fermented, plants, movement, sleep, mood. Each tap lights up where it lands inside you — the habit loop that keeps the Twin awake." },
  { slug: "app-meal", name: "Meal", tagline: "Snap it, see it", blurb: "Photograph or describe a meal and watch the Biotics score count up — three pillars, one honest insight, the Twin learning in real time." },
  { slug: "app-scores", name: "Progress", tagline: "Watch it climb", blurb: "Your score over time, your streak, your weekly shape — proof the small daily things are compounding into a healthier gut." },
] as const

export type ScreenSlug = (typeof SCREENS)[number]["slug"]
