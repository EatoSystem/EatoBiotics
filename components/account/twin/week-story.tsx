"use client"

/**
 * WeekStory — the "Your Week Inside" full-screen story.
 *
 * Instagram-style recap of the member's week from their Twin: progress
 * segments up top, tap/arrow to advance, X (or Esc) to close. Slides come from
 * the pure builder in lib/account/week-story; CSS transitions only — instant
 * and tappable, no Remotion needed. Dark botanical stage, brand palette.
 * `WeekStoryButton` is the reusable entry point.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { X, ChevronLeft, ChevronRight, PlayCircle } from "lucide-react"
import { buildWeekStory } from "@/lib/account/week-story"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

export function WeekStory({ twin, onClose }: { twin: FoodSystemDigitalTwin; onClose: () => void }) {
  const slides = useMemo(() => buildWeekStory(twin), [twin])
  const [idx, setIdx] = useState(0)
  const slide = slides[idx]

  const next = useCallback(() => {
    setIdx((i) => {
      if (i + 1 >= slides.length) {
        onClose()
        return i
      }
      return i + 1
    })
  }, [slides.length, onClose])
  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") next()
      if (e.key === "ArrowLeft") prev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [next, prev, onClose])

  if (!slide) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col"
      style={{ background: "linear-gradient(175deg, #0B1607 0%, #122208 55%, #16290F 100%)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Your Week Inside"
    >
      {/* ambient glow tinted by the slide accent */}
      <div aria-hidden className="pointer-events-none absolute inset-0 transition-all duration-700" style={{ background: `radial-gradient(circle at 50% 30%, ${slide.accent}22 0%, transparent 60%)` }} />

      {/* progress segments */}
      <div className="relative z-10 flex gap-1.5 px-4 pt-4 md:px-8">
        {slides.map((s, i) => (
          <div key={s.key} className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(253,251,247,0.18)" }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: i < idx ? "100%" : i === idx ? "100%" : "0%", background: i <= idx ? slide.accent : "transparent", opacity: i === idx ? 1 : 0.6 }} />
          </div>
        ))}
      </div>

      {/* close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-8 z-20 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10 md:right-8"
        style={{ color: "rgba(253,251,247,0.7)", border: "1px solid rgba(253,251,247,0.2)" }}
      >
        <X size={16} />
      </button>

      {/* slide content — key remount animates each slide in */}
      <button type="button" onClick={next} className="relative z-10 flex flex-1 cursor-pointer flex-col items-center justify-center px-6 text-center" aria-label="Next slide">
        <div key={slide.key} className="eb-reveal max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: slide.accent }}>{slide.eyebrow}</p>
          {slide.stat && (
            <p className="mt-4 font-serif text-8xl font-bold leading-none md:text-9xl" style={{ color: slide.accent }}>{slide.stat}</p>
          )}
          <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl" style={{ color: "#FDFBF7" }}>{slide.title}</h2>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed" style={{ color: "rgba(253,251,247,0.65)" }}>{slide.detail}</p>
        </div>
      </button>

      {/* nav arrows */}
      <div className="relative z-10 flex items-center justify-between px-4 pb-6 md:px-8">
        <button type="button" onClick={prev} disabled={idx === 0} aria-label="Previous" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10 disabled:opacity-30" style={{ color: "rgba(253,251,247,0.7)", border: "1px solid rgba(253,251,247,0.2)" }}>
          <ChevronLeft size={17} />
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(253,251,247,0.4)" }}>
          {idx + 1} / {slides.length} · tap to continue
        </p>
        <button type="button" onClick={next} aria-label="Next" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10" style={{ color: "rgba(253,251,247,0.7)", border: "1px solid rgba(253,251,247,0.2)" }}>
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  )
}

/** Entry chip/button that opens the story. `variant="dark"` for the TodayStrip. */
export function WeekStoryButton({ twin, variant = "light" }: { twin: FoodSystemDigitalTwin; variant?: "light" | "dark" }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors"
        style={
          variant === "dark"
            ? { border: "1px solid rgba(245,197,24,0.5)", color: "#F5C518", background: "rgba(245,197,24,0.08)" }
            : { border: "1px solid var(--icon-green)", color: "var(--icon-green)", background: "color-mix(in srgb, var(--icon-green) 6%, white)" }
        }
      >
        <PlayCircle size={13} /> Your Week Inside
      </button>
      {/* Portalled to <body>: keeps the fixed overlay viewport-sized even if an
          ancestor (e.g. an animated <main>) ever becomes a containing block. */}
      {open && typeof document !== "undefined" && createPortal(<WeekStory twin={twin} onClose={() => setOpen(false)} />, document.body)}
    </>
  )
}
