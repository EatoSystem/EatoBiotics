/**
 * Per-screen concept page body (/app-home, /app-ritual, …): the screen shown
 * in both an iOS and an Android frame, with a concept banner, prev/next
 * screen nav, and a link back to the /app landing. Concept-only.
 */
import Link from "next/link"
import { PhoneFrame } from "./PhoneFrame"
import { SCREENS, type ScreenSlug } from "./theme"
import { SCREEN_COMPONENTS } from "./screens/registry"
import { ConceptBanner } from "./ConceptBanner"

export function ScreenShowcase({ slug }: { slug: ScreenSlug }) {
  const idx = SCREENS.findIndex((s) => s.slug === slug)
  const meta = SCREENS[idx]
  const Screen = SCREEN_COMPONENTS[slug]
  const prev = SCREENS[(idx - 1 + SCREENS.length) % SCREENS.length]
  const next = SCREENS[(idx + 1) % SCREENS.length]

  return (
    <main className="min-h-screen" style={{ background: "#0B1607" }}>
      <ConceptBanner />
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <Link href="/app" className="text-sm font-semibold" style={{ color: "#A8E063" }}>
          ← All screens
        </Link>

        <div className="mt-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "#A8E063" }}>
            {meta.name}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold md:text-4xl" style={{ color: "#FDFBF7" }}>
            {meta.tagline}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed" style={{ color: "rgba(253,251,247,0.6)" }}>
            {meta.blurb}
          </p>
        </div>

        {/* iOS + Android, side by side (stacks on mobile) */}
        <div className="mt-12 flex flex-col items-center justify-center gap-12 md:flex-row md:items-start md:gap-16">
          <PhoneFrame platform="ios" scale={0.82} label="iOS">
            <Screen />
          </PhoneFrame>
          <PhoneFrame platform="android" scale={0.82} label="Android">
            <Screen />
          </PhoneFrame>
        </div>

        {/* Prev / next */}
        <div className="mt-14 flex items-center justify-between border-t pt-6" style={{ borderColor: "rgba(253,251,247,0.12)" }}>
          <Link href={`/${prev.slug}`} className="text-sm font-semibold" style={{ color: "rgba(253,251,247,0.7)" }}>
            ← {prev.name}
          </Link>
          <Link href={`/${next.slug}`} className="text-sm font-semibold" style={{ color: "rgba(253,251,247,0.7)" }}>
            {next.name} →
          </Link>
        </div>
      </div>
    </main>
  )
}
