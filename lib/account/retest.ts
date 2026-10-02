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

import { canCompare } from "@/lib/fss/engine/compare"
import type { ScoreProvenance } from "@/lib/fss/engine/provenance"

export const RETEST_DAY = 75

/* ════════════════════════════════════════════════════════════════════════════
   WHAT INSTRUMENT PRODUCED THESE TWO NUMBERS — Gate 5 step 2c.

   `components/account/retest-card.tsx` recorded this gap in Gate 3.5b and was
   right to: "`ScorePoint` is `{ score, at }`. THERE IS NO PROVENANCE ON IT…
   the day the instrument does change, every historical pair silently becomes a
   comparison between two different things and nothing here would notice."

   Step 2c's requirement is that there be ONE longitudinal authority, so this
   now asks `canCompare` like everything else. The question it had to answer
   first was whether the pair is honestly comparable at all, and unlike the meal
   rubric — where the answer was no — here it is yes, for a reason that was
   checked rather than assumed:

     · `appendScore` has exactly ONE caller, `app/api/send-results-email`,
       which passes `result.overall` from `lib/assessment-scoring.ts` — the
       fifteen-item foundation instrument, inside the methodology freeze.
     · The single-point FALLBACK path reads `leads.overall_score`, which two
       instruments do write. It can never reach the `compare` branch, because
       one point yields `countdown` or `due`.

   So every pair this module subtracts came from one instrument. That property —
   not the constant below — is what makes the comparison sound, so it is pinned
   by a test that reads `appendScore`'s callers.

   ── WHAT STILL IS NOT RECORDED, AND WHY THAT IS NOT PAPERED OVER ──────────

   The version is asserted HERE, not stored on the row. If the foundation
   instrument moves, this constant must move with it and the refusal below
   starts firing for pairs written either side of the change — which is the
   wrong granularity, because it would refuse old-and-old pairs too. The right
   fix is still provenance on each `ScorePoint`, which is still a schema change,
   and agent sessions are read-only against production. Recorded, as before.
   ════════════════════════════════════════════════════════════════════════════ */

export const RETEST_PROVENANCE: ScoreProvenance = {
  fssMethodVersion: "foundation-assessment-v1",
  assessmentVersion: "foundation-assessment-v1",
  questionSetVersion: "foundation-15-item",
  calculationVersion: "sum-over-max-v1",
  interpretationVersion: "foundation-profile-v1",
}

export interface ScorePoint {
  score: number
  at: string // ISO timestamp
}

export type RetestState =
  | { kind: "countdown"; day: number; baseline: ScorePoint }
  | { kind: "due"; day: number; baseline: ScorePoint }
  | { kind: "compare"; baseline: ScorePoint; latest: ScorePoint; delta: number; days: number }
  /**
   * Two scores exist and may NOT be drawn a line between.
   *
   * Both are still carried, because a refusal suppresses the relationship and
   * not the records — the same shape `FoodSystemComparison` takes. There is no
   * `delta` field, so no renderer can reach for one.
   */
  | { kind: "compare-refused"; baseline: ScorePoint; latest: ScorePoint; days: number; because: string }

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
  now: Date = new Date(),
  /**
   * The instrument behind the two points. Defaults to the only one that writes
   * them; a test supplies a moved version to exercise the refusal, the same way
   * `now` is injected above.
   */
  provenance: { previous: ScoreProvenance; latest: ScoreProvenance } = {
    previous: RETEST_PROVENANCE,
    latest: RETEST_PROVENANCE,
  }
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

    /*
     * THE VERDICT COMES BEFORE THE SUBTRACTION, so there is no delta to leak
     * on the refusal path. One authority, asked here exactly as the candidate
     * product asks it.
     */
    const verdict = canCompare(provenance.previous, provenance.latest)
    if (!verdict.comparable) {
      return { kind: "compare-refused", baseline, latest, days, because: verdict.explain }
    }

    return { kind: "compare", baseline, latest, delta: latest.score - baseline.score, days }
  }

  const day = Math.max(1, Math.floor((now.getTime() - Date.parse(baseline.at)) / DAY_MS) + 1)
  if (day >= RETEST_DAY) return { kind: "due", day, baseline }
  return { kind: "countdown", day, baseline }
}
