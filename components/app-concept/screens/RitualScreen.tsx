"use client"

/** Concept mock: the daily ritual — five taps, the body lights up. Interactive
    so the concept can be felt, not just seen. */
import { useState } from "react"
import { APP, RITUAL_CHECKS } from "../theme"
import { TwinFigure } from "../TwinFigure"
import { TabBar } from "./HomeScreen"

export function RitualScreen() {
  const [on, setOn] = useState<Record<string, boolean>>({
    fermented: true,
    plants: true,
    moved: true,
    slept: false,
    feeling: false,
  })
  const lit = Object.keys(on).filter((k) => on[k])
  const count = lit.length

  return (
    <div className="flex h-full flex-col" style={{ color: APP.ink }}>
      <div className="h-[3px] w-full shrink-0" style={{ background: APP.hairline }} />
      <div className="flex-1 overflow-hidden px-6 pt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: APP.lime }}>
          Daily ritual
        </p>
        <p className="mt-1 text-sm" style={{ color: APP.inkDim }}>
          Tap what&apos;s true today — feel it land inside you.
        </p>

        <div className="mt-1 flex items-center justify-center">
          <TwinFigure lit={lit} scale={0.86} />
        </div>

        <div className="-mt-1 space-y-2">
          {RITUAL_CHECKS.map((c) => {
            const active = on[c.key]
            return (
              <button
                key={c.key}
                onClick={() => setOn((s) => ({ ...s, [c.key]: !s[c.key] }))}
                className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-all"
                style={{
                  background: active ? `color-mix(in srgb, ${c.color} 16%, transparent)` : APP.fill,
                  border: `1.5px solid ${active ? c.color : APP.line}`,
                }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: active ? c.color : "transparent",
                    border: `1.5px solid ${active ? c.color : APP.line}`,
                    color: active ? "#0B1607" : APP.inkFaint,
                  }}
                >
                  {active ? "✓" : ""}
                </span>
                <span className="text-sm font-semibold" style={{ color: active ? APP.ink : APP.inkDim }}>
                  {c.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="shrink-0 px-6 pb-3 pt-1 text-center">
        <p className="text-[11px] font-semibold" style={{ color: APP.inkFaint }}>
          {count === 5 ? "Full ritual complete — your Twin is glowing." : `${count} / 5 · keep the streak alive`}
        </p>
      </div>
      <TabBar active="ritual" />
    </div>
  )
}
