import React from "react"

const pillColors = [
  "var(--icon-lime)",
  "var(--icon-green)",
  "var(--icon-teal)",
  "var(--icon-yellow)",
  "var(--icon-orange)",
]

// Individual takeaway item — used inside <ChapterKeyTakeaways> in MDX
export function Takeaway({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

interface ChapterKeyTakeawaysProps {
  children: React.ReactNode
}

export function ChapterKeyTakeaways({ children }: ChapterKeyTakeawaysProps) {
  const items: React.ReactNode[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      items.push((child.props as { children?: React.ReactNode }).children ?? child)
    } else if (child !== null && child !== undefined) {
      items.push(child)
    }
  })

  return (
    <div className="relative my-12 overflow-hidden rounded-2xl border border-border bg-background">
      {/* Thin full-width brand gradient top accent — matches other cards */}
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
          Key Takeaways
        </p>
        <p className="mt-1.5 font-serif text-xl font-semibold text-foreground">
          What to carry forward from this chapter
        </p>
      </div>

      {/* Brand gradient rule below header */}
      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(90deg, var(--icon-lime) 0%, var(--icon-green) 40%, var(--icon-teal) 70%, transparent 100%)",
        }}
      />

      {/* Items */}
      <ul>
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-4 border-b border-border px-6 py-4 last:border-b-0"
          >
            <span
              className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-foreground"
              style={{ backgroundColor: pillColors[i % pillColors.length] }}
            >
              {i + 1}
            </span>
            <p className="text-sm leading-[1.75] text-foreground">{item}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
