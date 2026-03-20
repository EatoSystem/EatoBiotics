/* ── Mission Messaging — Central Copy Config ─────────────────────────── */
// Single source of truth for the EatoBiotics / EatoSystem mission layer.
// Update copy here and it propagates across all assessment and report pages.

export const MISSION = {
  /** Primary headline — used in bridge and quote variants */
  headline: "Build the food system inside you — and help build the food system around you.",

  /** Supporting line — used in bridge variant */
  support:
    "Every EatoBiotics report helps fund the wider EatoSystem mission: developing healthier food systems for people, communities, and the environment.",

  /** Compact one-liner — used in inline variant */
  shortLine: "Your purchase supports the wider EatoSystem mission.",

  /** Intro context — used in quote variant on assessment intro */
  intro:
    "EatoBiotics is built around two connected ideas: improving the food system inside you, and helping build better food systems beyond the individual.",
} as const
