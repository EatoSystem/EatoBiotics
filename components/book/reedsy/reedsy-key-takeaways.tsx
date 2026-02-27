import React from "react"

// ── Takeaway (child component) ───────────────────────────────────────────────

export function ReedsyTakeaway({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
ReedsyTakeaway.displayName = "ReedsyTakeaway"

// ── Key Takeaways container ──────────────────────────────────────────────────

interface ReedsyKeyTakeawaysProps {
  children: React.ReactNode
}

export function ReedsyKeyTakeaways({ children }: ReedsyKeyTakeawaysProps) {
  const items: React.ReactNode[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === ReedsyTakeaway) {
      items.push((child.props as { children: React.ReactNode }).children)
    }
  })

  return (
    <div className="my-8">
      <h3 className="mb-3 text-lg font-bold text-gray-900">Key Takeaways</h3>
      <ol className="list-decimal space-y-2 pl-6">
        {items.map((item, i) => (
          <li key={i} className="text-base leading-relaxed text-gray-800">
            {item}
          </li>
        ))}
      </ol>
    </div>
  )
}
