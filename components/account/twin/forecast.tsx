"use client"

/**
 * ForecastCard — the what-if score projector.
 *
 * Toggle up to three habits and watch the 4-week projected curve animate from
 * the member's real current levels (pure math in lib/account/forecast — no AI,
 * no backend). Honest framing is part of the component: this is an educational
 * estimate, never a promise.
 */

import { useMemo, useState } from "react"
import Image from "next/image"
import { Check } from "lucide-react"
import { FORECAST_HABITS, projectScore, type HabitSelection } from "@/lib/account/forecast"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

const HABIT_COLOR: Record<string, string> = { fermented: "#2DAA6E", plants: "#A8E063", logging: "#F5C518" }

/* Where each projected biotic lights the preview body (% of the mini stage). */
const FORECAST_NODE = {
  probiotics: { x: 54, y: 54, color: "#2DAA6E" }, // gut — fermented
  prebiotics: { x: 47, y: 62, color: "#A8E063" },  // lower gut — plants
  postbiotics: { x: 48, y: 44, color: "#F5C518" }, // core — the give-back
} as const

/** The preview body: brighter aura + pathway nodes lit by the *projected*
    4-week biotics, so a better choice visibly strengthens the Food System. */
function ForecastFigure({ biotics, projected, now, figureSrc }: {
  biotics: { prebiotics: number; probiotics: number; postbiotics: number }
  projected: number
  now: number
  figureSrc: string
}) {
  const lift = Math.max(0, projected - now) // 0..~30
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[200px]">
      <div className="absolute left-1/2 top-1/2 h-[94%] w-[94%] rounded-full" style={{ transform: "translate(-50%,-50%)", background: "radial-gradient(circle, #FDFBF7 0%, #FDFBF7 55%, rgba(253,251,247,0) 76%)" }} />
      {/* aura brightens with the projected overall gain */}
      <div className="eb-aura absolute left-1/2 top-1/2 h-full w-full rounded-full" style={{ transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(168,224,99,0.55) 0%, rgba(245,197,24,0.4) 45%, transparent 72%)", opacity: 0.55 + Math.min(0.4, lift / 60), transition: "opacity .6s" }} />
      <Image src={figureSrc} alt="" width={200} height={200} sizes="200px" className="absolute left-1/2 top-1/2 h-[74%] w-[74%] object-contain" style={{ transform: "translate(-50%,-50%)", mixBlendMode: "multiply" }} />
      {(Object.keys(FORECAST_NODE) as Array<keyof typeof FORECAST_NODE>).map((k) => {
        const node = FORECAST_NODE[k]
        const level = biotics[k] // 0..100
        const strong = level >= 55
        return (
          <span key={k} aria-hidden className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
            <span className="relative flex h-6 w-6 items-center justify-center">
              {strong && <span className="eb-ping absolute inline-flex h-full w-full rounded-full" style={{ background: node.color, opacity: 0.5 }} />}
              <span className="relative inline-flex rounded-full" style={{ height: 6 + (level / 100) * 8, width: 6 + (level / 100) * 8, background: node.color, boxShadow: `0 0 ${4 + (level / 100) * 14}px ${node.color}cc`, opacity: 0.4 + (level / 100) * 0.6, transition: "all .6s" }} />
            </span>
          </span>
        )
      })}
    </div>
  )
}

