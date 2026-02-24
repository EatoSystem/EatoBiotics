import React from "react"

// ── Takeaway (child component) ───────────────────────────────────────────────

export function SubstackTakeaway({ children }: { children: React.ReactNode }) {
  // Renders nothing directly — content is collected by SubstackKeyTakeaways
  return <>{children}</>
}
SubstackTakeaway.displayName = "SubstackTakeaway"

// ── Key Takeaways container ──────────────────────────────────────────────────

interface SubstackKeyTakeawaysProps {
  children: React.ReactNode
}

export function SubstackKeyTakeaways({ children }: SubstackKeyTakeawaysProps) {
  // Collect text from SubstackTakeaway children (same pattern as ChapterKeyTakeaways)
  const items: React.ReactNode[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === SubstackTakeaway) {
      items.push((child.props as { children: React.ReactNode }).children)
    }
  })

  return (
    <div className="my-8 rounded-xl border border-gray-200 bg-gray-50 px-6 py-5">
      <hr className="border-gray-300" />
      <p className="mt-4 text-sm font-bold uppercase tracking-widest text-gray-500">
        <strong>Key Takeaways</strong>
      </p>
      {/* ol survives Substack paste as a numbered list */}
      <ol className="mt-3 space-y-3 pl-5">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-gray-800">
            {item}
          </li>
        ))}
      </ol>
      <hr className="mt-4 border-gray-300" />
    </div>
  )
}
