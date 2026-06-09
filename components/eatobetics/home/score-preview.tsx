"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ScoreRing } from "@/components/assessment/score-ring"

const ASSESSMENT_HREF = "/eatobetics/assessment"

const EXAMPLE = {
  overall: 64,
  profile: "Stabilising",
  pillars: [
    { label: "Stability", score: 58, color: "var(--icon-orange)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))", description: "Glucose response to meals" },
    { label: "Energy", score: 72, color: "var(--icon-lime)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))", description: "Post-meal energy & focus" },
    { label: "Rhythm", score: 66, color: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))", description: "Timing, spacing & movement" },
  ],
  insight:
    "Energy and rhythm are working in your favour — your meals are reasonably timed and you move through your day well. The biggest opportunity is stability: a little more fibre and protein on your most-repeated meals, plus eating vegetables first, could steady your curve within weeks.",
}

export function EbScorePreview() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1100px]">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>Your free EatoBetics Score</p>
            <h2 className="font-serif text-4xl font-bold text-foreground sm:text-5xl text-balance">What does your score look like?</h2>
            <p className="mt-4 mx-auto max-w-lg text-base text-muted-foreground leading-relaxed">
              Here&apos;s an example. After the free assessment, you&apos;ll get your own score across
              stability, energy, and rhythm — and exactly what it means for you.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="relative mx-auto max-w-lg overflow-hidden rounded-3xl border-2 bg-card shadow-2xl" style={{ borderColor: "color-mix(in srgb, var(--icon-orange) 40%, transparent)" }}>
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange), var(--icon-green), var(--icon-teal))" }} />
            <div className="px-8 py-8">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>EatoBetics Score — Example</p>
                <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}>{EXAMPLE.profile}</span>
              </div>

              <div className="flex justify-center mb-7">
                <ScoreRing score={EXAMPLE.overall} color="var(--icon-orange)" gradientId="eatobetics-score-ring" profileType={EXAMPLE.profile} />
              </div>

              <div className="mb-6 flex flex-col gap-4">
                {EXAMPLE.pillars.map(({ label, score, color, gradient, description }) => (
                  <div key={label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-foreground">{label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{description}</span>
                      </div>
                      <span className="font-serif text-sm font-bold" style={{ color }}>{score}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${score}%`, background: gradient }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl px-4 py-3 text-sm text-muted-foreground leading-relaxed" style={{ background: "color-mix(in srgb, var(--muted) 60%, transparent)" }}>
                <span className="font-semibold text-foreground">What this means: </span>{EXAMPLE.insight}
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={180}>
          <div className="mt-10 text-center">
            <Link href={ASSESSMENT_HREF} className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90">
              Get my EatoBetics Score <ArrowRight size={16} />
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">Free to take. No account needed. Takes about 3 minutes.</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
