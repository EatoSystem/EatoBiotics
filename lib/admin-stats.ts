/**
 * lib/admin-stats.ts
 *
 * Pure, framework-free aggregation helpers shared by the admin dashboards
 * (app/admin/page.tsx and app/admin/waitlist/page.tsx). Kept out of the client
 * UI module so they can be imported by server components and unit-tested in
 * isolation.
 */

/** Group an array of objects by a key into a count map. */
export function countBy<T>(arr: T[], key: keyof T): Record<string, number> {
  const result: Record<string, number> = {}
  for (const item of arr) {
    const val = String(item[key] ?? "unknown")
    result[val] = (result[val] ?? 0) + 1
  }
  return result
}

/** Whole-number percentage of `part` over `whole` (0 when whole is 0). */
export function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

export interface DailyCount {
  /** UTC calendar day, YYYY-MM-DD. */
  date: string
  count: number
}

/**
 * Bucket a list of ISO timestamps into the last `days` UTC calendar days,
 * oldest → newest, with zero-filled gaps. Used for the signup sparkline.
 */
export function bucketDailyCounts(
  timestamps: Array<string | null | undefined>,
  days: number,
  now: Date = new Date()
): DailyCount[] {
  const dayKey = (d: Date) => d.toISOString().slice(0, 10)

  // Seed the window with zero counts so quiet days still render.
  const buckets = new Map<string, number>()
  const order: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    const key = dayKey(d)
    buckets.set(key, 0)
    order.push(key)
  }

  for (const ts of timestamps) {
    if (!ts) continue
    const t = new Date(ts)
    if (Number.isNaN(t.getTime())) continue
    const key = dayKey(t)
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  return order.map((date) => ({ date, count: buckets.get(date) ?? 0 }))
}

/** Sum a numeric column across rows (nulls treated as 0). */
export function sumBy<T>(rows: T[], key: keyof T): number {
  let total = 0
  for (const row of rows) total += Number(row[key] ?? 0)
  return total
}
