"use client"

import type { ReactNode } from "react"

/**
 * Wraps the reused homepage showcase on the public waitlist page (/enter) so its
 * CTAs — "Get my gut score free", "Learn the framework", the Ecosystem cards,
 * etc. — don't navigate into the still-gated main site. It intercepts anchor
 * activation (mouse + keyboard) in the capture phase; all other interactivity is
 * left untouched. The homepage renders these same sections WITHOUT this guard,
 * so their links keep working there.
 */
export function PreviewGuard({ children }: { children: ReactNode }) {
  const block = (e: { target: EventTarget | null; preventDefault: () => void; stopPropagation: () => void }) => {
    const anchor = (e.target as HTMLElement | null)?.closest("a")
    if (anchor) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div
      className="[&_a]:cursor-default"
      onClickCapture={block}
      onKeyDownCapture={(e) => {
        if (e.key === "Enter" || e.key === " ") block(e)
      }}
    >
      {children}
    </div>
  )
}
