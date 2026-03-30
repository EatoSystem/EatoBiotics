import type { Metadata } from "next"
import SnapClient from "./snap-client"

export const metadata: Metadata = {
  title: "Snap Your Meal — EatoBiotics Gut Score",
  description:
    "Upload a photo of your meal and get your gut health score in seconds. Powered by the EatoBiotics 3-Biotics framework — free, instant, no sign-up needed.",
  openGraph: {
    title: "What score does your meal get? — EatoBiotics",
    description:
      "Snap your plate and discover your gut health score in seconds. Free, instant analysis powered by the 3-Biotics framework.",
    url: "https://eatobiotics.com/snap",
    siteName: "EatoBiotics",
  },
}

const BIOTICS_MINI = [
  { icon: "🌿", label: "Prebiotic", color: "var(--icon-green)", desc: "Plant fibres that feed your gut bacteria" },
  { icon: "🦠", label: "Probiotic", color: "var(--icon-teal)", desc: "Live cultures from fermented foods" },
  { icon: "🔥", label: "Postbiotic", color: "var(--icon-orange)", desc: "Compounds that heal your gut lining" },
]

export default function SnapPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-12 pt-16 text-center sm:pt-24">
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 50% 0%, color-mix(in srgb, var(--icon-lime) 20%, transparent), transparent 70%)",
          }}
        />

        {/* Badge */}
        <div
          className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
          style={{
            background: "color-mix(in srgb, var(--icon-lime) 15%, transparent)",
            color: "var(--icon-green)",
          }}
        >
          <span>📸</span>
          Free · No sign-up · Instant
        </div>

        {/* Headline */}
        <h1 className="font-serif text-4xl font-bold leading-tight sm:text-6xl">
          What score does your{" "}
          <span className="brand-gradient-text">meal get?</span>
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
          Snap your plate — our AI scores it for gut health in seconds using
          the EatoBiotics 3-Biotics framework.
        </p>

        {/* Mini biotics row */}
        <div className="mx-auto mt-10 flex max-w-lg flex-col gap-2 sm:flex-row sm:gap-3">
          {BIOTICS_MINI.map((b) => (
            <div
              key={b.label}
              className="flex flex-1 items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left"
              style={{
                background: `color-mix(in srgb, ${b.color} 6%, var(--card))`,
                borderColor: `color-mix(in srgb, ${b.color} 22%, transparent)`,
              }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base"
                style={{ background: `color-mix(in srgb, ${b.color} 15%, transparent)` }}
              >
                {b.icon}
              </span>
              <div>
                <p className="text-[11px] font-bold" style={{ color: b.color }}>{b.label}</p>
                <p className="text-[10px] leading-tight text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Snap Tool ────────────────────────────────────────── */}
      <section className="mx-auto max-w-xl px-4 py-10">
        <SnapClient />
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <p className="pb-10 text-center text-xs text-muted-foreground">
        Powered by Claude AI · For informational purposes only, not medical advice
      </p>
    </main>
  )
}
