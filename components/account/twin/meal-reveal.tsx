"use client"

/**
 * The Meal Reveal — a logged meal plays out ON the Food System stage.
 *
 * Two halves, one timeline (shared row delays so they land together):
 *  - MealPathwayOverlay (over the orb figure): pathway nodes ignite one-by-one
 *    where the meal's impacts land (probiotic → gut, fibre → lower gut, plants
 *    → upper body, fats → chest, protein → core, strain → amber pulse) while
 *    particles drift inward — the body visibly receiving the meal.
 *  - MealRevealPanel (replaces the score cockpit): MEAL RECEIVED → meal name →
 *    count-up score → the same impact rows staggered in sync with the nodes →
 *    nutrition strip → insight → the after-meal journey → Log another / Done.
 *
 * Both are driven purely by mealImpact(result) (lib/account/meal-impact), so
 * left and right always tell the same story in the same colours.
 */

import { useMemo } from "react"
import { Check, Utensils } from "lucide-react"
import { useCountUp } from "./use-count-up"
import { MealImpactChips } from "./meal-impact"
import { mealImpact, type MealImpactRow } from "@/lib/account/meal-impact"
import { AFTER_MEAL_STEPS } from "@/lib/account/evolution"
import type { QuickLogResult } from "./quick-log"

const CREAM = "#FDFBF7"

/** Row i (node + panel chip) appears at BASE + i·STEP — one timeline, two halves. */
export const REVEAL_ROW_BASE_MS = 900
export const REVEAL_ROW_STEP_MS = 450

/** Where each impact's pathway node sits on the figure (% of orb stage). */
const PATHWAY_NODE: Record<string, { x: number; y: number }> = {
  probiotic: { x: 57, y: 50 },  // the gut — home of the live cultures
  fibre: { x: 48, y: 59 },      // lower gut — where fibre feeds the microbes
  plants: { x: 50, y: 22 },     // upper body ambience — whole-system lift
  fats: { x: 44, y: 34 },       // chest — the calm, steady side
  protein: { x: 52, y: 42 },    // core — structure and fuel
  strain: { x: 53, y: 54 },     // gut, amber — buffering, not punished
  postbiotic: { x: 46, y: 67 }, // energy pathways — the give-back
}

/** The top (first-sorted) impact tints the stage aura during the reveal. */
export function revealAura(result: QuickLogResult): string {
  const top = mealImpact(result)[0]
  const c = top?.color ?? "#A8E063"
  return `radial-gradient(circle, ${c}55 0%, ${c}22 45%, transparent 70%)`
}

/* Inward particle drift — the meal being received (reuses the eb-absorb language). */
const DRIFT = [
  { x: -140, y: -80, c: "#A8E063", s: 9 },
  { x: 130, y: -100, c: "#F5C518", s: 7 },
  { x: -100, y: 110, c: "#2DAA6E", s: 8 },
  { x: 145, y: 60, c: "#F5A623", s: 7 },
  { x: -30, y: -145, c: "#4CB648", s: 9 },
  { x: 80, y: 135, c: "#A8E063", s: 6 },
]

export function MealPathwayOverlay({ result }: { result: QuickLogResult }) {
  const rows = useMemo(() => mealImpact(result), [result])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {/* particles drifting into the figure as the reveal begins */}
      {DRIFT.map((p, i) => (
        <span
          key={i}
          className="eb-absorb absolute left-1/2 top-1/2"
          style={{
            width: p.s,
            height: p.s,
            marginLeft: -p.s / 2,
            marginTop: -p.s / 2,
            borderRadius: "50%",
            background: p.c,
            boxShadow: `0 0 12px ${p.c}aa`,
            opacity: 0,
            animationDuration: "1.3s",
            animationDelay: `${300 + i * 140}ms`,
            ["--eb-from-x" as string]: `${p.x}px`,
            ["--eb-from-y" as string]: `${p.y}px`,
          }}
        />
      ))}

      {/* pathway nodes — one per impact row, same delay as its panel chip */}
      {rows.map((r, i) => {
        const pos = PATHWAY_NODE[r.key]
        if (!pos) return null
        const strained = r.level === "strain"
        const dim = r.level === "low"
        return (
          <span
            key={r.key}
            className="eb-reveal absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, animationDelay: `${REVEAL_ROW_BASE_MS + i * REVEAL_ROW_STEP_MS}ms` }}
          >
            <span className="relative flex h-8 w-8 items-center justify-center">
              {!dim && (
                <span
                  className="eb-ping absolute inline-flex h-full w-full rounded-full"
                  style={{ background: r.color, opacity: strained ? 0.45 : 0.65, animationDuration: strained ? "2.4s" : "1.6s" }}
                />
              )}
              <span
                className="relative inline-flex rounded-full"
                style={{
                  height: dim ? 9 : 15,
                  width: dim ? 9 : 15,
                  background: dim ? "rgba(253,251,247,0.3)" : r.color,
                  border: "2px solid rgba(11,22,7,0.55)",
                  boxShadow: dim ? "none" : `0 0 ${strained ? 12 : 18}px ${r.color}cc`,
                }}
              />
            </span>
          </span>
        )
      })}
    </div>
  )
}

