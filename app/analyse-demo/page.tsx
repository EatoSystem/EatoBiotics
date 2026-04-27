import type { Metadata } from "next"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { GuestScanFlow } from "@/components/analyse/guest-scan-flow"

export const metadata: Metadata = {
  title: "Meal Analysis — Demo",
  description: "Demo version of the EatoBiotics meal analysis tool for testing.",
  robots: { index: false, follow: false },
}

const BIOTICS = [
  {
    label: "Prebiotics",
    icon: "🌱",
    text: "Plant fibre that feeds your gut bacteria",
    color: "var(--icon-lime)",
  },
  {
    label: "Probiotics",
    icon: "🦠",
    text: "Live cultures from fermented foods",
    color: "var(--icon-green)",
  },
  {
    label: "Postbiotics",
    icon: "✨",
    text: "Compounds produced by a healthy microbiome",
    color: "var(--icon-teal)",
  },
]

export default function AnalyseDemoPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Demo banner */}
      <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500/90 backdrop-blur-sm px-4 py-2 text-xs font-bold text-white">
        🧪 Demo / Testing Mode — email gate is active but results are real
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-24 pb-16 md:pt-32 md:pb-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 0%, color-mix(in srgb, var(--icon-green) 10%, transparent), transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-[680px] text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt=""
              width={80}
              height={80}
              className="mx-auto mb-6 h-16 w-16 md:h-20 md:w-20"
            />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              EatoBiotics — Meal Analysis
            </p>
            <h1 className="mt-4 font-serif text-5xl font-semibold tracking-tight text-balance sm:text-6xl md:text-7xl">
              <GradientText>Analyse your meal</GradientText>
            </h1>
            <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              Upload a photo and EatoBiotics identifies every food on your plate,
              scores it against the 3 biotics framework, and tells you how to boost it.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="mt-10 grid grid-cols-3 gap-3">
              {BIOTICS.map((b) => (
                <div
                  key={b.label}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-background/80 px-3 py-4 backdrop-blur-sm"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                    style={{ background: `color-mix(in srgb, ${b.color} 15%, transparent)` }}
                  >
                    {b.icon}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{b.label}</p>
                  <p className="text-center text-[11px] leading-tight text-muted-foreground hidden sm:block">
                    {b.text}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Scan flow — no gate ───────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-6 pb-20">
        <GuestScanFlow demoMode />
        <p className="mt-6 text-center text-xs text-muted-foreground/50">
          Photos are not stored
        </p>
      </div>

    </div>
  )
}
