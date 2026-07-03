"use client"

/**
 * MealImpactChips — "What this meal does to your Food System".
 *
 * Visual-first: each impact row is a glowing chip (green-family glow = lift,
 * amber pulse = strain) with a one-line effect; the micro-lesson sits behind a
 * per-chip "Why this matters" expander so the first view never overwhelms.
 * Rendered on the dark QuickLog result; reusable on meal history later.
 */

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { mealImpact, type MealImpactInput, type MealImpactRow } from "@/lib/account/meal-impact"

const LEVEL_LABEL: Record<MealImpactRow["level"], string> = {
  strong: "Strong lift",
  moderate: "Moderate",
  low: "Quiet",
  strain: "Strain",
}

export function MealImpactChips({
  input,
  startDelayMs = 200,
  stepDelayMs = 120,
}: {
  input: MealImpactInput
  /** Stagger timing — the Meal Reveal syncs these with the pathway nodes on the figure. */
  startDelayMs?: number
  stepDelayMs?: number
}) {
  const rows = mealImpact(input)
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="mt-4 rounded-xl p-4 text-left" style={{ background: "rgba(253,251,247,0.04)", border: "1px solid rgba(253,251,247,0.1)" }}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#A8E063" }}>
        What this meal does to your Food System
      </p>
      <div className="mt-3 space-y-2">
        {rows.map((r, i) => {
          const isOpen = open === r.key
          const strained = r.level === "strain"
          const dim = r.level === "low"
          return (
            <div
              key={r.key}
              className="eb-reveal overflow-hidden rounded-xl transition-all"
              style={{
                animationDelay: `${startDelayMs + i * stepDelayMs}ms`,
                background: strained ? "rgba(245,166,35,0.08)" : dim ? "rgba(253,251,247,0.03)" : `color-mix(in srgb, ${r.color} 10%, transparent)`,
                border: `1px solid ${strained ? "rgba(245,166,35,0.4)" : dim ? "rgba(253,251,247,0.1)" : `color-mix(in srgb, ${r.color} 40%, transparent)`}`,
                boxShadow: r.level === "strong" ? `0 0 18px ${r.color}33` : "none",
              }}
            >
              <button type="button" onClick={() => setOpen(isOpen ? null : r.key)} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left">
                <span
                  className={strained ? "eb-ping-none relative flex h-3 w-3 shrink-0" : "relative flex h-3 w-3 shrink-0"}
                >
                  {(r.level === "strong" || strained) && (
                    <span className="eb-ping absolute inline-flex h-full w-full rounded-full" style={{ background: r.color, opacity: 0.6 }} />
                  )}
                  <span className="relative inline-flex h-3 w-3 rounded-full" style={{ background: dim ? "rgba(253,251,247,0.25)" : r.color, boxShadow: dim ? "none" : `0 0 10px ${r.color}aa` }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold" style={{ color: dim ? "rgba(253,251,247,0.55)" : "rgba(253,251,247,0.92)" }}>
                    {r.label}
                    <span className="ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ background: "rgba(253,251,247,0.08)", color: dim ? "rgba(253,251,247,0.45)" : r.color }}>
                      {LEVEL_LABEL[r.level]}
                    </span>
                  </span>
                  <span className="block text-[11px] leading-snug" style={{ color: "rgba(253,251,247,0.6)" }}>{r.effect}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold" style={{ color: "rgba(253,251,247,0.45)" }}>
                  Why this matters
                  <ChevronDown size={11} className="transition-transform" style={{ transform: isOpen ? "rotate(180deg)" : undefined }} />
                </span>
              </button>
              {isOpen && (
                <p className="px-3.5 pb-3 text-[11px] leading-relaxed" style={{ color: "rgba(253,251,247,0.7)" }}>
                  {r.why}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
