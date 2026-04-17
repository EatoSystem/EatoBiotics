"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ScoreMock } from "@/components/start/score-mock"

export function StartHero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-28 md:pt-36">
      {/* Subtle background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full"
        style={{
          background: "radial-gradient(ellipse, color-mix(in srgb, var(--icon-green) 8%, transparent), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[640px]">

        {/* Badge */}
        <ScrollReveal>
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
              />
              Free · Takes 2 minutes
            </span>
          </div>
        </ScrollReveal>

        {/* Headline */}
        <ScrollReveal delay={60}>
          <h1 className="text-center font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-balance">
            What&apos;s your{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Food System Score?
            </span>
          </h1>
        </ScrollReveal>

        {/* Tension line */}
        <ScrollReveal delay={100}>
          <p className="mt-4 text-center text-sm font-semibold" style={{ color: "var(--icon-orange)" }}>
            Most people are scoring below 60. Where are you?
          </p>
        </ScrollReveal>

        {/* Subheadline */}
        <ScrollReveal delay={150}>
          <p className="mx-auto mt-4 max-w-md text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
            Discover how your daily food habits are shaping your health,
            energy, and mind — in under 2 minutes.
          </p>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal delay={200}>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/assessment"
              className="brand-gradient w-full max-w-sm inline-flex items-center justify-center gap-2 rounded-full px-8 py-5 text-base font-semibold text-white shadow-xl shadow-icon-green/30 transition-all hover:shadow-2xl hover:shadow-icon-green/40 hover:opacity-90"
            >
              Check your Food System Score
              <ArrowRight size={18} />
            </Link>
            <p className="text-xs text-muted-foreground">
              Free report included &nbsp;·&nbsp; Takes 2 minutes
            </p>
          </div>
        </ScrollReveal>

        {/* Score mock */}
        <ScrollReveal delay={280}>
          <div className="mt-12">
            <ScoreMock />
          </div>
        </ScrollReveal>

        {/* Below mock nudge */}
        <ScrollReveal delay={360}>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Sample score above — check yours in 2 minutes
          </p>
        </ScrollReveal>

      </div>
    </section>
  )
}
