/**
 * /app-preview — the mobile companion app concept showcase (landing). Light
 * theme, matching the real app. Hero with a live Today phone, a notify-me
 * capture (visual mock), and a gallery of the mocked screens. Concept-only:
 * isolated from production nav/footer/sitemap, noindex, preview-only.
 */
import Link from "next/link"
import { PhoneFrame } from "./PhoneFrame"
import { ConceptBanner } from "./ConceptBanner"
import { NotifyMe } from "./NotifyMe"
import { SCREENS, APP } from "./theme"
import { SCREEN_COMPONENTS } from "./screens/registry"
import { TodayScreen } from "./screens/TodayScreen"

function StoreBadge({ store }: { store: "ios" | "android" }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-4 py-2.5" style={{ background: APP.card, border: `1px solid ${APP.border}` }}>
      <span style={{ fontSize: 20 }}>{store === "ios" ? "" : "▶"}</span>
      <div className="text-left">
        <p className="text-[9px] uppercase tracking-widest" style={{ color: APP.inkFaint }}>Coming soon to</p>
        <p className="text-sm font-bold" style={{ color: APP.ink }}>{store === "ios" ? "App Store" : "Google Play"}</p>
      </div>
    </div>
  )
}

export function AppLanding() {
  return (
    <main className="min-h-screen" style={{ background: APP.bg, fontFamily: APP.ui }}>
      <ConceptBanner />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-12 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: APP.green }}>The EatoBiotics app</p>
            <h1 className="mt-3 font-bold leading-[1.05] md:text-6xl" style={{ fontFamily: APP.display, fontSize: 44, color: APP.ink }}>
              Your gut,<br />a daily ritual.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed" style={{ color: APP.inkDim }}>
              A culture ring you fill each day — five taps for fermented food, plants, movement, sleep and mood.
              Log a meal, watch your Biotics score climb, and keep the streak alive.
            </p>
            <div className="mt-7"><NotifyMe /></div>
            <div className="mt-6 flex flex-wrap gap-3">
              <StoreBadge store="ios" />
              <StoreBadge store="android" />
            </div>
          </div>

          <div className="flex justify-center">
            <PhoneFrame platform="ios" scale={0.92}><TodayScreen viz="ring" /></PhoneFrame>
          </div>
        </div>
      </section>

      {/* Screen gallery */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="text-center">
          <h2 className="font-bold md:text-4xl" style={{ fontFamily: APP.display, fontSize: 32, color: APP.ink }}>
            The whole loop, screen by screen
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm" style={{ color: APP.inkDim }}>
            Tap any screen to see it full-size in both iOS and Android.
          </p>
        </div>

        <div className="mt-14 grid gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
          {SCREENS.map((s) => {
            const Screen = SCREEN_COMPONENTS[s.slug]
            return (
              <Link key={s.slug} href={`/${s.slug}`} className="group flex flex-col items-center text-center transition-transform hover:-translate-y-1">
                <PhoneFrame platform="ios" scale={0.5}><Screen /></PhoneFrame>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-widest" style={{ color: APP.green }}>{s.name}</p>
                <p className="mt-1 font-bold" style={{ fontFamily: APP.display, fontSize: 18, color: APP.ink }}>{s.tagline}</p>
                <p className="mt-2 max-w-[15rem] text-xs leading-relaxed" style={{ color: APP.inkDim }}>{s.blurb}</p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Close */}
      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <div className="mx-auto h-1 w-16 rounded-full" style={{ background: APP.green }} />
        <h2 className="mt-8 font-bold md:text-3xl" style={{ fontFamily: APP.display, fontSize: 26, color: APP.ink }}>
          The science is global. The food is local. The app is yours.
        </h2>
        <p className="mt-4 text-sm" style={{ color: APP.inkDim }}>
          Be first to know when the EatoBiotics companion app lands on iOS and Android.
        </p>
        <div className="mt-6 flex justify-center"><NotifyMe /></div>
      </section>
    </main>
  )
}
