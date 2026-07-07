"use client"

/**
 * MealReactionBurst — the Twin visibly "absorbs" a new meal.
 *
 * Rendered over the twin figure; each time `playKey` increments, plays a ~2.6s
 * CSS/SVG burst (no Remotion — instant): coloured food particles converge into
 * the figure, a ring blooms outward, and a "Your Food System just learned from your
 * meal" chip pops in. Deterministic particle placement; motion is
 * reduced-motion-gated via the eb-* classes (the chip still appears without it).
 */

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"

const BURST_MS = 2600

const PARTICLES = [
  { x: -130, y: -90, c: "#A8E063", s: 10, d: 0 },
  { x: 120, y: -110, c: "#F5C518", s: 8, d: 90 },
  { x: -95, y: 105, c: "#2DAA6E", s: 9, d: 180 },
  { x: 140, y: 70, c: "#F5A623", s: 8, d: 260 },
  { x: -150, y: 10, c: "#4CB648", s: 11, d: 130 },
  { x: 90, y: 140, c: "#A8E063", s: 7, d: 320 },
  { x: 20, y: -150, c: "#4CB648", s: 9, d: 40 },
  { x: -50, y: -140, c: "#F5C518", s: 7, d: 220 },
]

export function MealReactionBurst({ playKey, message = "Your Food System just learned from your meal" }: { playKey: number; message?: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (playKey <= 0) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), BURST_MS)
    return () => clearTimeout(t)
  }, [playKey])

  if (!visible) return null

  return (
    <div key={playKey} aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {/* particles converging into the figure's core */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="eb-absorb absolute left-1/2 top-1/2"
          style={{
            width: p.s,
            height: p.s,
            marginLeft: -p.s / 2,
            marginTop: -p.s / 2,
            borderRadius: "50%",
            background: p.c,
            boxShadow: `0 0 14px ${p.c}aa`,
            opacity: 0,
            animationDuration: "1.15s",
            animationDelay: `${p.d}ms`,
            ["--eb-from-x" as string]: `${p.x}px`,
            ["--eb-from-y" as string]: `${p.y}px`,
          }}
        />
      ))}
      {/* bloom ring */}
      <span
        className="eb-burst-ring absolute left-1/2 top-1/2 rounded-full"
        style={{ width: "72%", height: "72%", border: "3px solid rgba(76,182,72,0.65)", animationDelay: "950ms" }}
      />
      <span
        className="eb-burst-ring absolute left-1/2 top-1/2 rounded-full"
        style={{ width: "72%", height: "72%", border: "2px solid rgba(245,197,24,0.6)", animationDelay: "1150ms" }}
      />
      {/* learned chip */}
      <span
        className="eb-pop-in absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold text-white shadow-lg"
        style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)", animationDelay: "1100ms" }}
      >
        <Sparkles size={11} /> {message}
      </span>
    </div>
  )
}
