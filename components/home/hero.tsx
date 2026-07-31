"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { HeroVideo } from "@/components/hero-video"
import { WaitlistSocialProof } from "@/components/waitlist/social-proof"

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-24 pb-20 md:pt-28 md:pb-28">
      <div className="relative z-10 mx-auto flex max-w-[1280px] min-h-[calc(100vh-140px)] flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-24">

        {/* ── Left: Image ──── */}
        <ScrollReveal delay={60} className="flex-1 flex items-center justify-center w-full max-w-[660px]">
          <div className="relative w-full">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 blur-3xl"
              style={{ background: "radial-gradient(60% 60% at 50% 48%, rgba(76,182,72,0.20), rgba(45,170,110,0.12) 55%, transparent 78%)" }}
            />
            <HeroVideo
              posterSrc="/videos/food-system-hero-poster.jpg"
              webmSrc="/videos/food-system-hero.webm"
              mp4Src="/videos/food-system-hero.mp4"
              alt="The food system inside you — animated gut microbiome figure"
              className="w-full h-auto max-h-[70vw] object-contain md:max-h-none"
            />
          </div>
        </ScrollReveal>

        {/* ── Right: Text ── */}
        <div className="flex-1 text-left max-w-[600px]">
          <ScrollReveal>
            <h1
              className="font-serif text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl text-balance"
            >
              <span style={{ color: "var(--icon-green)" }}>The Food System</span>{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Inside You
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Your digestion, energy, cravings, gut comfort, mood, daily rhythm, and relationship
              with food are connected. EatoBiotics helps you understand your own food system, see
              how it is being fed, and take practical steps to improve it over time.
            </p>
            <p className="mt-4 max-w-md text-base font-medium leading-relaxed text-foreground">
              Understand the Food System Inside You. Learn how to feed it better. Watch it improve.
            </p>
          </ScrollReveal>

          {/* One action, not two. This previously offered "Analyse a Meal Free"
              (→ /analyse) beside "Get My Food System Score" (→ /assessment),
              which left the hero with no dominant next step and led with the
              tool rather than the thing the rest of the page is about.

              /assessment is unchanged — it was already the second button's
              target and is where every other "Understand My Food System" on the
              site points (nav, score-preview, closing-cta, how-it-works,
              start/sticky-cta, method). It renders the You/Family chooser.

              The arrow is an aria-hidden icon, not a literal "→": the accessible
              name has to be exactly "Understand My Food System", and a literal
              arrow glyph inside the link text gets announced by several screen
              readers. */}
          <ScrollReveal delay={200}>
            <div className="mt-8">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2.5 rounded-full px-10 py-5 text-lg font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:shadow-2xl hover:shadow-icon-green/35 hover:opacity-90"
              >
                Understand My Food System <ArrowRight size={20} aria-hidden />
              </Link>
              <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
                Begin with your personal assessment.
              </p>
            </div>
          </ScrollReveal>

          {/* Credibility, not a feature list. The three terms are deliberately
              one colour: tinting them with the lime/teal/orange pillar hues
              would draw a one-to-one Feed = Prebiotics mapping, and Regenerate
              is defined in feed-seed-heal.tsx as rhythm, pace and rest rather
              than as postbiotic foods. The dots are decorative elements, not
              text, so they carry no contrast obligation and screen readers read
              the three terms in order with nothing between them. */}
          <ScrollReveal delay={320}>
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Built on the 3 Biotics
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm font-medium text-foreground">
                <span>Prebiotics</span>
                <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-border" />
                <span>Probiotics</span>
                <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-border" />
                <span>Postbiotics</span>
              </div>
            </div>
            <WaitlistSocialProof />
          </ScrollReveal>
        </div>

      </div>
    </section>
  )
}
