/**
 * EatoBiotics — Day-75 retest ritual (pure logic).
 *
 * "Improve daily" needs a moment where improvement becomes visible. The
 * foundation assessment score is captured into `leads.score_history`
 * (Migration 42, jsonb array of { score, at }) every time results are
 * computed, and this module turns that history into one of three states:
 *
 *  - "countdown"  — fewer than 75 days since the baseline and no retake yet:
 *                   show Day N of 75 progress.
 *  - "due"        — 75+ days since baseline, still only one score: invite the
 *                   retake.
 *  - "compare"    — two or more scores: show baseline vs latest with delta
 *                   (the before/after moment, shareable).
 *
 * Pure functions over injected data — no Date.now() inside the branch logic,
 * so everything is unit-testable.
 */

export const RETEST_DAY = 75

export interface ScorePoint {
  score: number
  at: string // ISO timestamp
}

export type RetestState =
  | { kind: "countdown"; day: number; baseline: ScorePoint }
  | { kind: "due"; day: number; baseline: ScorePoint }
  | { kind: "compare"; baseline: ScorePoint; latest: ScorePoint; delta: number; days: number }

/** Parse an untrusted jsonb value into a clean, chronologically-sorted history. */
export function parseScoreHistory(raw: unknown): ScorePoint[] {
  if (!Array.isArray(raw)) return []
  const points: ScorePoint[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue
    const { score, at } = entry as { score?: unknown; at?: unknown }
    if (typeof score !== "number" || !Number.isFinite(score)) continue
    if (typeof at !== "string" || Number.isNaN(Date.parse(at))) continue
    points.push({ score: Math.round(Math.max(0, Math.min(100, score))), at })
  }
  return points.sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
}

/**
 * Append today's score to a history, capped. Consecutive same-day entries
 * collapse (a re-render or double submit shouldn't create duplicate points).
 */
export function appendScore(history: ScorePoint[], score: number, at: Date = new Date()): ScorePoint[] {
  const point: ScorePoint = { score: Math.round(Math.max(0, Math.min(100, score))), at: at.toISOString() }
  const last = history[history.length - 1]
  const sameDay = last && last.at.slice(0, 10) === point.at.slice(0, 10)
  const next = sameDay ? [...history.slice(0, -1), point] : [...history, point]
  return next.slice(-24) // cap: two years of monthly retakes is plenty
}

const DAY_MS = 86_400_000

/**
 * Derive the retest state. Falls back to a single synthetic baseline when the
 * history column is empty but a legacy score + date exist (pre-Migration-42
 * members keep working).
 */
export function retestState(
  history: ScorePoint[],
  fallback: { score: number | null; at: string | null },
  now: Date = new Date()
): RetestState | null {
  let points = history
  if (points.length === 0 && typeof fallback.score === "number" && fallback.at && !Number.isNaN(Date.parse(fallback.at))) {
    points = [{ score: Math.round(fallback.score), at: fallback.at }]
  }
  if (points.length === 0) return null

  const baseline = points[0]
  const latest = points[points.length - 1]

  if (points.length >= 2) {
    const days = Math.max(1, Math.round((Date.parse(latest.at) - Date.parse(baseline.at)) / DAY_MS))
    return { kind: "compare", baseline, latest, delta: latest.score - baseline.score, days }
  }

  const day = Math.max(1, Math.floor((now.getTime() - Date.parse(baseline.at)) / DAY_MS) + 1)
  if (day >= RETEST_DAY) return { kind: "due", day, baseline }
  return { kind: "countdown", day, baseline }
}
