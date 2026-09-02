"use client"

import { ScrollReveal } from "@/components/scroll-reveal"
import type { PillarInsight } from "@/lib/assessment-scoring"

/**
 * How the three relate — what looks strongest, what looks most worth exploring.
 *
 * No new algorithm: `insights` already arrives sorted weakest-first from
 * getInsights(), so the first is the pathway to explore and the last is the
 * strongest. Inventing a second derivation to produce nicer prose would mean
 * two answers to the same question.
 *
 * The section this replaces was titled "Weakest pillar callout" and led with
 * "Your biggest opportunity". A low score here is a place worth exploring, not
 * a failure and not a deficiency — so no "weakest", no traffic lights, no
 * ranking, and no red.
 *
 * When the three come out equal there is no pattern to report, and saying one
 * "appears strongest" would be false — visual validation of an all-zero sheet
 * showed a card headed "Appears strongest" whose own text called that Biotic
 * the thinner part. Equality is read from the scores themselves rather than
 * from a tolerance: a "close enough" threshold would be a number nobody chose.
 *
 * `focus` (the weakest of the three) is not guaranteed to have an
 * `opportunity`: getInsights() sets that field only below its own strength
 * threshold, independently per pillar, so a result where all three are high
 * but unequal (e.g. 70/75/90) leaves the weakest with only a `strength`. The
 * "Most worth exploring" card only renders when `focus.opportunity` exists —
 * otherwise it would show strength copy under a heading calling it something
 * to explore, the same class of contradiction the equal-scores case above
 * was fixed for.
 */
export function FoodSystemPattern({ insights }: { insights: PillarInsight[] }) {
  if (insights.length === 0) return null

  const focus = insights[0]
  const strongest = insights[insights.length - 1]
  const sameOne = focus.pillar === strongest.pillar
  const level = !sameOne && focus.score === strongest.score
  const showExploring = !sameOne && !!focus.opportunity

  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-2xl">
        <ScrollReveal>
          <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            Your Pattern
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            How your three Biotics sit relative to each other, based on what you reported.
          </p>
        </ScrollReveal>

        {level ? (
          <ScrollReveal>
            <div className="mt-6 rounded-2xl border border-border bg-background p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                All three sit level
              </p>
              <p className="mt-1.5 text-base font-semibold text-foreground">
                No single stand-out
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Your three Biotics came out at the same score, so none of them reads as
                stronger or thinner than the others. The action below is a place to start.
              </p>
            </div>
          </ScrollReveal>
        ) : (
          <div className={`mt-6 grid gap-3 ${showExploring ? "sm:grid-cols-2" : ""}`}>
            <ScrollReveal>
              <div
                className="h-full rounded-2xl border p-5"
                style={{
                  borderColor: `color-mix(in srgb, ${strongest.color} 30%, var(--border))`,
                  background: `color-mix(in srgb, ${strongest.color} 5%, var(--background))`,
                }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: strongest.color }}
                >
                  Appears strongest
                </p>
                <p className="mt-1.5 text-base font-semibold text-foreground">
                  {strongest.label}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {strongest.strength ?? strongest.opportunity}
                </p>
              </div>
            </ScrollReveal>

            {showExploring && (
              <ScrollReveal delay={60}>
                <div className="h-full rounded-2xl border border-border bg-background p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Most worth exploring
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-foreground">
                    {focus.label}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {focus.opportunity}
                  </p>
                </div>
              </ScrollReveal>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
