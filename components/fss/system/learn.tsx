"use client"

import { DOMAIN_PRESENTATION } from "@/lib/fss/presentation/domains"
import { SECTION_COPY, TODAY_COPY } from "@/lib/fss/presentation/system"
import type { LearnSlice } from "@/lib/fss/system/sections"

/**
 * Learn — education chosen by relevance, and not addressed to a body.
 *
 * ══ IT RECEIVES DOMAIN KEYS AND NOTHING ELSE ════════════════════════════════
 *
 * `LEARN.select` hands over the priority domains as bare keys — no score, no
 * evidence, no answers. So "relevant to you" means "about the domain you are
 * working on", which is a statement about a TOPIC. It cannot mean "about what
 * is happening inside you", because nothing here knows anything about that.
 *
 * ══ `whatItMeans` AND `whyItMatters`, NOT A THIRD THING ═════════════════════
 *
 * Both are already reviewed, both are impersonal present tense, and both carry
 * the hedges that took several rounds to get right — fibre is the substrate
 * microbes ferment and is NOT itself called a prebiotic; fermentation brings
 * microbial material in from outside and whether live microorganisms survive
 * depends on the food. Reusing them is the whole point. A "Learn" section that
 * wrote its own explanations would be a second, unreviewed science voice in the
 * one place a reader is most likely to trust it.
 *
 * ══ AND IT PROMISES NOTHING ═════════════════════════════════════════════════
 *
 * No sentence says that reading this, or acting on it, will change a score, a
 * symptom or a microbe. The section offers an explanation of a topic and stops.
 */
export function LearnSection({ slice }: { slice: LearnSlice }) {
  const { domains } = slice

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">{SECTION_COPY.learn.label}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {SECTION_COPY.learn.says}
        </p>
      </header>

      {domains.length === 0 ? (
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          {TODAY_COPY.noFocus}
        </p>
      ) : (
        <div className="space-y-5">
          {domains.map((domain) => {
            const meta = DOMAIN_PRESENTATION[domain]
            return (
              <article
                key={domain}
                className="rounded-2xl border p-6"
                style={{ borderColor: "var(--border)", background: "var(--card)" }}
              >
                <h2 className="font-serif text-xl font-bold" style={{ color: meta.color }}>
                  {meta.label}
                </h2>
                <dl className="mt-4 space-y-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      What this means
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed">{meta.whatItMeans}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Why it matters
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed">{meta.whyItMatters}</dd>
                  </div>
                </dl>
              </article>
            )
          })}
        </div>
      )}

      <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
        {TODAY_COPY.statusNote}
      </p>
    </div>
  )
}
