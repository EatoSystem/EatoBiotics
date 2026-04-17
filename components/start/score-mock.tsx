"use client"

import Link from "next/link"

const PILLARS = [
  { label: "Diversity",    score: 72, color: "var(--icon-lime)",   gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" },
  { label: "Biotics",      score: 65, color: "var(--icon-green)",  gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" },
  { label: "Consistency",  score: 55, color: "var(--icon-yellow)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" },
  { label: "Rhythm",       score: 48, color: "var(--icon-orange)", gradient: "linear-gradient(90deg, var(--icon-orange), var(--icon-yellow))" },
]

const RADIUS = 70
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const SCORE = 68
const DASH_OFFSET = CIRCUMFERENCE * (1 - SCORE / 100)

export function ScoreMock() {
  return (
    <div className="relative w-full rounded-3xl border border-border bg-background p-6 shadow-2xl shadow-black/10">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Food System Score
        </p>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Sample
        </span>
      </div>

      {/* Score ring */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <svg width="160" height="160" viewBox="0 0 180 180" className="-rotate-90">
            {/* Track */}
            <circle
              cx="90"
              cy="90"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-secondary"
            />
            {/* Progress */}
            <circle
              cx="90"
              cy="90"
              r={RADIUS}
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={DASH_OFFSET}
              style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--icon-lime)" />
                <stop offset="50%" stopColor="var(--icon-green)" />
                <stop offset="100%" stopColor="var(--icon-teal)" />
              </linearGradient>
            </defs>
          </svg>
          {/* Score label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-4xl font-bold text-foreground">{SCORE}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>
      </div>

      {/* Pillar bars */}
      <div className="space-y-3">
        {PILLARS.map((p) => (
          <div key={p.label}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">{p.label}</span>
              <span className="text-xs font-semibold" style={{ color: p.color }}>{p.score}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${p.score}%`,
                  background: p.gradient,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Blur overlay CTA */}
      <div className="relative mt-5 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[3px]" />
        <div className="relative z-20 flex items-center justify-center py-3">
          <Link
            href="/assessment"
            className="text-sm font-semibold"
            style={{ color: "var(--icon-green)" }}
          >
            See your actual score →
          </Link>
        </div>
        <div className="px-4 py-3 opacity-30 select-none" aria-hidden>
          <div className="h-2 w-full rounded bg-secondary" />
        </div>
      </div>
    </div>
  )
}
