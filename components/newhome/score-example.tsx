"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Sprout } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ScoreRing } from "@/components/assessment/score-ring"
import { PrimaryCta } from "./cta"

/**
 * Chapter 3 — the Biotics Score through a clearly-labelled example.
 *
 * This is the page's principal proof moment, so it sits high: a visitor should
 * understand what they receive within seconds of arriving. Mirrors the
 * production score card (components/home/score-preview.tsx): rounded-[2rem]
 * bordered card, gradient hairline, Sprout watermark, ScoreRing with in-view
 * count-up, and pillar bars.
 *
 * The third pillar reads "Regenerate" — the brand word. The underlying scoring
 * key is still `heal` (see lib/pillars.ts), but nothing here reads from it;
 * these are display strings for an illustrative example.
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
      label: "Regenerate",
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
    <section id="sample-score" className="scroll-mt-24 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1100px]">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-icon-green">
              What You Receive
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Your Biotics Score, <span className="brand-gradient-text">explained.</span>
            </h2>
            {/* Three outputs, stated plainly. The brief asks for the interface to
                be the focus, so this stays short rather than framing the card
                with explanation. */}
            <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-x-3 gap-y-2">
              {[
                "Your overall Biotics Score",
                "Your strengths and the areas needing support",
                "Practical actions to improve",
              ].map((item) => (
                <li
                  key={item}
                  className="inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-semibold"
                  style={{
                    background: "color-mix(in srgb, var(--icon-green) 12%, transparent)",
                    color: "color-mix(in srgb, var(--icon-green) 82%, var(--foreground))",
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
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
            {/* Floating food accents (decorative) */}
            <div aria-hidden className="pointer-events-none absolute -left-40 top-16 hidden lg:block">
              <div
                className="absolute -inset-4 rounded-full opacity-60 blur-2xl"
                style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--icon-lime) 30%, transparent), transparent 70%)" }}
              />
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-2" style={{ borderColor: "color-mix(in srgb, var(--icon-green) 35%, transparent)" }}>
                <Image src="/food-8.webp" alt="" fill sizes="128px" className="object-cover" />
              </div>
            </div>
            <div aria-hidden className="pointer-events-none absolute -right-36 bottom-24 hidden lg:block">
              <div
                className="absolute -inset-4 rounded-full opacity-60 blur-2xl"
                style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--icon-orange) 28%, transparent), transparent 70%)" }}
              />
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-2" style={{ borderColor: "color-mix(in srgb, var(--icon-orange) 35%, transparent)" }}>
                <Image src="/food-15.webp" alt="" fill sizes="112px" className="object-cover" />
              </div>
            </div>
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
          <div className="mt-10 flex justify-center">
            <PrimaryCta placement="sample_score" size="md" />
          </div>
          <p className="mx-auto mt-6 max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
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
