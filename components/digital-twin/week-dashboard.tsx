"use client"

/**
 * WeekDashboard — "Your Twin in action." A living phone mockup that steps through
 * a week: the Food System Score climbs, the Next Best Action changes, meal dots
 * fill in and a trend bar grows. Auto-cycles Mon→Fri once it scrolls into view;
 * respects prefers-reduced-motion (snaps to the final day, no cycling).
 */

import { useEffect, useRef, useState } from "react"

const GREEN = "#4CB648"

type Day = { day: string; score: number; meals: number; nba: string }

const WEEK: Day[] = [
  { day: "Mon", score: 68, meals: 1, nba: "Add one prebiotic-rich food to lunch." },
  { day: "Tue", score: 71, meals: 2, nba: "Try a fermented side with dinner." },
  { day: "Wed", score: 73, meals: 3, nba: "Aim for 25g of fibre today." },
  { day: "Thu", score: 74, meals: 3, nba: "Keep your protein steady across meals." },
  { day: "Fri", score: 76, meals: 4, nba: "Great rhythm — add a new plant variety." },
]

export function WeekDashboard() {
  const ref = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (reduce) setI(WEEK.length - 1)
          else setStarted(true)
          obs.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const id = setInterval(() => setI((p) => (p + 1) % WEEK.length), 2200)
    return () => clearInterval(id)
  }, [started])

  const d = WEEK[i]
  const C = 2 * Math.PI * 52
  const pct = d.score / 100

  return (
    <div ref={ref} className="mx-auto w-[280px]">
      <div className="overflow-hidden rounded-[2.6rem] border-[7px] border-foreground bg-card p-5 shadow-[0_30px_60px_-20px_rgba(20,37,15,0.4)]">
        <div className="mx-auto mb-4 h-5 w-20 rounded-full bg-foreground" />

        {/* day pills */}
        <div className="mb-3 flex items-center justify-between">
          {WEEK.map((w, idx) => (
            <span
              key={w.day}
              className="rounded-full px-2 py-1 text-[10px] font-semibold transition-colors duration-300"
              style={
                idx === i
                  ? { background: GREEN, color: "#fff" }
                  : { background: "color-mix(in srgb, #4CB648 10%, #fff)", color: "#5A6E50" }
              }
            >
              {w.day}
            </span>
          ))}
        </div>

        {/* score ring */}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Your Food System Score</p>
        <div className="relative mx-auto my-2 h-[140px] w-[140px]">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <defs>
              <linearGradient id="wdRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#A8E063" /><stop offset="0.5" stopColor="#4CB648" /><stop offset="1" stopColor="#F5A623" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--muted,#F3F3F3)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="52" fill="none" stroke="url(#wdRing)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${C * pct} ${C}`}
              style={{ transition: "stroke-dasharray 0.9s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tabular-nums text-foreground">{d.score}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: GREEN }}>Improving</span>
          </div>
        </div>

        {/* next best action */}
        <div className="min-h-[78px] rounded-2xl p-3" style={{ background: "color-mix(in srgb, #4CB648 8%, #fff)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: GREEN }}>Your next best action</p>
          <p className="mt-1 text-sm font-semibold leading-snug text-foreground">{d.nba}</p>
        </div>

        {/* meals logged dots + trend */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Meals logged</span>
          <span className="flex gap-1">
            {[0, 1, 2, 3].map((m) => (
              <span
                key={m}
                className="h-2.5 w-2.5 rounded-full transition-colors duration-300"
                style={{ background: m < d.meals ? GREEN : "color-mix(in srgb, #4CB648 14%, #fff)" }}
              />
            ))}
          </span>
        </div>
        <div className="mt-3 flex items-end gap-1.5">
          {WEEK.map((w, idx) => (
            <span
              key={w.day}
              className="flex-1 rounded-t transition-all duration-500"
              style={{
                height: `${(w.score - 60) * 2.2}px`,
                background: idx <= i ? "linear-gradient(180deg,#A8E063,#4CB648)" : "color-mix(in srgb, #4CB648 12%, #fff)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
