"use client"

import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { COHORTS, FIRST_COURSE_MEMBERS, joinCtaLabel } from "@/lib/waitlist/early-access"
import { useCohort } from "./use-cohort"

/**
 * The First Course — why access opens in stages.
 *
 * ── What this section has to avoid saying ───────────────────────────────────
 *
 * "100 places" can read two ways: *we are deliberately learning before we
 * scale*, or *we could only find a hundred people*. The ladder below is here
 * to make the first reading the obvious one — the hundred is the first rung of
 * a thousand, not the ceiling.
 *
 * ── And what it refuses to do ───────────────────────────────────────────────
 *
 * No countdown, no timer, no "X people viewing", no popup, no urgency that was
 * not counted. When the count is unavailable the number simply is not shown
 * and the section still makes sense: the staged-access argument does not
 * depend on scarcity, which is precisely why it can be stated calmly.
 */
export function FirstCourse() {
  const cohort = useCohort()
  const first = COHORTS[0]

  return (
    <section id="first-course" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1100px]">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-icon-green">
            The First Course
          </p>
          <h2 className="mt-5 max-w-2xl font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl md:text-6xl text-pretty">
            Be one of the first {first.through}.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            We&rsquo;re starting EatoBiotics with {first.through} people before expanding to our
            first {FIRST_COURSE_MEMBERS.toLocaleString("en-IE")} Founding Members.
          </p>
        </ScrollReveal>

        <div className="mt-14 flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-20">
          {/* What being in the first cohort actually involves. */}
          <ScrollReveal delay={80} className="lg:w-[440px] lg:shrink-0">
            <ul className="flex flex-col gap-5">
              {[
                "Complete your 60-second assessment.",
                "Discover your first Biotics Score™.",
                // What joining actually gets you, and the only place on the
                // page a visitor meets the free product by name. The 60-second
                // run is five questions; the Food System Assessment is the
                // fifteen-question product it is a doorway to, so naming both
                // in one list is what keeps the two from being read as one.
                "Be first to take the full Food System Assessment when EatoBiotics opens.",
                "Help us learn what works, what doesn’t, and what EatoBiotics should become.",
              ].map((line, i) => (
                <li key={line} className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-serif text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-base leading-relaxed text-foreground">{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              {cohort ? (
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
                  {cohort.isOpen
                    ? `${cohort.remaining} of ${cohort.capacity} places remaining`
                    : `${cohort.cohort.name} is full`}
                </p>
              ) : null}
              <a
                href="#start"
                className="brand-gradient mt-4 inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-full px-9 py-4 text-base font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:opacity-90"
              >
                {joinCtaLabel(cohort)}
                <ArrowRight size={18} aria-hidden />
              </a>
            </div>
          </ScrollReveal>

          {/* The ladder. Deliberately staged, not a small project. */}
          <ScrollReveal delay={160} className="flex-1">
            <ol className="flex flex-col">
              {COHORTS.map((c, i) => {
                const isOpenRung = cohort ? cohort.index === i : i === 0
                const capacity = i === 0 ? c.through : c.through - COHORTS[i - 1].through
                return (
                  <li key={c.id} className="relative flex gap-5 pb-10 last:pb-0">
                    {i < COHORTS.length && (
                      <span
                        aria-hidden
                        className="absolute left-[7px] top-5 h-full w-px bg-border last:hidden"
                      />
                    )}
                    <span
                      aria-hidden
                      className="relative mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-background"
                      style={{
                        background: isOpenRung
                          ? "linear-gradient(135deg, var(--icon-lime), var(--icon-green))"
                          : "var(--border)",
                      }}
                    />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {isOpenRung ? "Now" : i === 0 ? "First" : "Then"}
                      </p>
                      <h3 className="mt-1.5 font-serif text-2xl font-semibold text-foreground">
                        {c.name}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {i === 0
                          ? `${capacity} places · the first live cohort`
                          : `${c.through.toLocaleString("en-IE")} Founding Members in total`}
                        {cohort && cohort.index === i && cohort.isOpen
                          ? ` · ${cohort.remaining} remaining`
                          : ""}
                      </p>
                    </div>
                  </li>
                )
              })}

              <li className="flex gap-5">
                <span
                  aria-hidden
                  className="mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-background bg-border"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Then
                  </p>
                  <h3 className="mt-1.5 font-serif text-2xl font-semibold text-foreground">
                    Open wider
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Once we know it works for the people already inside.
                  </p>
                </div>
              </li>
            </ol>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
