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
    <div className="my-12 overflow-hidden rounded-2xl bg-foreground">
      {/* Header — matches dark section pattern across the site */}
      <div className="px-6 pb-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="h-2 w-6 rounded-full bg-icon-lime" />
            <span className="h-2 w-4 rounded-full bg-icon-green" />
            <span className="h-2 w-3 rounded-full bg-icon-teal" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">
            Key Takeaways
          </p>
        </div>
        <p className="mt-2 font-serif text-xl font-semibold text-white">
          What to carry forward from this chapter
        </p>
      </div>

      {/* Gradient rule */}
      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(90deg, var(--icon-lime) 0%, var(--icon-green) 30%, var(--icon-teal) 60%, transparent 100%)",
        }}
      />

      {/* Items */}
      <ul>
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-4 border-b border-white/5 px-6 py-5 last:border-b-0"
          >
            <span
              className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: pillColors[i % pillColors.length] }}
            >
              {i + 1}
            </span>
            <p className="text-sm leading-[1.75] text-white/80">{item}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
