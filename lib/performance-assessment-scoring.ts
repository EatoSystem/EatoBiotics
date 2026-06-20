/**
 * Performance add-on — pure SCORING + recommendation logic (no React).
 *
 * Pillar scores depend ONLY on the 12 scored answers. The optional `context`
 * (sport / goal / level / …) tailors `nextActions`/recommendations but MUST
 * NEVER change any numeric score — this is enforced by tests.
 *
 * The result shape is a SUPERSET of the original inline `SportsResult` so the
 * client and the assessment registry keep reading `subScores` / `overall` /
 * `profile` exactly as before.
 */

import {
  PERFORMANCE_PILLARS,
  PERFORMANCE_PILLAR_IDS,
  type PerformancePillarKey,
  type PerformanceContext,
} from "@/lib/performance-assessment-data"

export interface PerformanceSubScores {
  energy: number
  build: number
  recovery: number
  protection: number
}

export interface PerformancePillarInsight {
  key: PerformancePillarKey
  score: number
  isStrength: boolean
}

export interface PerformanceNextAction {
  pillar: PerformancePillarKey
  system: string
  label: string
  text: string
}

export interface PerformanceResult {
  subScores: PerformanceSubScores
  overall: number
  profile: string
  /** Kept for backward compat with the inline `SportsResult`. */
  profileColor: string
  insights: PerformancePillarInsight[]
  nextActions: PerformanceNextAction[]
  /** Echoed back so the UI can render context-aware copy. */
  context?: PerformanceContext
  completedAt: number
}

const PILLAR_ORDER: PerformancePillarKey[] = ["energy", "build", "recovery", "protection"]

/** A pillar at/above this raw 0–100 score counts as a strength. */
const STRENGTH_THRESHOLD = 58

/**
 * Average each pillar's 3 answers (each 0–3) → 0–100.
 * Depends only on the scored answers — context is intentionally absent here.
 */
export function computePerformanceSubScores(
  answers: Record<string, number>,
): PerformanceSubScores {
  const avg = (ids: string[]) => {
    const sum = ids.reduce((acc, id) => acc + (answers[id] ?? 0), 0)
    return Math.round((sum / (ids.length * 3)) * 100)
  }
  return {
    energy: avg(PERFORMANCE_PILLAR_IDS.energy),
    build: avg(PERFORMANCE_PILLAR_IDS.build),
    recovery: avg(PERFORMANCE_PILLAR_IDS.recovery),
    protection: avg(PERFORMANCE_PILLAR_IDS.protection),
  }
}

/** Overall = average of the four pillars, each floored at 25 (matches inline). */
export function computePerformanceOverall(sub: PerformanceSubScores): number {
  const floored = PILLAR_ORDER.map((k) => Math.max(sub[k], 25))
  return Math.round(floored.reduce((a, b) => a + b, 0) / floored.length)
}

export function getPerformanceProfile(overall: number): { label: string; color: string } {
  if (overall >= 75) return { label: "Performance-Optimised", color: "var(--icon-lime)" }
  if (overall >= 58) return { label: "Strong Foundation", color: "var(--icon-teal)" }
  if (overall >= 42) return { label: "Developing System", color: "var(--icon-yellow)" }
  if (overall >= 28) return { label: "Inconsistent Fuelling", color: "var(--icon-orange)" }
  return { label: "Early Performance Builder", color: "var(--icon-orange)" }
}

/**
 * Goal-specific nudge appended to a pillar's action when the member's main goal
 * aligns with that pillar. Recommendations only — never affects scores.
 */
const GOAL_PILLAR_NUDGE: Partial<
  Record<NonNullable<PerformanceContext["mainGoal"]>, { pillar: PerformancePillarKey; nudge: string }>
> = {
  endurance: {
    pillar: "energy",
    nudge:
      "With an endurance goal, prioritise carbohydrate availability — front-load complex carbs around your longest sessions.",
  },
  strength: {
    pillar: "build",
    nudge:
      "With a strength goal, anchor each day around protein — aim for a quality source at every main meal, not just post-training.",
  },
  recovery: {
    pillar: "recovery",
    nudge:
      "With recovery as your focus, treat rest-day nutrition as deliberately as training-day fuelling.",
  },
  body_composition: {
    pillar: "build",
    nudge:
      "For body composition, keep protein high while managing total energy — lean proteins and plants do the heavy lifting.",
  },
  match_day: {
    pillar: "energy",
    nudge:
      "For match-day performance, rehearse your fuelling on the days before — consistency under pressure starts in training.",
  },
}

function actionTextFor(key: PerformancePillarKey, isStrength: boolean): string {
  const meta = PERFORMANCE_PILLARS[key]
  return isStrength ? meta.actionHigh : meta.actionLow
}

function buildNextActions(
  insights: PerformancePillarInsight[],
  context?: PerformanceContext,
): PerformanceNextAction[] {
  const goal = context?.mainGoal
  const nudge = goal ? GOAL_PILLAR_NUDGE[goal] : undefined

  return insights.slice(0, 3).map((i) => {
    const meta = PERFORMANCE_PILLARS[i.key]
    let text = actionTextFor(i.key, i.isStrength)
    // Context tailors copy only — scores are already fixed above.
    if (nudge && nudge.pillar === i.key) {
      text = `${text} ${nudge.nudge}`
    }
    return { pillar: i.key, system: meta.system, label: meta.label, text }
  })
}

export function computePerformanceResult(
  answers: Record<string, number>,
  context?: PerformanceContext,
): PerformanceResult {
  const subScores = computePerformanceSubScores(answers)
  const overall = computePerformanceOverall(subScores)
  const { label, color } = getPerformanceProfile(overall)

  const insights: PerformancePillarInsight[] = PILLAR_ORDER.map((k) => ({
    key: k,
    score: subScores[k],
    isStrength: subScores[k] >= STRENGTH_THRESHOLD,
  })).sort((a, b) => a.score - b.score) // weakest-first

  const nextActions = buildNextActions(insights, context)

  return {
    subScores,
    overall,
    profile: label,
    profileColor: color,
    insights,
    nextActions,
    context,
    completedAt: Date.now(),
  }
}
