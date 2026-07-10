"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Sprout } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ScoreRing } from "@/components/assessment/score-ring"

/**
 * Section 2 — the Food System Score through a clearly-labelled example.
 * Mirrors the production score card (components/home/score-preview.tsx):
 * same rounded-[2rem] bordered card, gradient hairline, Sprout watermark,
 * ScoreRing with in-view count-up, and pillar bars — with the concept's
 * Feed/Seed/Heal-first labelling and example insight/action.
 */
const EXAMPLE = {
  overall: 64,
  label: "Illustrative",
  pillars: [
    {
      label: "Feed",
      science: "Prebiotics",
      score: 71,
      color: "var(--icon-lime)",
      gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
    },
    {
      label: "Seed",
      science: "Probiotics",
      score: 42,
      color: "var(--icon-teal)",
      gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))",
    },
    {
      label: "Heal",
      science: "Postbiotics",
      score: 58,
      color: "var(--icon-orange)",
      gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))",
    },
  ],
}

export function ScoreExample() {
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
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1100px]">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-icon-green">
              The Food System Score
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              See the Food System Inside You
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Every person has an internal food system shaped by food, routine, culture, household,
              environment, and daily life. EatoBiotics helps make those patterns understandable —
              starting with one number you can watch change.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div ref={ref} className="relative mx-auto max-w-2xl">
            {/* Subtle green glow around the card */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] opacity-70 blur-3xl"
              style={{ background: "radial-gradient(60% 60% at 50% 45%, color-mix(in srgb, var(--icon-green) 28%, transparent), transparent 75%)" }}
            />
            <div
              className="relative overflow-hidden rounded-[2rem] border-2 bg-card shadow-[0_40px_80px_-32px_rgba(20,37,15,0.45)]"
              style={{ borderColor: "color-mix(in srgb, var(--icon-teal) 40%, transparent)" }}
            >
              {/* Botanical accent */}
              <Sprout
                aria-hidden
                size={150}
                className="pointer-events-none absolute -right-8 -top-6 opacity-[0.06]"
                style={{ color: "var(--icon-green)" }}
              />

              {/* Gradient bar */}
              <div
                className="h-1.5 w-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-orange))",
                }}
              />

              <div className="relative px-9 py-11 sm:px-12">
                {/* Label + example badge */}
                <div className="mb-7 flex items-center justify-between">
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "var(--icon-teal)" }}
                  >
                    Illustrative example — not your data
                  </p>
                  <span
                    className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                    style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
                  >
                    Example
                  </span>
                </div>

                {/* Score ring — counts up when scrolled into view */}
                <div className="mb-9 flex justify-center">
                  <ScoreRing
                    score={inView ? EXAMPLE.overall : 0}
                    color="var(--icon-green)"
                    gradientId="newhome-score-ring"
                    profileType="Food System Score"
                    className="relative mx-auto h-64 w-64 sm:h-72 sm:w-72"
                  />
                </div>

                {/* Pillar bars — Feed/Seed/Heal first, science beneath */}
                <div className="mb-7 flex flex-col gap-5">
                  {EXAMPLE.pillars.map(({ label, science, score, color, gradient }) => (
                    <div key={label}>
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <span className="text-base font-semibold text-foreground">{label}</span>
                          <span className="ml-2 text-sm text-muted-foreground">{science}</span>
                        </div>
                        <span className="font-serif text-base font-bold" style={{ color }}>{score}</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
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

                {/* Example insight + example action */}
                <div
                  className="rounded-2xl px-5 py-4 text-base leading-relaxed text-muted-foreground"
                  style={{ background: "color-mix(in srgb, var(--icon-green) 7%, var(--card))" }}
                >
                  <span className="font-semibold text-foreground">Example insight: </span>
                  Your food variety is strongest at dinner but drops during the working week.
                </div>
                <div
                  className="mt-4 rounded-2xl px-5 py-4 text-base leading-relaxed text-muted-foreground"
                  style={{ background: "color-mix(in srgb, var(--icon-orange) 7%, var(--card))" }}
                >
                  <span className="font-semibold text-foreground">Example action: </span>
                  Add one additional plant food to two weekday lunches this week.
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={180}>
          <p className="mx-auto mt-8 max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
            The score is based on your self-reported food patterns and behaviours. It is an
            educational reflection of how you are feeding your system — not a biological
            measurement, and not a diagnosis.{" "}
            <Link href="/method" className="font-semibold text-icon-green underline underline-offset-2 transition-opacity hover:opacity-80">
              How it works
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
