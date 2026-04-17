"use client"

import Link from "next/link"

const PILLARS = [
  { label: "Anti-Inflammatory", score: 65, color: "var(--icon-lime)",   gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))"  },
  { label: "Gut Diversity",     score: 62, color: "var(--icon-teal)",   gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))"   },
  { label: "Brain Biotics",     score: 53, color: "var(--icon-green)",  gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))"   },
  { label: "Serotonin Foods",   score: 48, color: "var(--icon-yellow)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-teal))"  },
]

const RADIUS = 70
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const SCORE = 59
const DASH_OFFSET = CIRCUMFERENCE * (1 - SCORE / 100)

export function ScoreMockMind() {
  return (
    <div className="relative w-full rounded-3xl border border-border bg-background p-6 shadow-2xl shadow-black/10">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Gut-Brain Score
        </p>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Sample
        </span>
      </div>

      <div className="flex justify-center mb-6">
        <div className="relative">
          <svg width="160" height="160" viewBox="0 0 180 180" className="-rotate-90">
            <circle cx="90" cy="90" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="12" className="text-secondary" />
            <circle
              cx="90" cy="90" r={RADIUS} fill="none"
              stroke="url(#mindScoreGradient)"
              strokeWidth="12" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={DASH_OFFSET}
              style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
            />
            <defs>
              <linearGradient id="mindScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--icon-teal)" />
                <stop offset="50%" stopColor="var(--icon-green)" />
                <stop offset="100%" stopColor="var(--icon-lime)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-4xl font-bold text-foreground">{SCORE}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {PILLARS.map((p) => (
          <div key={p.label}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">{p.label}</span>
              <span className="text-xs font-semibold" style={{ color: p.color }}>{p.score}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full" style={{ width: `${p.score}%`, background: p.gradient }} />
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-5 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[3px]" />
        <div className="relative z-20 flex items-center justify-center py-3">
          <Link href="/assessment-mind" className="text-sm font-semibold" style={{ color: "var(--icon-teal)" }}>
            See your actual Gut-Brain Score →
          </Link>
        </div>
        <div className="px-4 py-3 opacity-30 select-none" aria-hidden>
          <div className="h-2 w-full rounded bg-secondary" />
        </div>
      </div>
    </div>
  )
}
