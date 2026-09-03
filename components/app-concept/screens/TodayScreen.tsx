"use client"

/**
 * Concept mock: the Today screen — the app's home IS the ritual (reconciled
 * per the iOS session). Light theme. Centrepiece switches between the real
 * culture ring and the alternate living figure (D2 = support both) so the two
 * can be compared. Interactive: tap the five checks, the ring/figure responds.
 */
import { useState } from "react"
import { APP, RITUAL_CHECKS, BIOTICS, type TodayViz } from "../theme"
import { CultureRing } from "../CultureRing"
import { TwinFigure } from "../TwinFigure"
import { TabBar } from "../TabBar"

export function TodayScreen({ viz = "ring" }: { viz?: TodayViz }) {
  const [on, setOn] = useState<Record<string, boolean>>({
    fermented: true, plants: true, moved: true, slept: false, feeling: false,
  })
  const lit = Object.keys(on).filter((k) => on[k])
  const count = lit.length

  return (
    <div className="flex h-full flex-col" style={{ color: APP.ink, fontFamily: APP.ui }}>
      <div className="flex-1 overflow-y-auto px-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: APP.green }}>Today</p>
            <p className="text-sm" style={{ color: APP.inkDim }}>Good morning, Jason</p>
          </div>
          {/* Streak chip — the only apricot in the app */}
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: "rgba(232,160,85,0.14)", border: `1px solid ${APP.apricot}` }}>
            <span style={{ fontSize: 14 }}>🔥</span>
            <span className="text-xs font-bold" style={{ color: APP.apricot }}>12</span>
          </div>
        </div>

        {/* Centrepiece: ring (real) or figure (alternate) */}
        <div className="mt-2 flex items-center justify-center" style={{ minHeight: 210 }}>
          {viz === "ring" ? <CultureRing lit={lit} scale={0.98} /> : <TwinFigure lit={lit} scale={1.02} />}
        </div>

        <div className="-mt-1 flex items-baseline justify-center gap-2">
          <span className="text-sm" style={{ color: APP.inkDim }}>Biotics score today</span>
          <span className="font-bold" style={{ fontFamily: APP.display, fontSize: 22, color: APP.green }}>78</span>
        </div>

        {/* The five checks */}
        <div className="mt-4 space-y-2">
          {RITUAL_CHECKS.map((c) => {
            const active = on[c.key]
            return (
              <button
                key={c.key}
                onClick={() => setOn((s) => ({ ...s, [c.key]: !s[c.key] }))}
                className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-all"
                style={{
                  background: active ? APP.card : APP.fill,
                  border: `1.5px solid ${active ? c.color : APP.border}`,
                  boxShadow: active ? "0 1px 3px rgba(27,42,32,0.06)" : "none",
                }}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: active ? c.color : "transparent", border: `1.5px solid ${active ? c.color : APP.border}`, color: active ? "#fff" : APP.inkFaint }}>
                  {active ? "✓" : ""}
                </span>
                <span className="text-sm font-semibold" style={{ color: active ? APP.ink : APP.inkDim }}>{c.label}</span>
              </button>
            )
          })}
        </div>

        {/* Three biotics mini */}
        <div className="mt-4 flex gap-2">
          {BIOTICS.map((b, i) => (
            <div key={b.label} className="flex-1 rounded-xl px-2.5 py-2 text-center" style={{ background: APP.card, border: `1px solid ${APP.border}` }}>
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: APP.inkFaint }}>{b.label.slice(0, 4)}</p>
              <p className="text-sm font-bold" style={{ color: b.color }}>{[72, 68, 55][i]}</p>
            </div>
          ))}
        </div>
        <div className="h-3" />
      </div>

      <div className="shrink-0 px-6 pb-2 pt-1 text-center">
        <p className="text-[11px] font-semibold" style={{ color: count === 5 ? APP.green : APP.inkFaint }}>
          {count === 5 ? "Full ritual complete — nice." : `${count} of 5 · keep the streak alive`}
        </p>
      </div>
      <TabBar active="today" />
    </div>
  )
}
