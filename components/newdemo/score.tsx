"use client"

import { useEffect, useRef, useState } from "react"
import { Sprout } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ScoreRing } from "@/components/assessment/score-ring"
import { PrimaryCta } from "./cta"
import { display, text } from "./tokens"

/**
 * Section 3 — the sample Biotics Score. Copied from
 * components/home/score-preview.tsx essentially as-is: it is the strongest
 * asset on the page and has only moved position (production runs it sixth,
 * here it is third, directly after the process strip).
 *
 * Changes from the production version:
 *   - anchored as #sample-score for the hero's "See a sample result" link
 *   - three outcome lines added beside the card
 *   - the CTA becomes the shared one; production reads "Understand My Food
 *     System", a fourth variant of the same action
 *
 * ScoreRing is imported from components/assessment/ read-only — shared, but not
 * modified, which the brief permits.
 */
const EXAMPLE = {
  overall: 62,
  label: "Good potential",
  pillars: [
    {
      label: "Prebiotics",
      score: 71,
      color: text.lime,
      gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
      description: "Plant diversity & fibre",
    },
    {
      label: "Probiotics",
      score: 38,
      color: text.teal,
      gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))",
      description: "Fermented & live foods",
    },
    {
      label: "Postbiotics",
      score: 67,
      color: text.orange,
      gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))",
      description: "Consistency & rhythm",
    },
  ],
  insight:
    "Prebiotics and Postbiotics are working well — your gut has a solid fibre base and eating rhythm. The opportunity is Probiotics: adding one fermented food daily could measurably shift your gut diversity within weeks.",
}

const OUTCOMES = [
  "Your overall Biotics Score",
  "Your strongest and weakest systems",
  "Your practical next actions",
]

export function Score() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="sample-score" className="scroll-mt-24 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1100px]">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: text.green }}>
              Your Free Biotics Score
            </p>
            <h2 className="font-serif text-4xl font-bold text-foreground sm:text-5xl text-balance">
              What does your score look like?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Here&apos;s an example. After the free assessment you&apos;ll get your own score
              across all three biotics — and what it means for you.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div ref={ref} className="relative mx-auto max-w-2xl">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] opacity-70 blur-3xl"
              style={{
                background:
                  "radial-gradient(60% 60% at 50% 45%, color-mix(in srgb, var(--icon-green) 28%, transparent), transparent 75%)",
              }}
            />
            <div
              className="relative overflow-hidden rounded-[2rem] border-2 bg-card shadow-[0_40px_80px_-32px_rgba(20,37,15,0.45)]"
              style={{ borderColor: "color-mix(in srgb, var(--icon-teal) 40%, transparent)" }}
            >
              <Sprout
                aria-hidden
                size={150}
                className="pointer-events-none absolute -right-8 -top-6 opacity-[0.06]"
                style={{ color: "var(--icon-green)" }}
              />

              <div
                aria-hidden
                className="h-1.5 w-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-orange))",
                }}
              />

              <div className="relative px-7 py-10 sm:px-12 sm:py-11">
                <div className="mb-7 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: text.teal }}>
                    Biotics Score — Example
                  </p>
                  <span
                    className="shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                    style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
                  >
                    {EXAMPLE.label}
                  </span>
                </div>

                <div className="mb-9 flex justify-center">
                  <ScoreRing
                    score={inView ? EXAMPLE.overall : 0}
                    color="var(--icon-green)"
                    gradientId="newdemo-score-ring"
                    /* profileType omitted: it renders a 10px label inside the
                       ring at 2.6:1, and ScoreRing is shared so it cannot be
                       restyled here. The "Good potential" badge above already
                       carries the same information. */
                    className="relative mx-auto h-56 w-56 sm:h-72 sm:w-72"
                  />
                </div>

                <div className="mb-7 flex flex-col gap-5">
                  {EXAMPLE.pillars.map(({ label, score, color, gradient, description }) => (
                    <div key={label}>
                      <div className="mb-2 flex items-baseline justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-base font-semibold text-foreground">{label}</span>
                          <span className="ml-2 text-sm text-muted-foreground">{description}</span>
                        </div>
                        <span className="font-serif text-base font-bold" style={{ color }}>
                          {score}
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full motion-reduce:transition-none"
                          style={{
                            width: inView ? `${score}%` : "0%",
                            background: gradient,
                            transition: "width 900ms ease-out",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="rounded-2xl px-5 py-4 text-base leading-relaxed text-muted-foreground"
                  style={{ background: "color-mix(in srgb, var(--icon-green) 7%, var(--card))" }}
                >
                  <span className="font-semibold text-foreground">What this means: </span>
                  {EXAMPLE.insight}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* The three outputs, stated plainly beneath the card. */}
        <ScrollReveal delay={140}>
          <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-x-3 gap-y-2">
            {OUTCOMES.map((o) => (
              <li
                key={o}
                className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold"
                style={{
                  background: "color-mix(in srgb, var(--icon-green) 12%, transparent)",
                  color: text.green,
                }}
              >
                {o}
              </li>
            ))}
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={180}>
          <div className="mt-10 text-center">
            <PrimaryCta />
            <p className="mt-4 text-sm text-muted-foreground">
              Takes about 3 minutes. No account required.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
