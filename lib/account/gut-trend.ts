/* ── Gut Trend math (pure, unit-tested) ───────────────────────────────────
   Turns a member's raw biotics-score history (one entry per meal analysis)
   into a smoothed daily series plus the headline numbers the card shows:
   current level, change since the start of the window, this-week-vs-last-week
   delta, and a least-squares direction. No React here so it stays testable.
──────────────────────────────────────────────────────────────────────── */

export interface ScorePoint {
  score: number
  date: string // ISO timestamp or YYYY-MM-DD
}

export interface DailyPoint {
  date: string // YYYY-MM-DD
  score: number // average of that day's meals, rounded
}

export interface GutTrend {
  points: DailyPoint[]
  current: number
  /** current − first point, over the whole window. */
  delta: number
  /** avg(last 7 days) − avg(previous 7 days); null when not enough history. */
  weekDelta: number | null
  direction: "up" | "down" | "flat"
}

const dayKey = (iso: string): string => {
  // Accept both "2026-07-20" and full ISO timestamps.
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : iso)
  return isNaN(d.getTime()) ? iso.slice(0, 10) : d.toISOString().slice(0, 10)
}

/** Collapse many meals/day into one averaged point per day, sorted ascending. */
export function aggregateDaily(history: ScorePoint[]): DailyPoint[] {
  const byDay = new Map<string, { sum: number; n: number }>()
  for (const h of history) {
    if (h == null || typeof h.score !== "number" || isNaN(h.score)) continue
    const k = dayKey(h.date)
    const cur = byDay.get(k) ?? { sum: 0, n: 0 }
    cur.sum += h.score
    cur.n += 1
    byDay.set(k, cur)
  }
  return [...byDay.entries()]
    .map(([date, { sum, n }]) => ({ date, score: Math.round(sum / n) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : 0
}

/**
 * Builds the trend summary. Returns null when there aren't enough distinct
 * days to say anything meaningful (< 3) — the card then renders nothing.
 */
export function computeGutTrend(history: ScorePoint[]): GutTrend | null {
  const points = aggregateDaily(history)
  if (points.length < 3) return null

  const current = points[points.length - 1].score
  const delta = current - points[0].score

  // This-week vs last-week, by actual calendar distance from the latest point.
  const lastDate = Date.parse(points[points.length - 1].date + "T00:00:00Z")
  const daysAgo = (p: DailyPoint) => (lastDate - Date.parse(p.date + "T00:00:00Z")) / 86_400_000
  const thisWeek = points.filter((p) => daysAgo(p) <= 7).map((p) => p.score)
  const prevWeek = points.filter((p) => daysAgo(p) > 7 && daysAgo(p) <= 14).map((p) => p.score)
  const weekDelta = prevWeek.length && thisWeek.length ? Math.round(avg(thisWeek) - avg(prevWeek)) : null

  // Least-squares slope over day-index → sign gives the honest direction.
  const xs = points.map((p) => (Date.parse(p.date + "T00:00:00Z") - Date.parse(points[0].date + "T00:00:00Z")) / 86_400_000)
  const ys = points.map((p) => p.score)
  const xm = avg(xs), ym = avg(ys)
  const denom = xs.reduce((s, x) => s + (x - xm) ** 2, 0)
  const slope = denom > 0 ? xs.reduce((s, x, i) => s + (x - xm) * (ys[i] - ym), 0) / denom : 0

  const direction: GutTrend["direction"] = slope > 0.15 ? "up" : slope < -0.15 ? "down" : "flat"

  return { points, current, delta, weekDelta, direction }
}
