"use client"

import { useEffect, useRef, useState } from "react"
import { ScoreRing } from "../score-ring"
import { usePrefersReducedMotion } from "./use-reduced-motion"

/**
 * The first thing a customer sees after fifteen questions.
 *
 * What this replaces carried four things at once — the ring, the count-up, a
 * "Gut Athlete" identity badge, the profile, three pillar bars and an
 * interpretation paragraph — so the number competed with everything around it.
 * Here it carries the score and what the score is, and the rest of the
 * narrative follows below it.
 *
 * The identity badge is gone from this surface. `getIdentityLabel` returns
 * "Gut Athlete" / "Biotic Champion" / "Gut Optimizer" — a second, gamified
 * identity sitting beside the canonical profile, and its own module docblock
 * describes it as a "shareable word" rather than a result. One person-level
 * identity, and it is the profile. The module and its five other callers are
 * untouched: share and OG compatibility is a later phase.
 */
export function BioticsScoreReveal({
  overall,
  color,
  profileType,
}: {
  overall: number
  color: string
  profileType: string
}) {
  const reducedMotion = usePrefersReducedMotion()
  const animated = useCountUp(overall, reducedMotion)

  return (
    <section className="relative overflow-hidden px-6 pb-10 pt-28 sm:pt-32">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, ${color} 12%, transparent), transparent 70%)`,
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
        {/* The page's h1. Before this the results screen had no h1 at all and
          * its outline began at h2 — every section a sibling of every other,
          * with nothing naming the page. This is the result the page exists to
          * deliver, so it is the heading; the pill styling is unchanged. */}
        <h1 className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
          Your Biotics Score™
        </h1>

        <div className="mt-8">
          <ScoreRing
            score={overall}
            color={color}
            gradientId="assessment-ring"
            profileType={profileType}
          />
        </div>

        {/* The number, twice: once for eyes, once for assistive technology.
          *
          * The visible digits tick upward, so they are hidden from the
          * accessibility tree — a screen reader should not be read fifty
          * intermediate numbers, and it should not have to wait 1.6s to learn
          * the answer. The sr-only line carries the FINAL value from first
          * paint, whatever the animation is doing. */}
        <p
          className="mt-5 text-6xl font-bold tabular-nums leading-none"
          style={{ color }}
          aria-hidden
        >
          {animated}
          <span className="text-2xl text-muted-foreground">/100</span>
        </p>
        <p className="sr-only">Your Biotics Score is {overall} out of 100.</p>

        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Biotics Score™
        </p>

        {/* What the number is, and what it is not. Stated once, plainly — the
          * point is to stop it reading as a measurement, not to lawyer it. */}
        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
          Calculated from your answers to the Food System Assessment. It is not a lab test
          and not a ranking against other people.
        </p>
      </div>
    </section>
  )
}

/**
 * Counts to `target`, or lands on it immediately when motion is reduced.
 *
 * Local to the reveal by design: §19 rules out a persistent result-stage
 * machine, and this is the one piece of genuinely local animation state on the
 * page.
 */
function useCountUp(target: number, reducedMotion: boolean, duration = 1200, delay = 300) {
  const [count, setCount] = useState(reducedMotion ? target : 0)
  const startTime = useRef<number | null>(null)
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    if (reducedMotion) {
      setCount(target)
      return
    }
    startTime.current = null
    const timeout = setTimeout(() => {
      const tick = (now: number) => {
        if (!startTime.current) startTime.current = now
        const progress = Math.min((now - startTime.current) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(Math.round(eased * target))
        if (progress < 1) rafId.current = requestAnimationFrame(tick)
      }
      rafId.current = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [target, reducedMotion, duration, delay])

  return count
}
