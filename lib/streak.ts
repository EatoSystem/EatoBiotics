/* ── Streak engine ────────────────────────────────────────────────────────
   Pure, timezone-deterministic streak math for the daily habit loop. Operates
   on the ISO timestamps of a user's logged meal analyses. Extracted from the
   inline calculation in app/account/page.tsx so it's a single, tested source
   of truth that the dashboard and future habit-loop UI both consume.

   Days are bucketed by UTC calendar date (matching the original dashboard
   behaviour). `now` is injectable for deterministic testing.
──────────────────────────────────────────────────────────────────────────── */

const DAY_MS = 86_400_000

function toDayStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Distinct UTC calendar days (YYYY-MM-DD) from a list of ISO timestamps, newest first. */
export function distinctDaysDesc(timestamps: string[]): string[] {
  return Array.from(new Set(timestamps.map((t) => t.slice(0, 10)))).sort((a, b) =>
    a > b ? -1 : 1,
  )
}

export interface StreakInfo {
  /** Consecutive days with ≥1 log, anchored to today or yesterday (0 if the chain has lapsed). */
  current: number
  /** Longest run of consecutive logged days on record. */
  longest: number
  /** Whether the user has logged today (UTC). */
  loggedToday: boolean
  /** Whole days since the most recent log (0 = today), or null if nothing logged. */
  daysSinceLast: number | null
}

export function computeStreak(timestamps: string[], now: Date = new Date()): StreakInfo {
  const days = distinctDaysDesc(timestamps)
  if (days.length === 0) {
    return { current: 0, longest: 0, loggedToday: false, daysSinceLast: null }
  }

  const todayStr = toDayStr(now)
  const yesterdayStr = toDayStr(new Date(now.getTime() - DAY_MS))

  // Current streak — only counts if the most recent log is today or yesterday.
  let current = 0
  if (days[0] === todayStr || days[0] === yesterdayStr) {
    let expected = days[0]
    for (const day of days) {
      if (day === expected) {
        current++
        expected = toDayStr(new Date(Date.parse(`${expected}T00:00:00Z`) - DAY_MS))
      } else break
    }
  }

  // Longest streak — scan the full history for the longest consecutive run.
  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    const expectedPrev = toDayStr(new Date(Date.parse(`${days[i - 1]}T00:00:00Z`) - DAY_MS))
    if (days[i] === expectedPrev) {
      run++
      longest = Math.max(longest, run)
    } else {
      run = 1
    }
  }

  const daysSinceLast = Math.round(
    (Date.parse(`${todayStr}T00:00:00Z`) - Date.parse(`${days[0]}T00:00:00Z`)) / DAY_MS,
  )

  return { current, longest, loggedToday: days[0] === todayStr, daysSinceLast }
}
