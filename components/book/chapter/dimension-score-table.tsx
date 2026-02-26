import React from "react"

const scoreColors: Record<number, string> = {
  5: "var(--icon-green)",
  4: "var(--icon-teal)",
  3: "var(--icon-yellow)",
  2: "var(--icon-orange)",
  1: "var(--muted-foreground)",
}

const colorMap: Record<string, string> = {
  lime:   "var(--icon-lime)",
  green:  "var(--icon-green)",
  teal:   "var(--icon-teal)",
  yellow: "var(--icon-yellow)",
  orange: "var(--icon-orange)",
}

/* ── ScoreLevel — individual row inside DimensionScoreTable ─────────────── */

interface ScoreLevelProps {
  score: number
  level: string
  children: React.ReactNode
}

export function ScoreLevel({ children }: ScoreLevelProps) {
  // Rendering handled by parent — this is a data wrapper
  return <>{children}</>
}

/* ── DimensionScoreTable ────────────────────────────────────────────────── */

interface DimensionScoreTableProps {
  dimension: string
  icon?: string
  color?: "lime" | "green" | "teal" | "yellow" | "orange"
  description?: string
  children: React.ReactNode
}

export function DimensionScoreTable({
  dimension,
  icon,
  color = "green",
  description,
  children,
}: DimensionScoreTableProps) {
  const accent = colorMap[color]
  const accent2 = color === "yellow" || color === "orange" ? colorMap.orange : colorMap.teal

  // Extract ScoreLevel children
  const items: { score: number; level: string; content: React.ReactNode }[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<ScoreLevelProps>(child) && child.props.score != null) {
      items.push({
        score: child.props.score,
        level: child.props.level,
        content: child.props.children,
      })
    }
  })

  return (
    <div className="relative my-10 overflow-hidden rounded-2xl border border-border bg-background">
      {/* Top gradient accent */}
      <div
        className="h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent2}, transparent)` }}
      />

      {/* Header */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-xl" aria-hidden>
              {icon}
            </span>
          )}
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: accent }}
            >
              Scoring Dimension
            </p>
            <h4 className="font-serif text-lg font-semibold text-foreground">{dimension}</h4>
          </div>
        </div>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Gradient rule below header */}
      <div
        className="h-px"
        style={{
          background: `linear-gradient(90deg, ${accent}, ${accent2} 60%, transparent 100%)`,
        }}
      />

      {/* Score rows */}
      <ul>
        {items.map((item, i) => {
          const dotColor = scoreColors[item.score] ?? "var(--muted-foreground)"
          return (
            <li
              key={item.score}
              className={`flex items-start gap-4 px-6 py-3.5 ${
                i < items.length - 1 ? "border-b border-border" : ""
              }`}
            >
              {/* Score circle */}
              <span
                className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: dotColor }}
              >
                {item.score}
              </span>

              <div className="flex-1 min-w-0">
                {/* Level label */}
                <p className="text-sm font-semibold text-foreground">{item.level}</p>
                {/* Description */}
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                  {item.content}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
