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
    <section id="hundred-systems" className="px-6 pb-28 pt-16 md:pb-40 md:pt-24">
      {/*
        The container is the HERO's width, not a text column.

        It was max-w-[760px], which was fine while the artwork was small and
        became the thing stopping it growing: the image is 1672×941, so at a
        480px height cap it wants ~850px of width and a 760px box simply
        refuses it. The measure that matters is the PARAGRAPH's, and that is
        set on the paragraph. Everything else may use the room.
      */}
      <div className="mx-auto flex max-w-[1100px] flex-col items-center text-center">
        <ScrollReveal>
          {/* The page's SECOND major moment, so it is sized like one. The
            * headline was a step below the hero's and read as a sub-section. */}
          <h2 className="font-serif text-[3.5rem] font-bold leading-[1.02] tracking-tight text-foreground sm:text-6xl md:text-7xl">
            {first.through} Systems
          </h2>
          <p className="mt-5 font-serif text-2xl font-semibold sm:text-3xl">
            <span style={{ color: "var(--icon-green)" }}>{first.through} people.</span>{" "}
            <span style={{ color: "var(--icon-orange)" }}>{first.through} food systems.</span>
          </p>
          {/* Two sentences, set as two lines. The rhythm the shorter copy buys
            * is only visible if the break survives — reflowed into one block it
            * reads as the paragraph it replaced. */}
          {/* Two sentences, set as two blocks and BALANCED individually.
            * Without text-balance the first one dropped "systems." onto a line
            * of its own at desktop, which is exactly the carelessness an
            * editorial page cannot afford in its second headline moment. */}
          <p className="mx-auto mt-7 max-w-[52ch] text-lg leading-relaxed text-muted-foreground sm:text-xl">
            <span className="block text-balance">
              EatoBiotics is beginning with {first.through} people and their individual food systems.
            </span>
            <span className="mt-1.5 block text-balance">
              Each one will help us learn, improve and evolve The Food System Inside You.
            </span>
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
          {/* `-mx-6 sm:mx-0`: on a phone the image is bounded by the section's
            * horizontal padding, not by the height cap — 342px of a 390px
            * screen. Reaching the edges is the only growth available there,
            * and edge-to-edge artwork is the right idiom for it anyway. */}
          <div className="relative -mx-6 mt-14 w-[calc(100%+3rem)] max-w-none sm:mx-auto sm:w-full sm:max-w-[980px]" style={{ maxHeight: "min(46vh, 480px)" }}>
            <Image
              src="/eatobiotic-hero.png"
              alt="Individual food systems, each one a person"
              width={1672}
              height={941}
              sizes="(max-width: 768px) 94vw, 980px"
              className="h-auto w-full object-contain"
              style={{ maxHeight: "min(46vh, 480px)" }}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={140} className="w-full">
          {/* Counted, or absent. Never estimated. */}
          {cohort && cohort.isOpen ? (
            <div className="mt-12 flex flex-col items-center">
              {/* A fact about a small programme, sized to be read rather than
                * noticed. It was microcopy under a large image and disappeared. */}
              <p className="font-serif text-5xl font-bold sm:text-6xl" style={{ color: "var(--icon-green)" }}>
                {cohort.remaining}{" "}
                <span className="font-sans text-lg font-medium tracking-normal text-muted-foreground sm:text-xl">
                  systems remaining
                </span>
              </p>
              {/* One dot per system. Informational, not a countdown — it shows
                * how far along a deliberately small programme is, which is the
                * opposite argument to urgency. */}
              <div aria-hidden className="mt-6 flex max-w-[560px] flex-wrap justify-center gap-[7px]">
                {Array.from({ length: cohort.capacity }, (_, i) => (
                  <span
                    key={i}
                    className="h-[9px] w-[9px] rounded-full"
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
            <p className="mt-12 text-base font-semibold uppercase tracking-[0.16em] text-foreground">
              {cohort.cohort.name} is full
            </p>
          ) : null}

          <a
            href="#start"
            className="brand-gradient mt-11 inline-flex min-h-[64px] w-full max-w-md items-center justify-center gap-3 whitespace-nowrap rounded-full px-12 py-5 text-lg font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:opacity-90 sm:w-auto sm:max-w-none sm:text-xl"
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
          {/* Quieter than before, deliberately: the CTA above it grew, and a
            * footnote that keeps pace with the button stops being a footnote. */}
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground/80">
            Your place includes the full Food System Assessment when EatoBiotics opens.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
