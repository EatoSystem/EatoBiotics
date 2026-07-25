"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { computeGutTrend, type ScorePoint } from "@/lib/account/gut-trend"

/* ── Gut Trend card ───────────────────────────────────────────────────────
   Shows a member their biotics score over time — the single most motivating
   view for a health product, and built entirely from data we already store
   (the `analyses` rows). Renders nothing until there are ≥ 3 days of history,
   so it only appears once it has something honest to say.

   Hand-rolled SVG in the same visual language as the GLP-1 weight-trend chart
   (CSS-var theming, area + line, a single 'now' dot).
──────────────────────────────────────────────────────────────────────── */

export function GutTrend({ history }: { history: ScorePoint[] }) {
  const trend = computeGutTrend(history)
  if (!trend) return null

  const { points, current, delta, weekDelta, direction } = trend
  const n = points.length

  // Geometry
  const W = 400, H = 130, padX = 14, padTop = 16, padBot = 22
  const innerW = W - padX * 2, innerH = H - padTop - padBot
  const vals = points.map((p) => p.score)
  let lo = Math.min(...vals), hi = Math.max(...vals)
  const padV = (hi - lo) * 0.18 || 6
  lo = Math.max(0, lo - padV)
  hi = Math.min(100, hi + padV)
  if (lo === hi) { lo = Math.max(0, lo - 5); hi = Math.min(100, hi + 5) }

  const x = (i: number) => padX + (innerW * i) / (n - 1)
  const y = (v: number) => padTop + innerH * (1 - (v - lo) / (hi - lo))
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.score).toFixed(1)}`).join(" ")
  const area = `${line} L ${x(n - 1).toFixed(1)} ${(H - padBot).toFixed(1)} L ${x(0).toFixed(1)} ${(H - padBot).toFixed(1)} Z`

  const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })

  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus
  const trendColor = direction === "up" ? "var(--icon-green)" : direction === "down" ? "var(--icon-orange)" : "var(--muted-foreground)"

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your gut trend</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold" style={{ color: trendColor }}>
            <Icon size={15} />
            {direction === "up" ? "Trending up" : direction === "down" ? "Easing off" : "Holding steady"}
            {delta !== 0 && (
              <span className="text-muted-foreground">
                · {delta > 0 ? "+" : ""}{delta} over {n} day{n !== 1 ? "s" : ""}
              </span>
            )}
          </p>
          {weekDelta != null && weekDelta !== 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {weekDelta > 0 ? "+" : ""}{weekDelta} vs last week
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="font-serif text-2xl font-bold text-foreground">{current}</span>
          <span className="ml-1 text-xs text-muted-foreground">now</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`Biotics score over the last ${n} days, currently ${current}`}>
        <defs>
          <linearGradient id="gutTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--icon-green)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--icon-green)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#gutTrendFill)" />
        <path d={line} fill="none" stroke="var(--icon-green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(n - 1)} cy={y(current)} r="3.6" fill="var(--icon-green)" />
      </svg>

      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{fmt(points[0].date)}</span>
        <span>{fmt(points[n - 1].date)}</span>
      </div>
    </div>
  )
}
