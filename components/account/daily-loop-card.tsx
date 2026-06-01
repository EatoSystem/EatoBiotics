import Link from "next/link"

/* ── Daily loop card ───────────────────────────────────────────────────────
   The "Today" surface of the habit loop: streak + the single focus nudge.
   Presentational — all logic lives in lib/streak.ts and lib/habit.ts.
──────────────────────────────────────────────────────────────────────────── */

export interface DailyLoopData {
  streak: { current: number; longest: number; loggedToday: boolean; daysSinceLast: number | null }
  /** Weakest pillar + its nudge, from the Food System Core. Null until there's meal data. */
  focus: { label: string; nudge: string; color: string; score: number } | null
}

export function DailyLoopCard({ data, firstName }: { data: DailyLoopData; firstName?: string | null }) {
  const { streak, focus } = data
  const greeting = firstName ? `${firstName}, ` : ""

  const streakLine =
    streak.current > 0
      ? `${streak.current}-day streak`
      : streak.daysSinceLast === null
        ? "Start your streak today"
        : "Your streak is waiting"

  const statusLine = streak.loggedToday
    ? "Logged today — nicely done."
    : streak.current > 0
      ? `${greeting}log a meal to keep your streak alive.`
      : `${greeting}log a meal to begin.`

  return (
    <div className="mx-auto max-w-5xl px-4 pt-5 md:px-8">
      <div
        className="overflow-hidden rounded-2xl p-5 md:p-6"
        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", color: "white" }}
      >
        {/* Streak header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold md:text-xl">
              <span aria-hidden>🔥</span>
              <span className="tabular-nums">{streakLine}</span>
            </div>
            <p className="mt-1 text-sm opacity-90">{statusLine}</p>
          </div>
          {streak.longest > streak.current && (
            <div className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              Best: {streak.longest} {streak.longest === 1 ? "day" : "days"}
            </div>
          )}
        </div>

        {/* Focus nudge */}
        {focus && (
          <div className="mt-4 rounded-xl bg-white/15 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-90">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: focus.color }} aria-hidden />
              Today&apos;s focus · {focus.label}
              <span className="tabular-nums opacity-75">({focus.score}/100)</span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed">{focus.nudge}</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="/analyse"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.02]"
            style={{ color: "var(--icon-green)" }}
          >
            {streak.loggedToday ? "Log another meal" : "Log a meal"}
          </Link>
          <Link href="/account/family" className="text-sm font-semibold text-white/90 underline-offset-2 hover:underline">
            Family food system →
          </Link>
        </div>
      </div>
    </div>
  )
}
