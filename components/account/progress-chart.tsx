"use client"

interface PillarScores {
  diversity: number
  feeding: number
  adding: number
  consistency: number
  feeling: number
  overall: number
}

interface ProgressChartProps {
  current: PillarScores
  previous?: PillarScores | null
}

const PILLARS = [
  { key: "diversity" as const, label: "Plant Diversity", color: "var(--icon-lime)" },
  { key: "feeding" as const, label: "Feeding", color: "var(--icon-green)" },
  { key: "adding" as const, label: "Live Foods", color: "var(--icon-teal)" },
  { key: "consistency" as const, label: "Consistency", color: "var(--icon-yellow)" },
  { key: "feeling" as const, label: "Feeling", color: "var(--icon-orange)" },
]

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
        →0
      </span>
    )
  }
  const positive = delta > 0
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{
        background: positive ? "color-mix(in srgb, var(--icon-lime) 15%, transparent)" : "color-mix(in srgb, var(--icon-orange) 15%, transparent)",
        color: positive ? "var(--icon-green)" : "var(--icon-orange)",
      }}
    >
      {positive ? "▲" : "▼"} {positive ? "+" : ""}{delta}
    </span>
  )
}

function PillarBar({
  label,
  score,
  color,
  maxScore = 100,
}: {
  label: string
  score: number
  color: string
  maxScore?: number
}) {
  const pct = Math.min(100, Math.round((score / maxScore) * 100))
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="w-8 text-left text-sm font-semibold tabular-nums text-foreground">{score}</span>
    </div>
  )
}

export function ProgressChart({ current, previous }: ProgressChartProps) {
  const hasPrevious = !!previous

  if (hasPrevious && previous) {
    const overallDelta = current.overall - previous.overall

    return (
      <div className="space-y-6">
        {/* Overall comparison */}
        <div className="flex items-center gap-6 rounded-2xl border bg-card p-5">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold tabular-nums" style={{ color: "var(--icon-green)" }}>
              {current.overall}
            </span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Current</span>
          </div>
          <div className="flex flex-col items-center">
            <DeltaBadge delta={overallDelta} />
            <span className="mt-1 text-xs text-muted-foreground">vs prev.</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold tabular-nums text-muted-foreground/60">
              {previous.overall}
            </span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Previous</span>
          </div>
        </div>

        {/* Pillar comparison */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Pillar Breakdown</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-4 rounded-full" style={{ background: "var(--icon-green)" }} />
                Current
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-4 rounded-full bg-muted" />
                Previous
              </span>
            </div>
          </div>
          <div className="space-y-5">
            {PILLARS.map(({ key, label, color }) => {
              const curr = current[key]
              const prev = previous[key]
              const delta = curr - prev
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{label}</span>
                    <DeltaBadge delta={delta} />
                  </div>
                  {/* Current bar */}
                  <div className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-right text-[10px] text-muted-foreground">Current</span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, curr)}%`, background: color }}
                      />
                    </div>
                    <span className="w-7 text-left text-xs font-semibold tabular-nums text-foreground">{curr}</span>
                  </div>
                  {/* Previous bar */}
                  <div className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-right text-[10px] text-muted-foreground">Previous</span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, prev)}%`, background: "color-mix(in srgb, currentColor 30%, var(--muted))", opacity: 0.5 }}
                      />
                    </div>
                    <span className="w-7 text-left text-xs font-semibold tabular-nums text-muted-foreground">{prev}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // No previous: simple current bars
  return (
    <div className="rounded-2xl border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Pillar Scores</h3>
      <div className="space-y-3">
        {PILLARS.map(({ key, label, color }) => (
          <PillarBar key={key} label={label} score={current[key]} color={color} />
        ))}
      </div>
    </div>
  )
}
