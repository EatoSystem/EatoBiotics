/**
 * Per-screen concept page body (/app-onboarding, /app-meal, /app-scores): the
 * screen in both an iOS and Android frame, with concept banner, prev/next nav,
 * and a link back to /app-preview. Light theme. (/app-home uses TodayShowcase
 * instead, for the ring/figure toggle.) Concept-only.
 */
import Link from "next/link"
import { PhoneFrame } from "./PhoneFrame"
import { SCREENS, APP, type ScreenSlug } from "./theme"
import { SCREEN_COMPONENTS } from "./screens/registry"
import { ConceptBanner } from "./ConceptBanner"

export function ScreenShowcase({ slug }: { slug: ScreenSlug }) {
  const idx = SCREENS.findIndex((s) => s.slug === slug)
  const meta = SCREENS[idx]
  const Screen = SCREEN_COMPONENTS[slug]
  const prev = SCREENS[(idx - 1 + SCREENS.length) % SCREENS.length]
  const next = SCREENS[(idx + 1) % SCREENS.length]

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

        <div className="mt-12 flex flex-col items-center justify-center gap-12 md:flex-row md:items-start md:gap-16">
          <PhoneFrame platform="ios" scale={0.82} label="iOS"><Screen /></PhoneFrame>
          <PhoneFrame platform="android" scale={0.82} label="Android"><Screen /></PhoneFrame>
        </div>

        <div className="mt-14 flex items-center justify-between border-t pt-6" style={{ borderColor: APP.border }}>
          <Link href={`/${prev.slug}`} className="text-sm font-semibold" style={{ color: APP.inkDim }}>← {prev.name}</Link>
          <Link href={`/${next.slug}`} className="text-sm font-semibold" style={{ color: APP.inkDim }}>{next.name} →</Link>
        </div>
      </div>
    </main>
  )
}