/* ── the right-hand story panel ───────────────────────────────────────────── */

function RevealScore({ value }: { value: number }) {
  const score = useCountUp(value, 1100)
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-serif text-7xl font-bold leading-none md:text-8xl" style={{ color: CREAM }}>{score}</span>
      <span className="text-lg font-semibold" style={{ color: "rgba(253,251,247,0.4)" }}>/100</span>
    </div>
  )
}

function NutritionStrip({ nutrition, delayMs }: { nutrition: NonNullable<QuickLogResult["nutrition"]>; delayMs: number }) {
  const items = [
    { label: "kcal", value: nutrition.calories, color: "#F5A623" },
    { label: "protein", value: `${nutrition.protein}g`, color: "#2DAA6E" },
    { label: "fibre", value: `${nutrition.fibre}g`, color: "#A8E063" },
  ]
  return (
    <div className="eb-reveal mt-4 flex max-w-xl items-stretch overflow-hidden rounded-xl" style={{ background: "rgba(253,251,247,0.05)", border: "1px solid rgba(253,251,247,0.12)", animationDelay: `${delayMs}ms` }}>
      {items.map((it, i) => (
        <div key={it.label} className="flex flex-1 flex-col items-center py-2.5" style={{ borderLeft: i > 0 ? "1px solid rgba(253,251,247,0.1)" : undefined }}>
          <span className="font-serif text-base font-bold leading-none" style={{ color: it.color }}>{it.value}</span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(253,251,247,0.5)" }}>{it.label}</span>
        </div>
      ))}
    </div>
  )
}

export function MealRevealPanel({
  result,
  onDone,
  onLogAnother,
}: {
  result: QuickLogResult
  onDone: () => void
  onLogAnother?: () => void
}) {
  const rows: MealImpactRow[] = useMemo(() => mealImpact(result), [result])
  const afterDelay = REVEAL_ROW_BASE_MS + rows.length * REVEAL_ROW_STEP_MS

  return (
    <div className="min-w-0">
      <p className="eb-reveal inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ background: "rgba(168,224,99,0.12)", border: "1px solid rgba(168,224,99,0.35)", color: "#A8E063", animationDelay: "200ms" }}>
        <Utensils size={10} /> Meal received
      </p>
      <h2 className="eb-reveal mt-2 font-serif text-xl font-bold leading-snug md:text-2xl" style={{ color: "rgba(253,251,247,0.92)", animationDelay: "300ms" }}>
        {result.meal_name}
      </h2>
      <div className="eb-reveal mt-3" style={{ animationDelay: "400ms" }}>
        <RevealScore value={result.biotics_score} />
      </div>

      {/* impact rows — staggered in sync with the pathway nodes on the figure */}
      <div className="max-w-xl">
        <MealImpactChips input={result} startDelayMs={REVEAL_ROW_BASE_MS} stepDelayMs={REVEAL_ROW_STEP_MS} />
      </div>

      {result.nutrition && <NutritionStrip nutrition={result.nutrition} delayMs={afterDelay} />}

      {result.insight && (
        <p className="eb-reveal mt-4 max-w-xl rounded-xl px-4 py-3 text-sm leading-relaxed" style={{ background: "rgba(253,251,247,0.06)", border: "1px solid rgba(253,251,247,0.14)", color: "rgba(253,251,247,0.85)", animationDelay: `${afterDelay + 100}ms` }}>
          {result.insight}
        </p>
      )}

      {/* what happens next — compact horizontal after-meal journey */}
      <div className="eb-reveal mt-4 max-w-xl" style={{ animationDelay: `${afterDelay + 200}ms` }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#A8E063" }}>What happens next inside you</p>
        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AFTER_MEAL_STEPS.map((s, i) => (
            <div key={s.at} className="eb-reveal rounded-xl px-2.5 py-2" style={{ background: "rgba(253,251,247,0.04)", border: "1px solid rgba(253,251,247,0.1)", animationDelay: `${afterDelay + 300 + i * 150}ms` }}>
              <p className="text-[10px] font-bold" style={{ color: s.color }}>{s.at}</p>
              <p className="mt-0.5 text-[11px] font-semibold leading-snug" style={{ color: "rgba(253,251,247,0.85)" }}>{s.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="eb-reveal mt-5 flex flex-wrap gap-3" style={{ animationDelay: `${afterDelay + 400}ms` }}>
        {onLogAnother && (
          <button
            type="button"
            onClick={onLogAnother}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10"
            style={{ border: "1px solid rgba(168,224,99,0.5)", color: "#A8E063" }}
          >
            <Utensils className="h-4 w-4" /> Log another
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)", boxShadow: "0 6px 24px rgba(76,182,72,0.35)" }}
        >
          <Check className="h-4 w-4" /> Done
        </button>
      </div>
    </div>
  )
}
