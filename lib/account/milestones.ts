/**
 * EatoBiotics — Twin milestone detection (deterministic, no backend).
 *
 * Derives celebration-worthy moments from the FoodSystemDigitalTwin + streak:
 * first meal learned, 10/25 signals, score-band crossings, score gains, streak
 * records. `detectMilestones` is pure; which ones are *new* (unseen) is decided
 * against a seen-set the caller persists (localStorage `eb_milestones_seen`).
 * Copy is in the Twin's first-person voice; celebratory, never medical.
 */

import { getScoreBand } from "@/lib/scoring"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

export interface Milestone {
  /** Stable id — used for the seen-set, so each fires once. */
  id: string
  title: string
  detail: string
}

function mealCount(twin: FoodSystemDigitalTwin): number {
  return twin.observations.filter((o) => o.kind === "meal_description" || o.kind === "meal_photo").length
}

export function detectMilestones(twin: FoodSystemDigitalTwin, streak: number): Milestone[] {
  const out: Milestone[] = []
  const meals = mealCount(twin)
  const delta = twin.progress.scoreDelta

  if (meals >= 1) {
    out.push({
      id: "first-meal",
      title: "I learned from your first meal",
      detail: "Every meal from here teaches me more about your Food System.",
    })
  }
  if (meals >= 10) {
    out.push({
      id: "signals-10",
      title: "10 meals learned",
      detail: "I'm starting to see your patterns — keep them coming.",
    })
  }
  if (meals >= 25) {
    out.push({
      id: "signals-25",
      title: "25 meals learned",
      detail: "I know your Food System well now. This is real momentum.",
    })
  }

  // Score-band crossing (baseline band → current band).
  const baseBand = getScoreBand(twin.baseline.foodSystemScore.value).label
  const nowBand = twin.currentScore.band.label
  if (nowBand !== baseBand && delta > 0) {
    out.push({
      id: `band-${nowBand}`,
      title: `You've reached "${nowBand}"`,
      detail: `Your Food System moved up from "${baseBand}" — I felt it happen.`,
    })
  }

  if (delta >= 10) {
    out.push({
      id: "delta-10",
      title: `+${delta} points since we met`,
      detail: "That's meaningful movement — your meals are doing this.",
    })
  }

  if (streak >= 7) {
    out.push({
      id: "streak-7",
      title: `${streak}-day rhythm`,
      detail: "A full week of signals. Consistency is my favourite food.",
    })
  } else if (streak >= 3) {
    out.push({
      id: "streak-3",
      title: `${streak} days in a row`,
      detail: "A rhythm is forming — I learn fastest this way.",
    })
  }

  return out
}

/** Milestones not yet in the seen-set (order preserved). */
export function unseenMilestones(all: Milestone[], seenIds: string[]): Milestone[] {
  const seen = new Set(seenIds)
  return all.filter((m) => !seen.has(m.id))
}

export const MILESTONES_SEEN_KEY = "eb_milestones_seen"

export function loadSeen(store: { getItem(k: string): string | null } | null): string[] {
  if (!store) return []
  try {
    const raw = store.getItem(MILESTONES_SEEN_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []
  } catch {
    return []
  }
}

export function saveSeen(store: { setItem(k: string, v: string): void } | null, ids: string[]): void {
  if (!store) return
  try {
    store.setItem(MILESTONES_SEEN_KEY, JSON.stringify(ids.slice(-100)))
  } catch {
    /* ignore */
  }
}
