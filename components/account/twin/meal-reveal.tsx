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

/* ── The 24h journey the meal takes through the body ──────────────────────────
   AFTER_MEAL_STEPS gives at/title/detail/colour; here we anchor each stage to a
   region of the figure (% coords + glow radius) and add the biology + "what you
   may feel" so the reveal can play the food travelling down the body. */
export interface MealJourneyStage {
  at: string
  title: string
  detail: string
  color: string
  node: { x: number; y: number; r: number }
  biotic: string
  feel: string
}

const JOURNEY_REGION = [
  { x: 52, y: 40, r: 30 }, // Now — stomach / first contact
  { x: 49, y: 50, r: 33 }, // ~4h — small intestine, nutrients absorbed
  { x: 47, y: 61, r: 35 }, // ~12h — colon, microbes ferment the fibre
  { x: 50, y: 49, r: 66 }, // ~24h — the give-back radiates through the whole body
]
const JOURNEY_BIOTIC = ["Digestion begins", "Prebiotic fibre travels on", "Prebiotics feed your microbes", "Postbiotics produced"]
const JOURNEY_FEEL = [
  "full and satisfied as the meal is broken down",
  "steady energy as nutrients are absorbed",
  "this is where fibre earns its keep — your microbes ferment it",
  "compounds associated with comfort, calm and steadier energy",
]

export const JOURNEY_STAGES: MealJourneyStage[] = AFTER_MEAL_STEPS.map((s, i) => ({
  at: s.at,
  title: s.title,
  detail: s.detail,
  color: s.color,
  node: JOURNEY_REGION[i] ?? JOURNEY_REGION[0],
  biotic: JOURNEY_BIOTIC[i] ?? "",
  feel: JOURNEY_FEEL[i] ?? "",
}))

/** When the after-meal journey should start auto-playing — once the impact rows
    have finished landing (matches the panel's afterDelay + a beat). */
export function mealRevealStartDelayMs(result: QuickLogResult): number {
  return REVEAL_ROW_BASE_MS + mealImpact(result).length * REVEAL_ROW_STEP_MS + 900
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

export function MealPathwayOverlay({ result, journeyStage = null }: { result: QuickLogResult; journeyStage?: number | null }) {
  const rows = useMemo(() => mealImpact(result), [result])
  const stage = journeyStage != null ? JOURNEY_STAGES[journeyStage] : null

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {/* the food travelling through the body — a bright region glow that moves
          down the tract (stomach → small intestine → colon → whole body) as the
          24h journey plays / is scrubbed */}
      {stage && (
        <>
          <span
            className="absolute rounded-full"
            style={{
              left: `${stage.node.x}%`,
              top: `${stage.node.y}%`,
              width: `${stage.node.r}%`,
              height: `${stage.node.r}%`,
              transform: "translate(-50%,-50%)",
              background: `radial-gradient(circle, ${stage.color}88 0%, ${stage.color}33 45%, transparent 70%)`,
              transition: "left .8s ease, top .8s ease, width .8s ease, height .8s ease, background .8s ease",
              mixBlendMode: "screen",
            }}
          />
          <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${stage.node.x}%`, top: `${stage.node.y}%`, transition: "left .8s ease, top .8s ease" }}>
            <span className="relative flex h-9 w-9 items-center justify-center">
              <span className="eb-ping absolute inline-flex h-full w-full rounded-full" style={{ background: stage.color, opacity: 0.6 }} />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full" style={{ background: stage.color, boxShadow: `0 0 18px ${stage.color}` }} />
            </span>
          </span>
        </>
      )}
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
  stage = 0,
  onStageChange,
  memory = null,
}: {
  result: QuickLogResult
  onDone: () => void
  onLogAnother?: () => void
  /** Active stage of the 24h body-journey (0–3), shared with the figure. */
  stage?: number
  onStageChange?: (i: number) => void
  /** One-line longitudinal callback from lib/account/meal-memory. */
  memory?: string | null
}) {
  const rows: MealImpactRow[] = useMemo(() => mealImpact(result), [result])
  const afterDelay = REVEAL_ROW_BASE_MS + rows.length * REVEAL_ROW_STEP_MS
  const active = JOURNEY_STAGES[stage] ?? JOURNEY_STAGES[0]

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

      {/* the Twin remembers — longitudinal callback for this exact meal */}
      {memory && (
        <p className="eb-reveal mt-3 max-w-xl rounded-xl px-4 py-3 text-sm leading-relaxed" style={{ background: "rgba(168,224,99,0.08)", border: "1px solid rgba(168,224,99,0.25)", color: "#D8EFC0", animationDelay: `${afterDelay + 150}ms` }}>
          {memory}
        </p>
      )}

      {/* follow your meal through the day — a scrubbable 24h journey that plays
          out on the figure (the region glow travels down the body) */}
      <div className="eb-reveal mt-5 max-w-xl" style={{ animationDelay: `${afterDelay + 200}ms` }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#A8E063" }}>Follow your meal through the day</p>
        {/* scrubber */}
        <div className="mt-2.5 flex items-end gap-1.5">
          {JOURNEY_STAGES.map((s, i) => (
            <button
              key={s.at}
              type="button"
              onClick={() => onStageChange?.(i)}
              aria-pressed={i === stage}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span className="text-[10px] font-bold transition-colors" style={{ color: i === stage ? s.color : "rgba(253,251,247,0.5)" }}>{s.at}</span>
              <span className="relative h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(253,251,247,0.12)" }}>
                <span className="absolute inset-y-0 left-0 rounded-full transition-all duration-500" style={{ width: i <= stage ? "100%" : "0%", background: s.color, boxShadow: i === stage ? `0 0 8px ${s.color}` : "none" }} />
              </span>
            </button>
          ))}
        </div>
        {/* active stage — the education panel */}
        <div key={stage} className="eb-pop-in mt-3 rounded-xl p-4" style={{ background: `color-mix(in srgb, ${active.color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${active.color} 35%, transparent)` }}>
          <div className="flex items-center gap-2">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: active.color, color: "#0B1607" }}>{active.at}</span>
            <p className="font-serif text-base font-bold" style={{ color: CREAM }}>{active.title}</p>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "rgba(253,251,247,0.8)" }}>{active.detail}</p>
          <div className="mt-2.5 flex flex-col gap-1.5 border-t pt-2.5 text-xs" style={{ borderColor: "rgba(253,251,247,0.12)" }}>
            <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: active.color }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: active.color }} /> {active.biotic}
            </span>
            <span style={{ color: "rgba(253,251,247,0.6)" }}>You may feel {active.feel}.</span>
          </div>
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
