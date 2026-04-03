"use client"

import { ScrollReveal } from "@/components/scroll-reveal"
import { IPhoneCarousel } from "@/components/app/iphone-carousel"
import { Smartphone, BarChart3, Utensils, Activity, Apple, ArrowRight } from "lucide-react"
import Link from "next/link"

const FEATURES = [
  {
    icon: BarChart3,
    title: "Biotics Score",
    description: "A 0–100 score across Pre, Pro, and Post — see exactly how your meals perform.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    href: "/analyse",
  },
  {
    icon: Utensils,
    title: "Meal Analysis",
    description: "Photograph or describe any meal — get scored for all three biotic types instantly.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    href: "/analyse",
  },
  {
    icon: Activity,
    title: "Progress Tracking",
    description: "See your streak, trend direction, and best day — your food system over time.",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    href: "/account",
  },
  {
    icon: Apple,
    title: "Food Library",
    description: "50+ foods with full Pre, Pro, Post biotic breakdowns and pairing tips.",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    href: "/food",
  },
]

export function AppShowcase() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
<div className="relative z-10 mx-auto max-w-[1200px]">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
            >
              <Smartphone size={26} className="text-white" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
              The Platform — Live Now
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              Your Personal Food System Platform
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Assess, score, log, and improve — all in one place. EatoBiotics learns from
              your meals and builds a living picture of your food system over time.
            </p>
          </div>
        </ScrollReveal>

        {/* Two-column: Phone + Feature cards */}
        <div className="mt-12 flex flex-col items-center gap-12 md:flex-row md:gap-16 lg:gap-20">
          {/* Left: iPhone carousel */}
          <ScrollReveal>
            <IPhoneCarousel />
          </ScrollReveal>

          {/* Right: Feature cards */}
          <div className="flex-1 space-y-3">
            {FEATURES.map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 80}>
                <Link href={feature.href} className="group block">
                  <div className="relative overflow-hidden rounded-xl border border-border bg-background p-4 transition-all group-hover:border-current/30 group-hover:shadow-md sm:p-5">
                    {/* Gradient left accent */}
                    <div
                      className="absolute top-0 bottom-0 left-0 w-1"
                      style={{ background: feature.gradient }}
                    />

                    <div className="flex items-center gap-4 pl-3">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ background: feature.gradient }}
                      >
                        <feature.icon size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-serif text-base font-semibold text-foreground">
                          {feature.title}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                      <ArrowRight
                        size={16}
                        className="flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ color: feature.color }}
                      />
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <ScrollReveal delay={200}>
          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/assessment"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
            >
              Start Free Assessment <ArrowRight size={16} />
            </Link>
            <Link
              href="/account"
              className="inline-block rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-muted"
            >
              Go to Dashboard
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
