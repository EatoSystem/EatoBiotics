import React from "react"

const pillColors = [
  "var(--icon-lime)",
  "var(--icon-green)",
  "var(--icon-teal)",
  "var(--icon-yellow)",
  "var(--icon-orange)",
]

function scoreBadgeColor(score: number): string {
  if (score >= 24) return "var(--icon-lime)"
  if (score >= 22) return "var(--icon-green)"
  if (score >= 20) return "var(--icon-teal)"
  if (score >= 15) return "var(--icon-yellow)"
  return "var(--icon-orange)"
}

/* ── RankedFood — individual row ────────────────────────────────────────── */

interface RankedFoodProps {
  rank: number
  name: string
  score: number
}

export function RankedFood({ children }: { children?: React.ReactNode } & RankedFoodProps) {
  return <>{children}</>
}

/* ── FoodRankingTable ───────────────────────────────────────────────────── */

interface FoodRankingTableProps {
  title?: string
  children: React.ReactNode
}

export function FoodRankingTable({
  title = "Top 20 EatoBiotics Index Foods",
  children,
}: FoodRankingTableProps) {
  // Extract RankedFood children
  const items: RankedFoodProps[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<RankedFoodProps>(child) && child.props.rank != null) {
      items.push({
        rank: child.props.rank,
        name: child.props.name,
        score: child.props.score,
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
          Rankings
        </p>
        <p className="mt-1.5 font-serif text-xl font-semibold text-foreground">{title}</p>
      </div>

      {/* Gradient rule below header */}
      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(90deg, var(--icon-lime) 0%, var(--icon-green) 40%, var(--icon-teal) 70%, transparent 100%)",
        }}
      />

      {/* Rows */}
      <ul>
        {items.map((item, i) => {
          const badgeColor = scoreBadgeColor(item.score)
          return (
            <li
              key={item.rank}
              className={`flex items-center gap-4 px-6 py-3 ${
                i < items.length - 1 ? "border-b border-border" : ""
              } ${i % 2 === 1 ? "bg-secondary/30" : ""}`}
            >
              {/* Rank circle */}
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-foreground"
                style={{ backgroundColor: pillColors[i % pillColors.length] }}
              >
                {item.rank}
              </span>

              {/* Food name */}
              <p className="flex-1 text-sm font-medium text-foreground">{item.name}</p>

              {/* Score badge */}
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: badgeColor }}
              >
                {item.score}/25
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