function Curve({ weeks, now }: { weeks: number[]; now: number }) {
  const w = 560
  const h = 150
  const min = Math.max(0, Math.min(now, ...weeks) - 6)
  const max = Math.min(100, Math.max(...weeks) + 6)
  const span = Math.max(1, max - min)
  const xy = weeks.map((v, i) => [
    12 + (i / (weeks.length - 1)) * (w - 24),
    h - 24 - ((v - min) / span) * (h - 44),
  ])
  const path = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const [ex, ey] = xy[xy.length - 1]
  const flat = weeks.every((v) => v === weeks[0])

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block w-full" aria-hidden>
      <defs>
        <linearGradient id="forecast-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(76,182,72,0.22)" />
          <stop offset="100%" stopColor="rgba(76,182,72,0)" />
        </linearGradient>
      </defs>
      {/* baseline (today's score) */}
      <line x1={12} x2={w - 12} y1={xy[0][1]} y2={xy[0][1]} stroke="var(--border)" strokeWidth={1} strokeDasharray="4 4" />
      <path d={`${path} L${ex},${h - 12} L12,${h - 12} Z`} fill="url(#forecast-fill)" style={{ transition: "d .6s" }} />
      <path d={path} fill="none" stroke={flat ? "#9aa88f" : "#4CB648"} strokeWidth={2.5} strokeLinecap="round" style={{ transition: "d .6s" }} />
      {xy.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 5 : 3} fill={i === 0 ? "#9aa88f" : flat ? "#9aa88f" : i === xy.length - 1 ? "#F5A623" : "#4CB648"} style={{ transition: "cy .6s" }} />
      ))}
      {/* week labels */}
      {["Now", "W1", "W2", "W3", "W4"].map((l, i) => (
        <text key={l} x={xy[i][0]} y={h - 2} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--muted-foreground)">{l}</text>
      ))}
      <text x={ex} y={ey - 12} textAnchor="middle" fontSize={15} fontWeight={800} fill={flat ? "#9aa88f" : "#F5A623"} style={{ transition: "y .6s" }}>{weeks[weeks.length - 1]}</text>
    </svg>
  )
}

export function ForecastCard({ twin, figureSrc = "/images/couple-hero.png" }: { twin: FoodSystemDigitalTwin; figureSrc?: string }) {
  const [habits, setHabits] = useState<HabitSelection>({})
  const forecast = useMemo(() => projectScore(twin, habits), [twin, habits])
  const now = Math.round(twin.currentScore.value)
  const anyOn = Object.values(habits).some(Boolean)

  return (
    <section className="mx-auto max-w-5xl px-4 pt-8 md:px-8">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>What if…</p>
        <h3 className="mt-1 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>Try a habit on your Food System first.</h3>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Toggle a habit and see how your next four weeks could move.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
        <div className="flex flex-wrap gap-2">
          {FORECAST_HABITS.map((hb) => {
            const on = habits[hb.key] === true
            const c = HABIT_COLOR[hb.key]
            return (
              <button
                key={hb.key}
                type="button"
                onClick={() => setHabits((h) => ({ ...h, [hb.key]: !h[hb.key] }))}
                aria-pressed={on}
                title={hb.why}
                className="flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold transition-all"
                style={{
                  background: on ? c : "var(--muted)",
                  color: on ? "white" : "var(--muted-foreground)",
                  border: `1px solid ${on ? c : "var(--border)"}`,
                  boxShadow: on ? `0 4px 14px ${c}44` : "none",
                }}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ background: on ? "rgba(255,255,255,0.25)" : "transparent", border: on ? "none" : "1.5px solid var(--border)" }}>
                  {on && <Check size={10} />}
                </span>
                {hb.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[200px_1fr] md:items-center">
          {/* the preview body — brightens with a better projected day */}
          <div>
            <ForecastFigure biotics={forecast.biotics} projected={forecast.projected} now={now} figureSrc={figureSrc} />
            <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: anyOn && forecast.gain > 0 ? "var(--icon-green)" : "var(--muted-foreground)" }}>
              {anyOn && forecast.gain > 0 ? "Your Food System in 4 weeks" : "Your Food System today"}
            </p>
          </div>
          <Curve weeks={forecast.weeks} now={now} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {anyOn && forecast.gain > 0 ? (
              <>Projected: <span style={{ color: "var(--icon-green)" }}>{now} → {forecast.projected}</span> in 4 weeks (+{forecast.gain})</>
            ) : (
              <>Holding at {now} — pick a habit to see it move.</>
            )}
          </p>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          An educational estimate from your current levels — not a promise, and not medical advice. Real change comes from the meals themselves.
        </p>
      </div>
    </section>
  )
}
