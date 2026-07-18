"use client"

/** Concept mock: meal logging → the analysis reveal (light), with the score
    counting up on mount. */
import { useEffect, useState } from "react"
import { APP, BIOTICS } from "../theme"
import { TabBar } from "../TabBar"

function useCountUp(target: number, ms = 1100) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms)
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export function MealScreen() {
  const score = useCountUp(84)
  const tags = ["Fermented Foods", "Plant Diversity", "Omega-3s", "High Fibre"]
  return (
    <div className="flex h-full flex-col" style={{ color: APP.ink, fontFamily: APP.ui }}>
      <div className="flex-1 overflow-y-auto px-6 pt-4">
        <p className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest"
          style={{ background: "rgba(46,91,63,0.1)", color: APP.green }}>
          ✦ Analysed
        </p>

        <div className="mt-3 h-28 w-full overflow-hidden rounded-2xl"
          style={{ background: "linear-gradient(135deg, #cfe0c2, #a9c993)", border: `1px solid ${APP.border}` }}>
          <div className="flex h-full items-center justify-center text-4xl">🥗</div>
        </div>

        <h2 className="mt-3 font-bold leading-snug" style={{ fontFamily: APP.display, fontSize: 19 }}>Salmon, quinoa &amp; kimchi bowl</h2>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-bold leading-none" style={{ fontFamily: APP.display, fontSize: 56, color: APP.green }}>{score}</span>
          <span className="text-sm font-semibold" style={{ color: APP.inkFaint }}>/ 100</span>
        </div>

        <div className="mt-4 space-y-2.5">
          {BIOTICS.map((b, i) => {
            const v = [86, 74, 61][i]
            return (
              <div key={b.label}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: APP.inkDim }}>{b.label}</span>
                  <span className="text-xs font-bold" style={{ color: b.color }}>{v}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: APP.fill }}>
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${v}%`, background: b.color }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{ background: APP.card, border: `1px solid ${APP.border}`, color: APP.inkDim }}>{t}</span>
          ))}
        </div>

        <p className="mt-3 rounded-xl px-3.5 py-3 text-[13px] leading-relaxed"
          style={{ background: APP.card, border: `1px solid ${APP.border}`, color: APP.inkDim }}>
          Strong all-rounder — the kimchi brings live cultures while quinoa and greens feed your resident microbes.
          Add a spoon of sauerkraut next time to push probiotics past 80.
        </p>
        <div className="h-3" />
      </div>
      <TabBar active="meal" />
    </div>
  )
}
