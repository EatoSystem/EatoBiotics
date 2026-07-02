"use client"

/**
 * Journey — "Your journey so far": the member's score story as an area chart.
 *
 * Baseline → meal signals over time → today, drawn as a pure SVG (no chart
 * lib), with milestone dots from lib/account/milestones. Educational and
 * celebratory — this is the pride section of the twin page.
 */

import { useMemo, useState } from "react"
import { Sparkles } from "lucide-react"
import { detectMilestones } from "@/lib/account/milestones"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

interface Point {
  t: number
  score: number
  label: string
}

function buildPoints(twin: FoodSystemDigitalTwin): Point[] {
  const pts: Point[] = [
    { t: twin.baseline.createdAt, score: Math.round(twin.baseline.foodSystemScore.value), label: "We met — your baseline" },
  ]
  for (const o of twin.observations) {
    if (o.kind !== "meal_description" && o.kind !== "meal_photo") continue
    const s = Number((o.meta as { score?: number } | undefined)?.score ?? 0)
    if (s > 0) pts.push({ t: o.createdAt, score: s, label: String(o.value) })
  }
  pts.push({ t: twin.updatedAt, score: Math.round(twin.currentScore.value), label: "Today" })
  return pts.sort((a, b) => a.t - b.t)
}

export function Journey({ twin, streak = 0 }: { twin: FoodSystemDigitalTwin; streak?: number }) {
  const points = useMemo(() => buildPoints(twin), [twin])
  const milestones = useMemo(() => detectMilestones(twin, streak), [twin, streak])
  const [hover, setHover] = useState<number | null>(null)

  if (points.length < 2) return null

  const w = 720
  const h = 190
  const minT = points[0].t
  const spanT = Math.max(1, points[points.length - 1].t - minT)
  const scores = points.map((p) => p.score)
  const min = Math.max(0, Math.min(...scores) - 8)
  const max = Math.min(100, Math.max(...scores) + 8)
  const spanS = Math.max(1, max - min)
  const xy = points.map((p) => [
    16 + ((p.t - minT) / spanT) * (w - 32),
    h - 30 - ((p.score - min) / spanS) * (h - 60),
  ])
  const path = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const [ex] = xy[xy.length - 1]
  const active = hover != null ? points[hover] : null

  return (
    <section className="mx-auto max-w-5xl px-4 pt-8 md:px-8">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Journey</p>
        <h3 className="mt-1 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>Your journey so far</h3>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
        <svg viewBox={`0 0 ${w} ${h}`} className="block w-full">
          <defs>
            <linearGradient id="journey-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(76,182,72,0.20)" />
              <stop offset="100%" stopColor="rgba(76,182,72,0)" />
            </linearGradient>
          </defs>
          <path d={`${path} L${ex},${h - 16} L16,${h - 16} Z`} fill="url(#journey-fill)" />
          <path d={path} fill="none" stroke="#4CB648" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {xy.map(([x, y], i) => {
            const first = i === 0
            const last = i === xy.length - 1
            return (
              <g key={i}>
                <circle
                  cx={x} cy={y}
                  r={first || last ? 6 : 4}
                  fill={first ? "#9aa88f" : last ? "#F5A623" : "#4CB648"}
                  stroke="white" strokeWidth={1.5}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setHover(hover === i ? null : i)}
                />
                {(first || last) && (
                  <text x={x} y={y - 12} textAnchor={first ? "start" : "end"} fontSize={11} fontWeight={800} fill={first ? "#7a8a70" : "#a05a0a"}>
                    {points[i].score}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* hover/tap detail */}
        <p className="mt-1 min-h-[20px] text-xs" style={{ color: "var(--muted-foreground)" }}>
          {active
            ? `${new Date(active.t).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${active.label} · score ${active.score}`
            : "Baseline → every meal signal → today. Tap a point for its story."}
        </p>

        {/* milestone chips */}
        {milestones.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            {milestones.slice(0, 4).map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "color-mix(in srgb, var(--icon-green) 10%, white)", border: "1px solid var(--border)", color: "var(--icon-green)" }} title={m.detail}>
                <Sparkles size={10} /> {m.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
