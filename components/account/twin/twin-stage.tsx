"use client"

/**
 * TwinStage — the cinematic Digital Twin hero.
 *
 * A full-bleed, deep-botanical dark stage (greens/ink only — never blue/purple):
 * the member's twin figure glows inside a luminous orb of light (which also lets
 * the white-background art multiply-blend on a dark stage), with constellation
 * hotspots (Mind / Defence / Digestion / Energy) wired to fine connector lines
 * and a dark-glass education panel. Beside it, the score cockpit: a count-up
 * Food System Score, momentum, a 14-day sparkline of meal signals, the three
 * biotic bars, and the next best action. Arrival is choreographed (eb-reveal /
 * eb-orb-bloom staggering; fully visible under reduced motion).
 *
 * Used at the top of the account Overview and /account/twin (and the demos).
 */

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Leaf, Target, Utensils, UtensilsCrossed, X } from "lucide-react"
import { HeroVideo } from "@/components/hero-video"
import { DigitalTwinFigure } from "@/components/digital-twin/parts"
import { MealReactionBurst } from "./meal-reaction"
import { ShareTwin } from "./share-twin"
import { useCountUp } from "./use-count-up"
import { systemMapState, type SystemHotspotKey, type SystemHotspotState } from "@/lib/account/system-map"
import { stageMood, type StageMood } from "@/lib/account/stage-mood"
import { browserStore, dayKey, loadRitual, ritualCount } from "@/lib/account/ritual"
import { auraGradientForBiotic } from "@/lib/account/twin-visual"
import type { TwinVisualState } from "@/lib/account/twin-visual"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"
import type { TwinVideo } from "@/lib/account/twin-figure"
import type { BioticKey } from "@/lib/agent-loop/types"

const STAGE_BG = "linear-gradient(175deg, #0B1607 0%, #122208 55%, #16290F 100%)"
const CREAM = "#FDFBF7"

const HOTSPOT_COLOR: Record<SystemHotspotKey, string> = {
  mind: "#7ED9A8",
  defence: "#F5A623",
  digestion: "#A8E063",
  energy: "#F5C518",
}

/** Where each hotspot's floating label sits on the orb stage (% coords). */
const LABEL_ANCHOR: Record<SystemHotspotKey, { x: number; y: number; align: "left" | "right" }> = {
  mind: { x: 88, y: 9, align: "left" },
  defence: { x: 6, y: 28, align: "right" },
  digestion: { x: 90, y: 54, align: "left" },
  energy: { x: 8, y: 76, align: "right" },
}

const BIOTIC_NAME: Record<BioticKey, string> = {
  prebiotics: "Prebiotics",
  probiotics: "Probiotics",
  postbiotics: "Postbiotics",
}
const BIOTIC_COLOR: Record<BioticKey, string> = {
  prebiotics: "#A8E063",
  probiotics: "#2DAA6E",
  postbiotics: "#F5C518",
}

/* ── 14-day sparkline of meal signals ─────────────────────────────────────── */

