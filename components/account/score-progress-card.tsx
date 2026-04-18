"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"

/* ── Score Progress Card ────────────────────────────────────────────────
   Shown on the Overview tab when a user has taken the assessment twice.
   The most powerful retention story the product can tell.
────────────────────────────────────────────────────────────────────── */

const PILLAR_LABELS: Record<string, string> = {
  diversity:   "Plant Diversity",
  feeding:     "Feeding",
  adding:      "Live Foods",
  consistency: "Consistency",
  feeling:     "Feeling",
}

const PILLAR_COLORS: Record<string, string> = {
  diversity:   "var(--icon-lime)",
  feeding:     "var(--icon-green)",
  adding:      "var(--icon-teal)",
  consistency: "var(--icon-yellow)",
  feeling:     "var(--icon-orange)",
}

interface ScoreProgressCardProps {
  previousScore: number
  currentScore: number
  previousSubScores: Record<string, number>
  currentSubScores: Record<string, number>
  previousDate: string
  currentDate: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })
}

export function ScoreProgressCard({
  previousScore,
  currentScore,
  previousSubScores,
  currentSubScores,
  previousDate,
  currentDate,
}: ScoreProgressCardProps) {
  const delta = Math.round(currentScore) - Math.round(previousScore)
  const improved = delta > 0
  const unchanged = delta === 0

  const pillars = ["diversity", "feeding", "adding", "consistency", "feeling"]
  const pillarDeltas = pillars.map((key) => ({
    key,
    prev: Math.round(previousSubScores[key] ?? 0),
    curr: Math.round(currentSubScores[key] ?? 0),
    delta: Math.round((currentSubScores[key] ?? 0) - (previousSubScores[key] ?? 0)),
  }))

  const biggestGain = [...pillarDeltas].sort((a, b) => b.delta - a.delta)[0]
  const biggestGainIsPositive = biggestGain.delta > 0

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      {/* Gradient top strip */}
      <div
        className="h-1 w-full"
        style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Your Progress
            </p>
            <h3 className="font-serif text-lg font-semibold text-foreground leading-tight">
              {improved
                ? `You've improved ${delta} point${Math.abs(delta) !== 1 ? "s" : ""} since your last assessment`
                : unchanged
                ? "Your score is holding steady"
                : `Your score shifted ${Math.abs(delta)} point${Math.abs(delta) !== 1 ? "s" : ""} — here's where to focus`}
            </h3>
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-center gap-1.5 justify-end">
              {improved ? (
                <TrendingUp size={16} style={{ color: "var(--icon-green)" }} />
              ) : unchanged ? (
                <Minus size={16} className="text-muted-foreground" />
              ) : (
                <TrendingDown size={16} style={{ color: "var(--icon-orange)" }} />
              )}
              <span
                className="text-2xl font-bold tabular-nums"
                style={{ color: improved ? "var(--icon-green)" : unchanged ? "var(--icon-teal)" : "var(--icon-orange)" }}
              >
                {delta > 0 ? "+" : ""}{delta}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">pts overall</p>
          </div>
        </div>

        {/* Score comparison bar */}
        <div className="mb-5 rounded-xl bg-secondary/40 p-4">
          <div className="flex items-center justify-between gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-muted-foreground">{Math.round(previousScore)}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDate(previousDate)}</p>
            </div>
            {/* Arrow */}
            <div className="flex-1 flex items-center gap-1.5">
              <div className="h-px flex-1 bg-border" />
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                style={{
                  background: improved
                    ? "var(--icon-green)"
                    : unchanged
                    ? "var(--icon-teal)"
                    : "var(--icon-orange)",
                }}
              >
                →
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="text-center">
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: improved ? "var(--icon-green)" : unchanged ? "var(--foreground)" : "var(--icon-orange)" }}
              >
                {Math.round(currentScore)}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDate(currentDate)}</p>
            </div>
          </div>
        </div>

        {/* Pillar breakdown */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pillar changes</p>
          {pillarDeltas.map(({ key, prev, curr, delta: d }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-[110px] shrink-0 text-xs text-muted-foreground">{PILLAR_LABELS[key]}</span>
              {/* Bar: previous */}
              <div className="flex-1 relative h-1.5 rounded-full bg-secondary">
                {/* Previous score bar (muted) */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full opacity-30"
                  style={{ width: `${prev}%`, background: PILLAR_COLORS[key] }}
                />
                {/* Current score bar */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${curr}%`, background: PILLAR_COLORS[key] }}
                />
              </div>
              <div className="w-16 shrink-0 flex items-center justify-end gap-1">
                <span className="text-xs font-semibold tabular-nums text-foreground">{curr}</span>
                {d !== 0 && (
                  <span
                    className="text-[10px] font-bold tabular-nums"
                    style={{ color: d > 0 ? "var(--icon-green)" : "var(--icon-orange)" }}
                  >
                    {d > 0 ? "+" : ""}{d}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Insight call-out */}
        {biggestGainIsPositive && (
          <div
            className="mt-4 rounded-xl px-4 py-3 text-xs leading-relaxed"
            style={{
              background: `color-mix(in srgb, ${PILLAR_COLORS[biggestGain.key]} 8%, transparent)`,
              borderLeft: `3px solid ${PILLAR_COLORS[biggestGain.key]}`,
            }}
          >
            <span className="font-semibold text-foreground">{PILLAR_LABELS[biggestGain.key]}</span>
            <span className="text-muted-foreground">
              {" "}is your biggest mover — up {biggestGain.delta} points. That&apos;s a measurable shift in your gut system.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
