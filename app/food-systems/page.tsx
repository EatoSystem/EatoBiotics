import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { LivingImage } from "@/components/digital-twin/parts"
import { SystemHero } from "@/components/food-systems/system-hero"
import {
  SystemGroup,
  FoundationSystemCard,
  HealthSystemCard,
  LifeSystemCard,
} from "@/components/food-systems/system-cards"
import { AnimatedConnectionGraphic } from "@/components/food-systems/connection-graphic"
import { TimelineSection } from "@/components/food-systems/timeline-section"
import { FutureSystems } from "@/components/food-systems/future-systems"
import { foundationSystems, healthSystems, lifeSystems, FAMILY_META } from "@/lib/systems"
import { LIFE_SYSTEM_DISCLAIMER } from "@/lib/assessment-disclaimers"

export const metadata: Metadata = {
  title: "Food Systems — One Food System. Many ways to support it. | EatoBiotics",
  description:
    "Everything starts with your Food System. Foundation Systems create your baseline, Health Systems strengthen specific areas, and Life Systems support the biggest transitions — one connected platform built around the Food System Inside You.",
  openGraph: {
    title: "Food Systems | EatoBiotics",
    description:
      "One Food System. Many ways to support it. Foundation, Health, and Life Systems — one connected platform.",
    url: "https://eatobiotics.com/food-systems",
  },
}

function SoftDivider() {
  return (
    <div
      aria-hidden
      className="mx-auto h-px w-full max-w-[1100px]"
      style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--icon-green) 18%, transparent), transparent)" }}
    />
  )
}

/** Section 2 — the philosophy: one living Food System, not a dashboard. */
function Philosophy() {
  return (
    <section className="relative overflow-hidden px-6 py-20 md:py-28">
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
        <ScrollReveal>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-icon-green">The philosophy</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-foreground sm:text-4xl md:text-5xl text-balance">
              The Food System <span className="brand-gradient-text">Inside You.</span>
            </h2>
            <div className="mt-6 space-y-2 text-lg leading-relaxed text-muted-foreground">
              <p>Every person has one Food System.</p>
              <p>It changes with every meal. Every habit. Every stage of life.</p>
              <p className="pt-2 text-foreground/80">
                EatoBiotics helps you understand it, strengthen it, and support it through
                life&apos;s journey — not as a collection of disconnected products, but as one
                living, learning whole.
              </p>
            </div>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={120}>
          <LivingImage
            src="/images/hero-gut.png"
            alt="The living Food System inside you"
            width={640}
            height={640}
            className="mx-auto w-[min(520px,86vw)]"
            sizes="(max-width: 1024px) 86vw, 520px"
          />
        </ScrollReveal>
      </div>
    </section>
  )
}

/** Section 9 — closing CTA, cloned from the homepage ClosingCta pattern. */
function BuildYourFoodSystemCta() {
  return (
    <section className="px-6 pt-16 pb-16 md:pt-20 md:pb-20">
      <div
        className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2.5rem] px-6 py-20 text-center md:py-28"
        style={{ background: "linear-gradient(135deg, #14250F 0%, #1A2E12 45%, #2C3A12 100%)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--icon-green), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--icon-yellow), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }}
        />

        <div className="relative z-10">
          <ScrollReveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-icon-lime">Build Your Food System</p>
            <h2 className="mx-auto max-w-2xl font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl text-balance">
              Understand it. Strengthen it.{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Grow with it.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              One Food System, supported through every part of your health and every stage of your
              life. It all begins with your foundation.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <div className="mt-9 flex justify-center">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-xl shadow-black/30 transition-all hover:opacity-90"
              >
                Understand My Food System <ArrowRight size={16} />
              </Link>
            </div>
            <p className="mt-5 text-xs text-white/55">Takes about 3 minutes. No account required.</p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

export default function FoodSystemsPage() {
  const foundations = foundationSystems()
  const health = healthSystems()
  const life = lifeSystems()

  return (
    <main className="overflow-hidden bg-background">
      {/* 1 — Hero */}
      <SystemHero />
      <SoftDivider />

      {/* 2 — Philosophy */}
      <Philosophy />
      <SoftDivider />

      {/* 3 — Foundation Systems */}
      <SystemGroup
        id="foundation-systems"
        label={FAMILY_META.foundation.label}
        headline={
          <>
            Everything <span className="brand-gradient-text">begins here.</span>
          </>
        }
        blurb="These systems create your Food System baseline. Every other system builds upon them."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {foundations.map((s, i) => (
            <ScrollReveal key={s.key} delay={i * 90}>
              <FoundationSystemCard system={s} />
            </ScrollReveal>
          ))}
        </div>
      </SystemGroup>
      <SoftDivider />

      {/* 4 — Health Systems */}
      <SystemGroup
        id="health-systems"
        label={FAMILY_META.health.label}
        headline={
          <>
            Strengthen <span className="brand-gradient-text">what matters most.</span>
          </>
        }
        blurb="Each Health system is a deeper lens on your foundation — focused support for a specific area of your Food System."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {health.map((s, i) => (
            <ScrollReveal key={s.key} delay={i * 70}>
              <HealthSystemCard system={s} />
            </ScrollReveal>
          ))}
        </div>
      </SystemGroup>
      <SoftDivider />

      {/* 5 — Life Systems */}
      <SystemGroup
        id="life-systems"
        label={FAMILY_META.life.label}
        headline={
          <>
            Support for life&apos;s <span className="brand-gradient-text">biggest moments.</span>
          </>
        }
        blurb="Food-first, human, and gentle — Life systems carry your Food System through the transitions that change everything."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {life.map((s, i) => (
            <ScrollReveal key={s.key} delay={i * 80}>
              <LifeSystemCard system={s} />
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground/80">
            Food-first education only. {LIFE_SYSTEM_DISCLAIMER}
          </p>
        </ScrollReveal>
      </SystemGroup>
      <SoftDivider />

      {/* 6 — Everything connects */}
      <AnimatedConnectionGraphic />
      <SoftDivider />

      {/* 7 — How your Food System evolves */}
      <TimelineSection />
      <SoftDivider />

      {/* 8 — Future Life Systems */}
      <FutureSystems />

      {/* 9 — Closing CTA */}
      <BuildYourFoodSystemCta />
    </main>
  )
}
