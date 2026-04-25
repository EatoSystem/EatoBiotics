"use client"

import { useEffect, useState } from "react"

export function ReadingProgress() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement
      const scrolled = el.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setPct(total > 0 ? (scrolled / total) * 100 : 0)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none">
      <div
        className="h-full transition-[width] duration-100 ease-out"
        style={{
          width: `${pct}%`,
          background:
            "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))",
        }}
      />
    </div>
  )
}
