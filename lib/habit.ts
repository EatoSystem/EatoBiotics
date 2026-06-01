/* ── Habit loop: focus & nudge selection ──────────────────────────────────
   Turns a user's pillar scores into the single most useful next action, read
   from the Food System Core. This is the "nudge" half of the daily loop
   (scan → score → nudge → streak). Pure and deterministic.
──────────────────────────────────────────────────────────────────────────── */

import { PILLARS, PILLAR_ORDER, type Pillar, type PillarKey } from "@/lib/pillars"

export interface PillarScores {
  prebiotics: number
  probiotics: number
  postbiotics: number
}

/**
 * The weakest pillar — the one with the most room to improve. Ties resolve to
 * canonical order (prebiotics → probiotics → postbiotics) for determinism.
 */
export function focusPillar(scores: PillarScores): PillarKey {
  return PILLAR_ORDER.reduce(
    (weakest, key) => (scores[key] < scores[weakest] ? key : weakest),
    PILLAR_ORDER[0],
  )
}

export interface DailyNudge {
  /** The pillar this nudge targets. */
  pillar: Pillar
  /** The single suggested action, from the Food System Core. */
  nudge: string
  /** The user's current score for that pillar. */
  score: number
}

/** Picks the daily nudge for the weakest pillar. */
export function dailyNudge(scores: PillarScores): DailyNudge {
  const key = focusPillar(scores)
  return { pillar: PILLARS[key], nudge: PILLARS[key].nudge, score: scores[key] }
}
