"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ScoreMockFamily } from "@/components/start-family/score-mock-family"

export function StartFamilyHero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-28 md:pt-36">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(ellipse, color-mix(in srgb, var(--icon-yellow) 7%, transparent), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-[640px]">

        <ScrollReveal>
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }} />
              Family Pathway · Free · 2 minutes
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={60}>
          <h1 className="text-center font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-balance">
            What&apos;s your{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-yellow), var(--icon-orange))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Family Food System Score?
            </span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p className="mt-4 text-center text-sm font-semibold" style={{ color: "var(--icon-orange)" }}>
            Most families are scoring below 60 — without knowing it.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <p className="mx-auto mt-4 max-w-md text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
            Discover how your household&apos;s food habits are shaping every family
            member&apos;s health — in under 2 minutes.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/assessment-family"
              className="brand-gradient w-full max-w-sm inline-flex items-center justify-center gap-2 rounded-full px-8 py-5 text-base font-semibold text-white shadow-xl shadow-icon-green/30 transition-all hover:shadow-2xl hover:shadow-icon-green/40 hover:opacity-90"
            >
              Check your Family Food System Score
              <ArrowRight size={18} />
            </Link>
            <p className="text-xs text-muted-foreground">
              Free report included &nbsp;·&nbsp; Takes 2 minutes
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={280}>
          <div className="mt-12">
            <ScoreMockFamily />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={360}>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Sample score above — check your family&apos;s in 2 minutes
          </p>
        </ScrollReveal>

      </div>
    </section>
  )
}
