import React from "react"

const colorMap: Record<string, string> = {
  lime:   "var(--icon-lime)",
  green:  "var(--icon-green)",
  teal:   "var(--icon-teal)",
  yellow: "var(--icon-yellow)",
  orange: "var(--icon-orange)",
}

/* ── ScoreBand — individual row ─────────────────────────────────────────── */

interface ScoreBandProps {
  range: string
  rating: string
  action: string
  examples: string
  color?: "lime" | "green" | "teal" | "yellow" | "orange"
}

export function ScoreBand({ children }: { children?: React.ReactNode } & ScoreBandProps) {
  return <>{children}</>
}

/* ── ScoreCheatSheet ────────────────────────────────────────────────────── */

interface ScoreCheatSheetProps {
  children: React.ReactNode
}

export function ScoreCheatSheet({ children }: ScoreCheatSheetProps) {
  const items: ScoreBandProps[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<ScoreBandProps>(child) && child.props.range != null) {
      items.push({
        range: child.props.range,
        rating: child.props.rating,
        action: child.props.action,
        examples: child.props.examples,
        color: child.props.color,
      })
    }
  })

  return (
    <div className="relative my-10 overflow-hidden rounded-2xl border border-border bg-background">
      {/* Full brand gradient top accent */}
      <div
        className="h-0.5 w-full"
        style={{
          background:
            "linear-gradient(90deg, var(--icon-lime) 0%, var(--icon-green) 25%, var(--icon-teal) 50%, var(--icon-yellow) 75%, var(--icon-orange) 100%)",
        }}
      />

      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-icon-green">
          Quick Reference
        </p>
        <p className="mt-1.5 font-serif text-xl font-semibold text-foreground">
          EatoBiotics Index Cheat Sheet
        </p>
      </div>

      {/* Gradient rule below header */}
      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(90deg, var(--icon-lime) 0%, var(--icon-green) 40%, var(--icon-teal) 70%, transparent 100%)",
        }}
      />

      {/* Bands */}
      <ul>
        {items.map((item, i) => {
          const accent = colorMap[item.color ?? "green"]
          return (
            <li
              key={item.range}
              className={`px-6 py-4 ${i < items.length - 1 ? "border-b border-border" : ""}`}
              style={{ borderLeftWidth: "4px", borderLeftColor: accent }}
            >
              <div className="flex flex-wrap items-center gap-3">
                {/* Score range badge */}
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: accent }}
                >
                  {item.range}
                </span>

                {/* Rating */}
                <span className="text-sm font-bold" style={{ color: accent }}>
                  {item.rating}
                </span>
              </div>

              {/* Action */}
              <p className="mt-1.5 text-sm font-medium text-foreground">{item.action}</p>

              {/* Examples */}
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                {item.examples}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
