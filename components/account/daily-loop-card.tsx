"use client"

import Link from "next/link"
import { useTranslations } from "@/components/i18n/locale-provider"
import { interpolate } from "@/lib/i18n/config"

/* ── Daily loop card ───────────────────────────────────────────────────────
   The "Today" surface of the habit loop: the streak.
   Presentational + localized — streak logic lives in lib/streak.ts; all copy
   comes from the i18n dictionary.

   ══ 0R-5 · `focus` IS GONE FROM THE CONTRACT ═══════════════════════════════

   A FIFTH live site of `P0-SCIENCE-01`'s class, found by 0R-5's trace and
   present in NO register entry. The card rendered, on live `/account`:

     ● Today's focus · Probiotics  (23/100)
       <the per-Biotic nudge sentence>

   which is the member's weakest Biotic NAMED, its personal score OUT OF 100,
   and a Biotic-derived COLOUR dot — four of the forms the permanent product
   rule lists in one 8-line block. `PillarKey` is
   `"prebiotics" | "probiotics" | "postbiotics"`, so `t.pillars[focus.key]`
   printed a Biotic and not an observable domain.

   ── HOW IT WAS REACHABLE, AND WHY THAT IS FAMILIAR ────────────────────────

   The card renders under `!twin && dailyLoop`, and `focus` needed
   `bioticsProfile`. Those look mutually exclusive and are not: `bioticsProfile`
   is the last FIVE analyses with NO date window, while `recentAnalyses` is the
   last SEVEN DAYS. A member whose most recent meal is eight days old and who
   never completed the assessment has `twinScore == null`,
   `recentAnalyses.length === 0` — so no Twin — and a non-null `bioticsProfile`.

   Two queries over one table with different filters, one of them feeding a
   render gate: the identical asymmetry that made `P0-TRUST-02` reachable in
   production, with a date window in place of a null check.

   ── WHY REMOVED RATHER THAN RE-DERIVED ────────────────────────────────────

   Re-deriving a focus from an observable domain would be inventing a new
   derivation during 0R. The brief's instruction is the opposite: prefer neutral
   presentation or removal. The streak is genuine — it counts days the member
   logged — and it stays. The member's real next action is derived by
   `TwinNextAction`, which is unaffected.
──────────────────────────────────────────────────────────────────────────── */

export interface DailyLoopData {
  streak: { current: number; longest: number; loggedToday: boolean; daysSinceLast: number | null }
}

export function DailyLoopCard({ data, firstName }: { data: DailyLoopData; firstName?: string | null }) {
  const t = useTranslations()
  const { streak } = data
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

        {/* The CTA row linked to /analyse and /account/family. Meal analysis
            and Family are both outside the V1 launch surface
            (lib/v1-surface.ts), so the card now reports the day rather than
            offering a way out of it. */}
      </div>
    </div>
  )
}
