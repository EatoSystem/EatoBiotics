"use client"

/**
 * /app-home page body — the Today screen, with a control to switch the
 * centrepiece between the app's real culture RING and the alternate living
 * FIGURE (D2 = support both, decide later). Shows the choice in both iOS and
 * Android frames. Client (holds the toggle state). Concept-only.
 */
import { useState } from "react"
import Link from "next/link"
import { PhoneFrame } from "./PhoneFrame"
import { ConceptBanner } from "./ConceptBanner"
import { TodayScreen } from "./screens/TodayScreen"
import { SCREENS, APP, type TodayViz } from "./theme"

export function TodayShowcase() {
  const [viz, setViz] = useState<TodayViz>("ring")
  const meta = SCREENS.find((s) => s.slug === "app-home")!
  const prev = SCREENS[(SCREENS.findIndex((s) => s.slug === "app-home") - 1 + SCREENS.length) % SCREENS.length]
  const next = SCREENS[(SCREENS.findIndex((s) => s.slug === "app-home") + 1) % SCREENS.length]

  return (
    <main className="min-h-screen" style={{ background: APP.bg, fontFamily: APP.ui }}>
      <ConceptBanner />
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <Link href="/app-preview" className="text-sm font-semibold" style={{ color: APP.green }}>← All screens</Link>

        <div className="mt-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: APP.green }}>{meta.name}</p>
          <h1 className="mt-2 font-bold md:text-4xl" style={{ fontFamily: APP.display, fontSize: 30, color: APP.ink }}>{meta.tagline}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed" style={{ color: APP.inkDim }}>{meta.blurb}</p>
        </div>

        {/* Ring / figure toggle */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="inline-flex rounded-full p-1" style={{ background: APP.fill, border: `1px solid ${APP.border}` }}>
            {(["ring", "figure"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViz(v)}
                className="rounded-full px-4 py-1.5 text-xs font-bold capitalize transition-colors"
                style={{ background: viz === v ? APP.green : "transparent", color: viz === v ? "#fff" : APP.inkDim }}
              >
                {v === "ring" ? "Culture ring" : "Living figure"}
              </button>
            ))}
          </div>
          <p className="text-[11px]" style={{ color: APP.inkFaint }}>
            {viz === "ring" ? "The app's real centrepiece." : "Alternate concept — awaiting the human's call vs. the ring."}
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-12 md:flex-row md:items-start md:gap-16">
          <PhoneFrame platform="ios" scale={0.82} label="iOS"><TodayScreen viz={viz} /></PhoneFrame>
          <PhoneFrame platform="android" scale={0.82} label="Android"><TodayScreen viz={viz} /></PhoneFrame>
        </div>

        <div className="mt-14 flex items-center justify-between border-t pt-6" style={{ borderColor: APP.border }}>
          <Link href={`/${prev.slug}`} className="text-sm font-semibold" style={{ color: APP.inkDim }}>← {prev.name}</Link>
          <Link href={`/${next.slug}`} className="text-sm font-semibold" style={{ color: APP.inkDim }}>{next.name} →</Link>
        </div>
      </div>
    </main>
  )
}
