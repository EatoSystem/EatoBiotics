"use client"

import { useEffect, useState } from "react"
import { Leaf, Wheat, FlaskConical, Clock, Heart } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { BIOTIC_INTRO, bioticOf, type Biotic } from "@/lib/assessment/biotics"
import type { PillarInsight } from "@/lib/assessment-scoring"
import { usePrefersReducedMotion } from "./use-reduced-motion"

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Leaf,
  Wheat,
  FlaskConical,
  Clock,
  Heart,
}

/**
 * The three Biotics, with their meaning attached — moved ahead of the €49 block.
 *
 * This section used to sit AFTER the Consultation CTA and after the
 * report-features block, so the only interpretation a customer got before being
 * sold to was a "weakest pillar" callout that closed by advertising the paid
 * plan. The free result now stands on its own.
 *
 * The three bars come from the score reveal, where they competed with the
 * number; here they sit with the interpretation that explains them, so each
 * Biotic appears once rather than twice within a screen of itself.
 *
 * BIOTIC_INTRO is reused from lib/assessment/biotics.ts rather than restated —
 * the same three lines the questions introduced, including the Postbiotics
 * wording that stays on reported patterns and claims no metabolite, SCFA,
 * microbial or laboratory measurement.
 */
export function ThreeBioticsResult({ insights }: { insights: PillarInsight[] }) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <section className="border-t border-border bg-secondary/10 px-6 py-14">
      <div className="mx-auto max-w-2xl">
        <ScrollReveal>
          <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            Your Three Biotics
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your answers read through three pathways. Together they make up your Biotics
            Score™.
          </p>
        </ScrollReveal>

        <div className="mt-8 space-y-4">
          {insights.map((insight, i) => (
            <ScrollReveal key={insight.pillar} delay={i * 60}>
              <BioticCard insight={insight} index={i} reducedMotion={reducedMotion} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function BioticCard({
  insight,
  index,
  reducedMotion,
}: {
  insight: PillarInsight
  index: number
  reducedMotion: boolean
}) {
  const [visible, setVisible] = useState(reducedMotion)
  const Icon = ICON_MAP[insight.icon] ?? Leaf

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true)
      return
    }
    const t = setTimeout(() => setVisible(true), 200 + index * 120)
    return () => clearTimeout(t)
  }, [index, reducedMotion])

  /* The canonical Biotic name, when the insight's label is one. Family and Mind
   * insights are not Biotics, so this falls back to the label they carry. */
  const biotic = bioticOf(insight.label) as Biotic | null
  const meaning = biotic ? BIOTIC_INTRO[biotic] : null

  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: insight.gradient }}
          aria-hidden
        >
          <Icon size={17} className="text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-base font-semibold text-foreground">{insight.label}</p>
            {/* The score is announced with its name, so it never depends on the
              * bar's colour or its position in the list to mean anything. */}
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: insight.color }}
              aria-hidden
            >
              {insight.score}
            </span>
            <span className="sr-only">
              {insight.label}: {insight.score} out of 100.
            </span>
          </div>

          {meaning && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{meaning}</p>
          )}

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/40" aria-hidden>
            <div
              className="h-full rounded-full"
              style={{
                width: visible ? `${insight.score}%` : "0%",
                background: insight.gradient,
                transition: reducedMotion
                  ? "none"
                  : `width 800ms cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 100}ms`,
              }}
            />
          </div>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {insight.strength ?? insight.opportunity}
          </p>
        </div>
      </div>
    </div>
  )
}
