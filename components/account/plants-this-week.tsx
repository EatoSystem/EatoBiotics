"use client"

import { useMemo } from "react"
import { countUniquePlants, PLANT_TARGET } from "@/lib/account/plant-count"

/* ── 30 Plants a Week card ────────────────────────────────────────────────
   The most research-backed, most shareable single metric in gut health, made
   visible on the real dashboard. Derived from the week's logged meal names
   (see lib/account/plant-count.ts) — no new data, no AI. Precision-first, so
   it never overstates: it shows the plants it can positively identify.
──────────────────────────────────────────────────────────────────────── */

export function PlantsThisWeek({ mealNames }: { mealNames: (string | null | undefined)[] }) {
  const { plants, count } = useMemo(() => countUniquePlants(mealNames), [mealNames])

  const pct = Math.min(100, Math.round((count / PLANT_TARGET) * 100))
  const R = 30, C = 2 * Math.PI * R
  const dash = (pct / 100) * C
  const remaining = Math.max(0, PLANT_TARGET - count)

  const message =
    count === 0
      ? "Log a few meals and the plants you eat show up here."
      : count >= PLANT_TARGET
      ? "You've hit 30 plants this week! 🎉"
      : `${remaining} more to reach 30 this week`

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <svg width="76" height="76" viewBox="0 0 76 76" className="shrink-0 -rotate-90" role="img" aria-label={`${count} of ${PLANT_TARGET} plants this week`}>
          <circle cx="38" cy="38" r={R} fill="none" stroke="var(--border)" strokeWidth="7" />
          <circle
            cx="38" cy="38" r={R} fill="none"
            stroke="var(--icon-green)" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${dash.toFixed(1)} ${C.toFixed(1)}`}
          />
          <text x="38" y="38" transform="rotate(90 38 38)" textAnchor="middle" dominantBaseline="central" className="fill-foreground" fontSize="20" fontWeight="800">{count}</text>
        </svg>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Plants this week</p>
          <p className="mt-0.5 font-serif text-lg font-semibold text-foreground">{count} of {PLANT_TARGET}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{message}</p>
        </div>
      </div>

      {plants.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {plants.map((p) => (
            <span key={p} className="rounded-full bg-[var(--icon-green)]/10 px-2 py-0.5 text-[11px] font-medium text-foreground">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
