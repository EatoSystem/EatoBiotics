"use client"

import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { COHORTS, joinCtaLabel } from "@/lib/waitlist/early-access"
import { useCohort } from "./use-cohort"

/**
 * 100 Systems — the first hundred people, and their food systems.
 *
 * ══ WHAT THIS REPLACED, AND WHY IT IS SMALLER ═══════════════════════════════
 *
 * `FirstCourse` sat at the BOTTOM of the holding page and carried a four-item
 * bullet list, a three-rung ladder timeline, a status line and a CTA — a
 * programme brochure, below everything, for a decision most visitors had
 * already made or not made by then.
 *
 * This says the same thing in a headline, a line and a paragraph, directly
 * under the hero. The ladder is gone: a reader who has just met the product
 * does not need its roadmap, and the section is stronger for having one idea
 * in it. "100 Systems" also extends — 1,000, then 10,000 — without needing a
 * new metaphor, which "The First Course" did not.
 *
 * ══ THE VOCABULARY IT WILL NOT USE ══════════════════════════════════════════
 *
 * No founder, founding member, pioneer, cohort, beta, early adopter or First
 * Course. This is a hundred people whose food systems teach the product what
 * it should become, and the plainest description of that is the true one.
 *
 * ══ AND WHAT IT REFUSES TO DO ═══════════════════════════════════════════════
 *
 * No countdown, no timer, no "X people viewing", no urgency that was not
 * counted. When the count is unavailable `CohortLine`'s rule applies here too:
 * the availability line renders NOTHING rather than a plausible number, and
 * the section still reads correctly without it — the argument for starting
 * small does not depend on scarcity, which is exactly why it can be made
 * calmly.
 */
export function HundredSystems() {
  const cohort = useCohort()
  const first = COHORTS[0]

  return (
    <section id="hundred-systems" className="px-6 pb-24 pt-8 md:pb-32 md:pt-12">
      <div className="mx-auto flex max-w-[760px] flex-col items-center text-center">
        <ScrollReveal>
          <h2 className="font-serif text-[2.75rem] font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            {first.through} Systems
          </h2>
          <p className="mt-4 font-serif text-xl font-semibold sm:text-2xl">
            <span style={{ color: "var(--icon-green)" }}>{first.through} people.</span>{" "}
            <span style={{ color: "var(--icon-orange)" }}>{first.through} food systems.</span>
          </p>
          <p className="mx-auto mt-6 max-w-[52ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            EatoBiotics is beginning with {first.through} people and their individual food
            systems. Each one will help us learn how EatoBiotics can better understand,
            support and evolve The Food System Inside You.
          </p>
        </ScrollReveal>

        {/*
          The artwork, and an honest note about it.

          The direction for this section was a crowd of individual figures, each
          with their own food system. No such asset exists: the library holds
          one- and two-figure compositions, and `family-hero.png` — the nearest
          to a group — is the Family product's artwork and would signal the
          wrong product here.

          This is the closest the library gets, and the only one whose
          composition suggests more people than are in frame: two figures, and a
          third receding into a network of connected nodes. It is a substitute,
          recorded as one, and swapping in the real artwork is a one-line
          change.
        */}
        <ScrollReveal delay={80} className="w-full">
          <div className="relative mx-auto mt-10 w-full max-w-[720px]" style={{ maxHeight: "min(34vh, 340px)" }}>
            <Image
              src="/eatobiotic-hero.png"
              alt="Individual food systems, each one a person"
              width={1672}
              height={941}
              sizes="(max-width: 768px) 92vw, 720px"
              className="h-auto w-full object-contain"
              style={{ maxHeight: "min(34vh, 340px)" }}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={140} className="w-full">
          {/* Counted, or absent. Never estimated. */}
          {cohort && cohort.isOpen ? (
            <div className="mt-8 flex flex-col items-center">
              <p className="font-serif text-4xl font-bold" style={{ color: "var(--icon-green)" }}>
                {cohort.remaining}{" "}
                <span className="font-sans text-base font-medium tracking-normal text-muted-foreground">
                  systems remaining
                </span>
              </p>
              {/* One dot per system. Informational, not a countdown — it shows
                * how far along a deliberately small programme is, which is the
                * opposite argument to urgency. */}
              <div aria-hidden className="mt-4 flex max-w-[420px] flex-wrap justify-center gap-[5px]">
                {Array.from({ length: cohort.capacity }, (_, i) => (
                  <span
                    key={i}
                    className="h-[7px] w-[7px] rounded-full"
                    style={{
                      background:
                        i < cohort.claimed
                          ? "linear-gradient(135deg, var(--icon-lime), var(--icon-green))"
                          : "color-mix(in srgb, var(--icon-green) 14%, transparent)",
                    }}
                  />
                ))}
              </div>
            </div>
          ) : cohort ? (
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
              {cohort.cohort.name} is full
            </p>
          ) : null}

          <a
            href="#start"
            className="brand-gradient mt-9 inline-flex min-h-[56px] w-full max-w-sm items-center justify-center gap-2.5 whitespace-nowrap rounded-full px-10 py-4 text-base font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:opacity-90 sm:w-auto sm:max-w-none sm:text-lg"
          >
            {joinCtaLabel(cohort)}
            <ArrowRight size={18} aria-hidden />
          </a>

          {/*
            The one line that had to come back.

            Deleting the old section's bullet list took "Food System
            Assessment" off the landing page entirely — the name appeared
            nowhere a visitor could read it without starting the flow. That
            was a real loss, found by an e2e assertion rather than by reading,
            and it is not what "make the section simpler" meant.

            Restored as microcopy rather than as a bullet: one factual line
            about what a place gets, in the same register as "Takes about 5
            minutes. No account required." further down the page.
          */}
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Your place includes the full Food System Assessment when EatoBiotics opens.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
