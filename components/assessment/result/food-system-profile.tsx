"use client"

import type { AssessmentProfile } from "@/lib/assessment-scoring"

/**
 * The pattern the answers suggest — not a verdict about the person.
 *
 * `result.profile` is the canonical identity and the only one on this surface.
 * The framing matters as much as the words: "your answers suggest" rather than
 * "you are", because fifteen self-reported questions describe a pattern someone
 * reported this week, not a fact about their biology.
 *
 * getProfile() and its thresholds are untouched — this displays what they
 * already produce.
 */
export function FoodSystemProfile({ profile }: { profile: AssessmentProfile }) {
  return (
    <section className="px-6 pb-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Your Food System
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: profile.color }}
            aria-hidden
          />
          <h2 className="font-serif text-2xl font-semibold sm:text-3xl" style={{ color: profile.color }}>
            {profile.type}
          </h2>
        </div>

        <p className="mt-3 font-serif text-lg leading-snug text-foreground sm:text-xl">
          {profile.tagline}
        </p>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {profile.description}
        </p>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground/70">
          This is the pattern your answers currently suggest — not a diagnosis, and not
          fixed.
        </p>
      </div>
    </section>
  )
}
