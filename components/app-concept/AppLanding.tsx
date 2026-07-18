/**
 * /app — the mobile companion app concept showcase (landing). Hero with a
 * live phone, a notify-me capture (visual mock), and a gallery of the four
 * mocked screens linking to their full-screen pages. Concept-only: isolated
 * from production nav/footer/sitemap, noindex, preview-only.
 */
import Link from "next/link"
import { PhoneFrame } from "./PhoneFrame"
import { ConceptBanner } from "./ConceptBanner"
import { NotifyMe } from "./NotifyMe"
import { SCREENS } from "./theme"
import { SCREEN_COMPONENTS } from "./screens/registry"
import { HomeScreen } from "./screens/HomeScreen"

function StoreBadge({ store }: { store: "ios" | "android" }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-4 py-2.5"
      style={{ background: "rgba(253,251,247,0.06)", border: "1px solid rgba(253,251,247,0.16)" }}>
      <span style={{ fontSize: 20 }}>{store === "ios" ? "" : "▶"}</span>
      <div className="text-left">
        <p className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(253,251,247,0.5)" }}>Coming soon to</p>
        <p className="text-sm font-bold" style={{ color: "#FDFBF7" }}>{store === "ios" ? "App Store" : "Google Play"}</p>
      </div>
    </div>
  )
}

export function AppLanding() {
  return (
    <main className="min-h-screen" style={{ background: "#0B1607" }}>
      <ConceptBanner />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-12 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "#A8E063" }}>
              The EatoBiotics app
            </p>
            <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.05] md:text-6xl" style={{ color: "#FDFBF7" }}>
              Your gut,<br />alive in your pocket.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed" style={{ color: "rgba(253,251,247,0.65)" }}>
              A living Food System you check in with each day — five taps, one meal at a time.
              Watch your Twin light up as you feed it, and your Biotics score climb week over week.
            </p>
            <div className="mt-7">
              <NotifyMe />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <StoreBadge store="ios" />
              <StoreBadge store="android" />
            </div>
          </div>

          {/* Hero phone */}
          <div className="flex justify-center">
            <PhoneFrame platform="ios" scale={0.92}>
              <HomeScreen />
            </PhoneFrame>
          </div>
        </div>
      </section>

      {/* Screen gallery */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold md:text-4xl" style={{ color: "#FDFBF7" }}>
            Four screens, one daily loop
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm" style={{ color: "rgba(253,251,247,0.6)" }}>
            Tap any screen to see it full-size in both iOS and Android.
          </p>
        </div>

        <div className="mt-14 grid gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
          {SCREENS.map((s) => {
            const Screen = SCREEN_COMPONENTS[s.slug]
            return (
              <Link key={s.slug} href={`/${s.slug}`} className="group flex flex-col items-center text-center transition-transform hover:-translate-y-1">
                <PhoneFrame platform="ios" scale={0.5}>
                  <Screen />
                </PhoneFrame>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#A8E063" }}>{s.name}</p>
                <p className="mt-1 font-serif text-lg font-bold" style={{ color: "#FDFBF7" }}>{s.tagline}</p>
                <p className="mt-2 max-w-[15rem] text-xs leading-relaxed" style={{ color: "rgba(253,251,247,0.55)" }}>{s.blurb}</p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Close */}
      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #A8E063, #4CB648, #2DAA6E, #F5C518, #F5A623)" }} />
        <h2 className="mt-8 font-serif text-2xl font-bold md:text-3xl" style={{ color: "#FDFBF7" }}>
          The science is global. The food is local. The app is yours.
        </h2>
        <p className="mt-4 text-sm" style={{ color: "rgba(253,251,247,0.6)" }}>
          Be first to know when the EatoBiotics companion app lands on iOS and Android.
        </p>
        <div className="mt-6 flex justify-center">
          <NotifyMe />
        </div>
      </section>
    </main>
  )
}
