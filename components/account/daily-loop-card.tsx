"use client"

import Link from "next/link"
import { useTranslations } from "@/components/i18n/locale-provider"
import { interpolate } from "@/lib/i18n/config"
import type { PillarKey } from "@/lib/pillars"

/* ── Daily loop card ───────────────────────────────────────────────────────
   The "Today" surface of the habit loop: streak + the single focus nudge.
   Presentational + localized — all scoring logic lives in lib/streak.ts and
   lib/habit.ts; all copy comes from the i18n dictionary.
──────────────────────────────────────────────────────────────────────────── */

export interface DailyLoopData {
  streak: { current: number; longest: number; loggedToday: boolean; daysSinceLast: number | null }
  /** Weakest pillar (key + colour/score), from the Food System Core. Null until there's meal data. */
  focus: { key: PillarKey; color: string; score: number } | null
}

export function DailyLoopCard({ data, firstName }: { data: DailyLoopData; firstName?: string | null }) {
  const t = useTranslations()
  const { streak, focus } = data
  const greeting = firstName ? `${firstName}, ` : ""

  const streakLine =
    streak.current > 0
      ? interpolate(t.loop.streakDays, { count: streak.current })
      : streak.daysSinceLast === null
        ? t.loop.startStreak
        : t.loop.streakWaiting

  const statusLine = streak.loggedToday
    ? t.loop.statusDone
    : streak.current > 0
      ? `${greeting}${t.loop.statusKeepAlive}`
      : `${greeting}${t.loop.statusBegin}`

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
              {interpolate(t.loop.best, { count: streak.longest })}
            </div>
          )}
        </div>

        {/* Focus nudge */}
        {focus && (
          <div className="mt-4 rounded-xl bg-white/15 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-90">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: focus.color }} aria-hidden />
              {t.loop.focusLabel} · {t.pillars[focus.key]}
              <span className="tabular-nums opacity-75">({focus.score}/100)</span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed">{t.pillarNudges[focus.key]}</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="/analyse"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.02]"
            style={{ color: "var(--icon-green)" }}
          >
            {streak.loggedToday ? t.common.logAnotherMeal : t.common.logMeal}
          </Link>
          <Link href="/account/family" className="text-sm font-semibold text-white/90 underline-offset-2 hover:underline">
            {t.family.title} →
          </Link>
        </div>
      </div>
    </div>
  )
}
