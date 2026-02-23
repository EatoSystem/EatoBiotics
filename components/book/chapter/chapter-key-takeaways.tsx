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
  // Acts as a marker element; ChapterKeyTakeaways will collect these
  return <>{children}</>
}

interface ChapterKeyTakeawaysProps {
  children: React.ReactNode
}

export function ChapterKeyTakeaways({ children }: ChapterKeyTakeawaysProps) {
  // Collect all Takeaway children into an array
  const items: React.ReactNode[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      items.push(child.props.children ?? child)
    } else if (child !== null && child !== undefined) {
      items.push(child)
    }
  })

  return (
    <div className="my-10 overflow-hidden rounded-2xl border border-border bg-background">
      {/* Gradient header */}
      <div
        className="px-6 py-5"
        style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-white">Key Takeaways</p>
        <p className="mt-0.5 text-sm text-white/80">What to carry forward from this chapter</p>
      </div>

      {/* Items */}
      <ul className="divide-y divide-border">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-4 px-6 py-4">
            <span
              className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: pillColors[i % pillColors.length] }}
            >
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-foreground">{item}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
