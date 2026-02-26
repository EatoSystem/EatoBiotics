import React from "react"

const scoreColors: Record<number, string> = {
  5: "var(--icon-green)",
  4: "var(--icon-teal)",
  3: "var(--icon-yellow)",
  2: "var(--icon-orange)",
  1: "var(--muted-foreground)",
}

const ratingConfig: Record<string, { color: string; bg: string }> = {
  Exceptional: { color: "var(--icon-green)",  bg: "rgba(76,182,72,0.12)" },
  Excellent:   { color: "var(--icon-teal)",   bg: "rgba(45,170,110,0.12)" },
  Good:        { color: "var(--icon-yellow)", bg: "rgba(245,197,24,0.12)" },
  Fair:        { color: "var(--icon-orange)", bg: "rgba(245,166,35,0.12)" },
  Poor:        { color: "var(--muted-foreground)", bg: "rgba(90,110,80,0.08)" },
}

/* ── ScoreDimension — individual row ────────────────────────────────────── */

interface ScoreDimensionProps {
  dimension: string
  score: number
  children: React.ReactNode
}

export function ScoreDimension({ children }: ScoreDimensionProps) {
  return <>{children}</>
}

/* ── FoodScoreCard ──────────────────────────────────────────────────────── */

interface FoodScoreCardProps {
  name: string
  emoji?: string
  total: number
  rating: string
  summary?: string
  children: React.ReactNode
}

export function FoodScoreCard({
  name,
  emoji,
  total,
  rating,
  summary,
  children,
}: FoodScoreCardProps) {
  const cfg = ratingConfig[rating] ?? ratingConfig.Good

  // Extract ScoreDimension children
  const items: { dimension: string; score: number; rationale: React.ReactNode }[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<ScoreDimensionProps>(child) && child.props.score != null) {
      items.push({
        dimension: child.props.dimension,
        score: child.props.score,
        rationale: child.props.children,
      })
    }
  })

  return (
    <div className="relative my-10 overflow-hidden rounded-2xl border border-border bg-background">
      {/* Top gradient accent using rating colour */}
      <div
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${cfg.color}, var(--icon-teal), transparent)`,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-3">
        <div className="flex items-center gap-3">
          {emoji && (
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-secondary text-2xl" aria-hidden>
              {emoji}
            </div>
          )}
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: cfg.color }}
            >
              Food Score
            </p>
            <h4 className="font-serif text-base font-semibold text-foreground">{name}</h4>
          </div>
        </div>

        {/* Total score — large gradient number */}
        <div className="text-right flex-shrink-0">
          <div
            className="font-serif text-3xl font-bold leading-none sm:text-4xl"
            style={{
              backgroundImage: `linear-gradient(135deg, ${cfg.color}, var(--icon-teal))`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {total}/25
          </div>
        </div>
      </div>

      {/* Gradient rule */}
      <div
        className="h-px"
        style={{
          background: `linear-gradient(90deg, ${cfg.color} 0%, var(--icon-teal) 60%, transparent 100%)`,
        }}
      />

      {/* Dimension rows */}
      <ul>
        {items.map((item, i) => {
          const barColor = scoreColors[item.score] ?? "var(--muted-foreground)"
          return (
            <li
              key={item.dimension}
              className={`px-6 py-3 ${i < items.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex items-center gap-3">
                {/* Dimension label */}
                <p className="w-[130px] flex-shrink-0 text-xs font-medium text-muted-foreground sm:w-[150px]">
                  {item.dimension}
                </p>

                {/* Score dots */}
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="h-3 w-3 rounded-full sm:h-3.5 sm:w-3.5"
                      style={{
                        backgroundColor: n <= item.score ? barColor : "var(--border)",
                      }}
                    />
                  ))}
                </div>

                {/* Score number */}
                <span
                  className="text-sm font-bold"
                  style={{ color: barColor }}
                >
                  {item.score}
                </span>
              </div>

              {/* Rationale */}
              <p className="mt-1 pl-[130px] text-[12px] leading-relaxed text-muted-foreground sm:pl-[150px]">
                {item.rationale}
              </p>
            </li>
          )
        })}
      </ul>

      {/* Footer — total + rating badge */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5"
        style={{ backgroundColor: cfg.bg }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: cfg.color }}
          >
            {rating}
          </span>
          <span className="text-sm font-semibold text-foreground">{total}/25</span>
        </div>
        {summary && (
          <p className="text-[13px] leading-relaxed text-muted-foreground">{summary}</p>
        )}
      </div>
    </div>
  )
}
