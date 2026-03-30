import type { Metadata } from "next"
import { Suspense } from "react"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import ShareClient from "./share-client"

export const metadata: Metadata = {
  title: "Score Your Meal — EatoBiotics",
  description:
    "Upload a photo of your meal and get your gut health score in seconds. Free, instant analysis powered by the EatoBiotics 3-Biotics framework.",
  openGraph: {
    title: "What score does your meal get? — EatoBiotics",
    description:
      "Snap your plate and discover your gut health score instantly. Free analysis powered by the 3-Biotics framework.",
    url: "https://eatobiotics.com/share",
    siteName: "EatoBiotics",
  },
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

export default function SharePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-32 pb-16 md:pt-40 md:pb-20">

        {/* Radial glow wash */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 0%, color-mix(in srgb, var(--icon-green) 10%, transparent), transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-[680px] text-center">
          <ScrollReveal>
            {/* Icon */}
            <Image
              src="/eatobiotics-icon.webp"
              alt=""
              width={80}
              height={80}
              className="mx-auto mb-6 h-16 w-16 md:h-20 md:w-20"
            />

            {/* Label */}
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              EatoBiotics — Free Meal Score
            </p>

            {/* Heading */}
            <h1 className="mt-4 font-serif text-5xl font-semibold tracking-tight text-balance sm:text-6xl md:text-7xl">
              <GradientText>Score your meal</GradientText>
            </h1>

            {/* Description */}
            <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              Upload a photo and EatoBiotics scores it for gut health in seconds
              using the 3-Biotics framework — free, no sign-up needed.
            </p>
          </ScrollReveal>

          {/* Three biotics indicator cards */}
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

      {/* ── Upload / Results ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-6 pb-20">
        <Suspense
          fallback={
            <div className="h-64 rounded-2xl border border-dashed border-border animate-pulse" />
          }
        >
          <ShareClient />
        </Suspense>

        <p className="mt-6 text-center text-xs text-muted-foreground/50">
          Photos are not stored · Free, no card needed
        </p>
      </div>
    </div>
  )
}
