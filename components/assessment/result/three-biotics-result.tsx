import { Leaf, Wheat, FlaskConical, Clock, Heart } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { BIOTIC_INTRO, bioticOf, type Biotic } from "@/lib/assessment/biotics"
import type { PillarInsight } from "@/lib/assessment-scoring"

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
 * BIOTIC_INTRO is reused from lib/assessment/biotics.ts rather than restated —
 * the same three lines the questions introduced, including the Postbiotics
 * wording that stays on reported patterns and claims no metabolite, SCFA,
 * microbial or laboratory measurement.
 *
 * ══ WHY THERE IS NO NUMBER AND NO BAR ═══════════════════════════════════════
 *
 * Each card carried `{insight.score}`, an "{label}: {score} out of 100"
 * announcement and a bar filled to that percentage. "Postbiotics: 64 out of
 * 100" is a personal postbiotic state expressed as a number, which
 * POSTBIOTICS_INFERENCE_BOUNDARY prohibits by name — "personal Postbiotics
 * state", "low Postbiotics", and the relationships quantify / indicate /
 * reflect. The other two were the same shape of claim with a weaker spotlight.
 *
 * Under the strict ISAPP definitions the product now holds, none of the three
 * is something a questionnaire can measure in a person: a prebiotic is a
 * substrate that is selectively utilised AND confers a benefit; a probiotic is
 * a characterised live organism with a demonstrated benefit; a postbiotic is a
 * preparation. Fifteen self-reported answers reach none of them.
 *
 * So the Biotics keep every bit of their prominence — the heading, the order,
 * the colour, the icon, the meaning line and the interpretation that explains
 * what to do — and lose only the number that claimed to measure them. The
 * overall Biotics Score™ above is untouched and computed by the same
 * arithmetic. The same change was made to the pre-launch reveal in Tranche 1;
 * this is the canonical result catching up with it, so the product stops
 * answering the same question two different ways.
 *
 * The scored dimensions that will eventually carry numbers here (Diversity,
 * Plants & Fibre, Fermented Foods, Food Quality, Meal Rhythm) are FSS-v1
 * CANDIDATE domains — frozen for scientific review and not yet approved.
 */
export function ThreeBioticsResult({ insights }: { insights: PillarInsight[] }) {
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
              <BioticCard insight={insight} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function BioticCard({ insight }: { insight: PillarInsight }) {
  const Icon = ICON_MAP[insight.icon] ?? Leaf

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
          <p className="text-base font-semibold text-foreground">{insight.label}</p>

          {meaning && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{meaning}</p>
          )}

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {insight.strength ?? insight.opportunity}
          </p>
        </div>
      </div>
    </div>
  )
}
