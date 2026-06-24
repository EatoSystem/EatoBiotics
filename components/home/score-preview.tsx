"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, Sprout } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ScoreRing } from "@/components/assessment/score-ring"

const EXAMPLE = {
  overall: 62,
  label: "Good potential",
  pillars: [
    {
      label: "Prebiotics",
      score: 71,
      color: "var(--icon-lime)",
      gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
      description: "Plant diversity & fibre",
    },
    {
      label: "Probiotics",
      score: 38,
      color: "var(--icon-teal)",
      gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))",
      description: "Fermented & live foods",
    },
    {
      label: "Postbiotics",
      score: 67,
      color: "var(--icon-orange)",
      gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))",
      description: "Consistency & rhythm",
    },
  ],
  insight:
    "Prebiotics and Postbiotics are working well — your gut has a solid fibre base and eating rhythm. The opportunity is Probiotics: adding one fermented food daily could measurably shift your gut diversity within weeks.",
}

export function ScorePreview() {
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
            <p
              className="mb-3 text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--icon-green)" }}
            >
              Your free EatoBiotics Score
            </p>
            <h2 className="font-serif text-4xl font-bold text-foreground sm:text-5xl text-balance">
              What does your score look like?
            </h2>
            <p className="mt-4 mx-auto max-w-lg text-base text-muted-foreground leading-relaxed">
              Here&apos;s an example. After the free assessment, you&apos;ll get your own score across
              all three biotics — and exactly what it means for you.
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
              {/* Label + profile badge */}
              <div className="mb-7 flex items-center justify-between">
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--icon-teal)" }}
                >
                  EatoBiotics Score — Example
                </p>
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                  style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
                >
                  {EXAMPLE.label}
                </span>
              </div>

              {/* Score ring — counts up when scrolled into view */}
              <div className="mb-9 flex justify-center">
                <ScoreRing
                  score={inView ? EXAMPLE.overall : 0}
                  color="var(--icon-green)"
                  gradientId="homepage-score-ring"
                  profileType={EXAMPLE.label}
                  className="relative mx-auto h-64 w-64 sm:h-72 sm:w-72"
                />
              </div>

              {/* Sub-score bars — fill when scrolled into view */}
              <div className="mb-7 flex flex-col gap-5">
                {EXAMPLE.pillars.map(({ label, score, color, gradient, description }) => (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <span className="text-base font-semibold text-foreground">{label}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{description}</span>
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

              {/* Insight */}
              <div
                className="rounded-2xl px-5 py-4 text-base text-muted-foreground leading-relaxed"
                style={{ background: "color-mix(in srgb, var(--muted) 60%, transparent)" }}
              >
                <span className="font-semibold text-foreground">What this means: </span>
                {EXAMPLE.insight}
              </div>
            </div>
          </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={180}>
          <div className="mt-10 text-center">
            <Link
              href="/assessment"
              className="brand-gradient inline-flex items-center gap-2.5 rounded-full px-10 py-5 text-lg font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:shadow-2xl hover:shadow-icon-green/35 hover:opacity-90"
            >
              Understand My Food System <ArrowRight size={18} />
            </Link>
            <p className="mt-3.5 text-sm text-muted-foreground">
              Takes about 3 minutes. No account required.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