function Sparkline({ twin }: { twin: FoodSystemDigitalTwin }) {
  const points = useMemo(() => {
    const cutoff = Date.now() - 14 * 86_400_000
    return twin.observations
      .filter((o) => (o.kind === "meal_description" || o.kind === "meal_photo") && o.createdAt >= cutoff)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((o) => Number((o.meta as { score?: number } | undefined)?.score ?? 0))
      .filter((s) => s > 0)
  }, [twin])

  if (points.length < 2) return null
  const w = 220
  const h = 44
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = Math.max(1, max - min)
  const xy = points.map((p, i) => [
    (i / (points.length - 1)) * (w - 8) + 4,
    h - 6 - ((p - min) / span) * (h - 14),
  ])
  const path = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const [ex, ey] = xy[xy.length - 1]

  return (
    <div className="eb-reveal" style={{ animationDelay: "650ms" }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block max-w-full" aria-hidden>
        <defs>
          <linearGradient id="twin-spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(168,224,99,0.35)" />
            <stop offset="100%" stopColor="rgba(168,224,99,0)" />
          </linearGradient>
        </defs>
        <path d={`${path} L${ex},${h - 2} L4,${h - 2} Z`} fill="url(#twin-spark-fill)" />
        <path d={path} fill="none" stroke="#A8E063" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={ex} cy={ey} r={3.5} fill="#F5C518" />
        <circle cx={ex} cy={ey} r={7} fill="none" stroke="rgba(245,197,24,0.5)" strokeWidth={1.5} className="eb-ping" style={{ transformOrigin: `${ex}px ${ey}px` }} />
      </svg>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(253,251,247,0.45)" }}>
        Meal signals · last 14 days
      </p>
    </div>
  )
}

/* ── Dark biotic bar with shimmer fill ────────────────────────────────────── */

function BioticBar({ biotic, score, delay }: { biotic: BioticKey; score: number; delay: number }) {
  const c = BIOTIC_COLOR[biotic]
  return (
    <div className="eb-reveal" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(253,251,247,0.75)" }}>{BIOTIC_NAME[biotic]}</span>
        <span className="font-serif text-sm font-bold" style={{ color: c }}>{score}</span>
      </div>
      <div className="mt-1.5 h-[7px] overflow-hidden rounded-full" style={{ background: "rgba(253,251,247,0.10)" }}>
        <div
          className="eb-shimmer h-full rounded-full transition-[width] duration-1000"
          style={{ width: `${Math.max(4, Math.min(100, score))}%`, backgroundColor: c, backgroundBlendMode: "overlay" }}
        />
      </div>
    </div>
  )
}

/* ── The stage ────────────────────────────────────────────────────────────── */

export function TwinStage({
  twin,
  visual,
  figureSrc,
  video = null,
  learning = false,
  detailHref = "/account/twin",
  addMealHref = "/analyse",
  demo = false,
  burstKey = 0,
  burstMessage,
  onSimulateMeal,
  checklist,
  onAddMeal,
}: {
  twin: FoodSystemDigitalTwin
  visual: TwinVisualState
  figureSrc: string
  video?: TwinVideo | null
  learning?: boolean
  /** Link to the full Twin page; pass null when already on it. */
  detailHref?: string | null
  addMealHref?: string
  demo?: boolean
  /** Increment to fire the meal-reaction burst over the orb. */
  burstKey?: number
  /** Custom burst chip text (milestone celebrations). */
  burstMessage?: string
  /** Demo only: shows the "Simulate a meal" button. */
  onSimulateMeal?: () => void
  /** Day-one slot: rendered instead of the sparkline (e.g. MeetTwinChecklist). */
  checklist?: React.ReactNode
  /** When set, the Add-meal CTA opens QuickLog instead of navigating. */
  onAddMeal?: () => void
}) {
  const [selected, setSelected] = useState<SystemHotspotKey | null>(null)
  /* Time-of-day + engagement mood — computed after mount so SSR/hydration match. */
  const [mood, setMood] = useState<StageMood>(() => stageMood(13, { fed: true }))
  useEffect(() => {
    const fedToday =
      twin.observations.some((o) => {
        if (o.kind !== "meal_description" && o.kind !== "meal_photo") return false
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        return o.createdAt >= start.getTime()
      }) || ritualCount(loadRitual(browserStore(), dayKey())) > 0
    setMood(stageMood(new Date().getHours(), { fed: fedToday }))
  }, [twin])
  const hotspots = useMemo(() => systemMapState(twin), [twin])
  const active: SystemHotspotState | null = hotspots.find((h) => h.key === selected) ?? null
  const aura = active
    ? auraGradientForBiotic(active.biotic, visual.confidence)
    : auraGradientForBiotic(twin.biotics.weakest, visual.confidence)

  const score = useCountUp(visual.ringScore)
  const delta = twin.progress.scoreDelta

  return (
    <section className="relative overflow-hidden" style={{ background: STAGE_BG }}>
      {/* atmosphere: layered glows + vignette, tinted by the time-of-day mood */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-32 h-[420px] w-[420px] rounded-full transition-all duration-1000" style={{ background: `radial-gradient(circle, ${mood.glowA} 0%, transparent 65%)` }} />
        <div className="absolute -right-32 top-10 h-[520px] w-[520px] rounded-full transition-all duration-1000" style={{ background: `radial-gradient(circle, ${mood.glowB} 0%, transparent 65%)` }} />
        <div className="absolute -bottom-40 left-1/3 h-[460px] w-[460px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,166,35,0.09) 0%, transparent 65%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(5,10,3,0.55) 100%)" }} />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,440px)_1fr] md:gap-14">
          {/* ── the luminous orb + figure + constellation ── */}
          <div className="relative mx-auto aspect-square w-full max-w-[420px]">
            {/* light orb — gives the multiply-blended art a light core to live on */}
            <div
              className="eb-orb-bloom absolute left-1/2 top-1/2 h-[92%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: `radial-gradient(circle, ${CREAM} 0%, ${CREAM} 42%, rgba(253,251,247,0.55) 58%, rgba(253,251,247,0.12) 70%, transparent 78%)`,
                boxShadow: "0 0 120px 30px rgba(168,224,99,0.14)",
              }}
            />
            {/* biotic-tinted aura breathing over the light core */}
            <div
              aria-hidden
              className="eb-aura pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: aura, opacity: Math.min(1, (0.5 + 0.4 * visual.confidence) * mood.auraMult), animationDuration: `${visual.pulseSec}s`, mixBlendMode: "screen", transition: "opacity 1s" }}
            />
            {/* the figure — video in a circular mask, or the still figure */}
            <div className="eb-orb-bloom absolute left-1/2 top-1/2 h-[84%] w-[84%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full" style={{ animationDelay: "150ms" }}>
              {video ? (
                <HeroVideo
                  posterSrc={video.poster}
                  mp4Src={video.mp4}
                  webmSrc={video.webm}
                  alt="Your Food System Digital Twin"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ background: CREAM }}>
                  <DigitalTwinFigure size={300} src={figureSrc} alt="Your Food System Digital Twin" showParticles={visual.particleDensity > 0.35 || mood.particles} />
                </div>
              )}
            </div>

            {/* constellation connector lines (desktop) */}
            <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block">
              {hotspots.map((h) => {
                const a = LABEL_ANCHOR[h.key]
                return (
                  <line
                    key={h.key}
                    x1={h.x} y1={h.y} x2={a.x} y2={a.y}
                    stroke={selected === h.key ? HOTSPOT_COLOR[h.key] : "rgba(253,251,247,0.28)"}
                    strokeWidth={selected === h.key ? 0.5 : 0.3}
                    strokeDasharray="1.6 1.8"
                  />
                )
              })}
            </svg>

            {/* hotspot nodes */}
            {hotspots.map((h, i) => {
              const c = HOTSPOT_COLOR[h.key]
              const isActive = selected === h.key
              return (
                <button
                  key={h.key}
                  type="button"
                  onClick={() => setSelected(isActive ? null : h.key)}
                  aria-pressed={isActive}
                  aria-label={`${h.label} — ${h.level}`}
                  className="eb-reveal absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${h.x}%`, top: `${h.y}%`, animationDelay: `${900 + i * 120}ms` }}
                >
                  <span className="relative flex h-7 w-7 items-center justify-center">
                    <span className="eb-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ background: c }} />
                    <span
                      className="relative inline-flex h-[15px] w-[15px] rounded-full transition-transform hover:scale-125"
                      style={{ background: c, border: "2px solid rgba(11,22,7,0.55)", boxShadow: `0 0 14px ${c}cc`, transform: isActive ? "scale(1.35)" : undefined }}
                    />
                  </span>
                </button>
              )
            })}

            {/* floating labels (desktop) */}
            {hotspots.map((h, i) => {
              const a = LABEL_ANCHOR[h.key]
              const c = HOTSPOT_COLOR[h.key]
              const isActive = selected === h.key
              return (
                <button
                  key={`label-${h.key}`}
                  type="button"
                  onClick={() => setSelected(isActive ? null : h.key)}
                  className="eb-reveal absolute z-10 hidden -translate-y-1/2 sm:block"
                  style={{
                    left: a.align === "left" ? `${a.x}%` : undefined,
                    right: a.align === "right" ? `${100 - a.x}%` : undefined,
                    top: `${a.y}%`,
                    transform: a.align === "left" ? "translate(-14%,-50%)" : "translate(14%,-50%)",
                    animationDelay: `${1000 + i * 120}ms`,
                  }}
                >
                  <span
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur transition-colors"
                    style={{
                      background: isActive ? `color-mix(in srgb, ${c} 22%, rgba(11,22,7,0.7))` : "rgba(253,251,247,0.08)",
                      border: `1px solid ${isActive ? c : "rgba(253,251,247,0.18)"}`,
                      color: isActive ? c : "rgba(253,251,247,0.8)",
                    }}
                  >
                    {h.label}
                    <span style={{ color: c }}>{h.score}</span>
                  </span>
                </button>
              )
            })}

            <MealReactionBurst playKey={burstKey} message={burstMessage ?? "Your Twin just learned from your meal"} />

            {/* live pill */}
            <div className="absolute -top-1 left-0 flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur" style={{ background: "rgba(253,251,247,0.08)", border: "1px solid rgba(253,251,247,0.18)" }}>
              <span className="relative flex h-2 w-2">
                <span className="eb-ping absolute inline-flex h-full w-full rounded-full" style={{ background: "#A8E063" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#A8E063" }} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#A8E063" }}>
                {learning ? "Learning…" : "Live & learning"}
              </span>
            </div>
          </div>

          {/* ── score cockpit ── */}
          <div className="min-w-0">
            <p className="eb-reveal text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "#A8E063", animationDelay: "200ms" }}>
              Your Digital Twin · {visual.momentumLabel}
              <span className="ml-2 font-semibold normal-case tracking-normal" style={{ color: "rgba(253,251,247,0.4)" }}>{mood.line}</span>
            </p>
            <div className="eb-reveal mt-3 flex flex-wrap items-end gap-x-4 gap-y-2" style={{ animationDelay: "300ms" }}>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-7xl font-bold leading-none md:text-8xl" style={{ color: CREAM }}>{score}</span>
                <span className="text-lg font-semibold" style={{ color: "rgba(253,251,247,0.4)" }}>/100</span>
              </div>
              <span
                className="mb-2 rounded-full px-3 py-1 text-xs font-bold"
                style={
                  delta >= 0
                    ? { background: "rgba(168,224,99,0.16)", color: "#A8E063", border: "1px solid rgba(168,224,99,0.35)" }
                    : { background: "rgba(245,166,35,0.14)", color: "#F5C518", border: "1px solid rgba(245,197,24,0.35)" }
                }
              >
                {delta > 0 ? `▲ +${delta} since baseline` : delta < 0 ? `▼ ${delta} since baseline` : "Holding at baseline"}
              </span>
            </div>
            <h2 className="eb-reveal mt-2 max-w-xl font-serif text-lg font-bold leading-snug md:text-xl" style={{ color: "rgba(253,251,247,0.88)", animationDelay: "400ms" }}>
              The Food System inside you, learning from every meal.
              {" "}
              <Link href="/method" className="whitespace-nowrap align-middle font-sans text-xs font-semibold underline underline-offset-2 transition-colors hover:text-white" style={{ color: "rgba(253,251,247,0.45)" }}>
                How is this scored?
              </Link>
            </h2>

            <div className="mt-5 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8">
              {checklist ?? <Sparkline twin={twin} />}
              <div className="max-w-sm space-y-3">
                <BioticBar biotic="prebiotics" score={twin.biotics.prebiotics.score} delay={700} />
                <BioticBar biotic="probiotics" score={twin.biotics.probiotics.score} delay={800} />
                <BioticBar biotic="postbiotics" score={twin.biotics.postbiotics.score} delay={900} />
              </div>
            </div>

            {twin.nextBestAction && (
              <div className="eb-reveal mt-5 flex max-w-xl items-start gap-3 rounded-xl px-4 py-3 backdrop-blur" style={{ background: "rgba(245,166,35,0.09)", border: "1px solid rgba(245,166,35,0.3)", animationDelay: "1000ms" }}>
                <Target size={14} style={{ color: "#F5C518", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "#F5C518" }}>Your next best action</p>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(253,251,247,0.9)" }}>{twin.nextBestAction.action}</p>
                </div>
              </div>
            )}

            <div className="eb-reveal mt-6 flex flex-wrap gap-3" style={{ animationDelay: "1100ms" }}>
              {detailHref && (
                <Link href={detailHref} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)", boxShadow: "0 6px 24px rgba(76,182,72,0.35)" }}>
                  Open My Digital Twin <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {onAddMeal ? (
                <button type="button" onClick={onAddMeal} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10" style={{ border: "1px solid rgba(168,224,99,0.5)", color: "#A8E063" }}>
                  <Utensils className="h-4 w-4" /> Add Today&apos;s Meal
                </button>
              ) : (
                <Link href={addMealHref} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10" style={{ border: "1px solid rgba(168,224,99,0.5)", color: "#A8E063" }}>
                  <Utensils className="h-4 w-4" /> Add Today&apos;s Meal
                </Link>
              )}
              <ShareTwin twin={twin} visual={visual} />
              {demo && onSimulateMeal && (
                <button type="button" onClick={onSimulateMeal} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10" style={{ border: "1px solid rgba(245,197,24,0.5)", color: "#F5C518" }}>
                  <UtensilsCrossed className="h-4 w-4" /> Simulate a meal
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── dark-glass education panel: bottom sheet on mobile, inline on md+ ── */}
        {active && (
          <button
            type="button"
            aria-label="Close panel"
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
        )}
        {active && (
          <div
            key={active.key}
            className="eb-reveal fixed inset-x-0 bottom-0 z-50 max-h-[72vh] overflow-y-auto rounded-t-2xl bg-[rgba(253,251,247,0.07)] p-5 backdrop-blur-md max-md:bg-[#0E1B08F5] md:static md:z-auto md:mt-8 md:max-h-none md:overflow-visible md:rounded-2xl md:p-6"
            style={{ border: `1px solid color-mix(in srgb, ${HOTSPOT_COLOR[active.key]} 45%, transparent)` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: HOTSPOT_COLOR[active.key] }}>
                  Inside you · {active.label}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: HOTSPOT_COLOR[active.key], color: "#0B1607" }}>
                    {active.level} · {active.score}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(253,251,247,0.08)", border: "1px solid rgba(253,251,247,0.18)", color: "#A8E063" }}>
                    <Leaf size={11} /> Fed by {active.bioticLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                style={{ color: "rgba(253,251,247,0.6)", border: "1px solid rgba(253,251,247,0.2)" }}
              >
                <X size={13} />
              </button>
            </div>
            <div className="mt-3 h-[7px] max-w-md overflow-hidden rounded-full" style={{ background: "rgba(253,251,247,0.10)" }}>
              <div className="eb-shimmer h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(4, Math.min(100, active.score))}%`, backgroundColor: HOTSPOT_COLOR[active.key] }} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 md:gap-6">
              <p className="text-sm leading-relaxed" style={{ color: "rgba(253,251,247,0.85)" }}>{active.what}</p>
              <div className="flex items-start gap-2.5 self-start rounded-xl px-3.5 py-3" style={{ background: "rgba(253,251,247,0.06)", border: "1px solid rgba(253,251,247,0.14)" }}>
                <Target size={13} style={{ color: "#F5C518", flexShrink: 0, marginTop: 2 }} />
                <p className="text-sm leading-snug" style={{ color: "rgba(253,251,247,0.9)" }}>
                  <span className="font-semibold">Try this: </span>
                  {active.action}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px]" style={{ color: "rgba(253,251,247,0.4)" }}>
              EatoBiotics provides food-first guidance for general wellbeing and is not medical advice.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
