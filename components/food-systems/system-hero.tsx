import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { HeroStage } from "@/components/digital-twin/hero-stage"
import { DigitalTwinFigure } from "@/components/digital-twin/parts"

/**
 * /food-systems hero — "One Food System. Many ways to support it."
 * Two-column: the platform story left, the living figure in the cinematic
 * HeroStage right. White background, premium lighting, brand palette only.
 */
export function SystemHero() {
  return (
    <section className="relative overflow-hidden px-6 pt-28 pb-12 md:pt-36 md:pb-16">
      {/* soft ambient wash behind the whole hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 mx-auto h-[560px] max-w-[1100px] opacity-60 blur-3xl"
        style={{ background: "radial-gradient(50% 50% at 50% 35%, rgba(168,224,99,0.14), rgba(45,170,110,0.08) 45%, transparent 75%)" }}
      />
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
        <ScrollReveal>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-icon-green">The Platform</p>
            <h1 className="mt-4 font-serif text-5xl font-bold leading-[1.05] text-foreground sm:text-6xl lg:text-7xl text-balance">
              One Food System.
              <br />
              <span className="brand-gradient-text">Many ways to support it.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Everything starts with your Food System. From there you can strengthen specific
              aspects of your health, support important life stages, and continue learning
              throughout your life.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/25 transition-all hover:-translate-y-0.5 hover:opacity-95"
              >
                Understand My Food System <ArrowRight size={18} />
              </Link>
              <Link
                href="#foundation-systems"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-4 text-base font-semibold text-foreground transition-colors hover:border-icon-green/50 hover:text-icon-green"
              >
                Explore Food Systems
              </Link>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <HeroStage>
            <DigitalTwinFigure size={520} src="/images/couple-hero.png" alt="The Food System inside you" priority />
          </HeroStage>
        </ScrollReveal>
      </div>
    </section>
  )
}
