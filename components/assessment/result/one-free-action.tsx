"use client"

import { ScrollReveal } from "@/components/scroll-reveal"

/**
 * One thing worth trying, before anything is sold.
 *
 * The free Assessment has to leave someone with something useful whether or not
 * they ever pay. This takes the first entry of the result's existing
 * `nextActions` — no new recommendation engine, no ungrounded advice — and
 * gives it a place of its own ahead of the Consultation block.
 *
 * Deliberately promises nothing. No "raise your score by", no "fix your gut",
 * no timeframe: an action that arrives with a predicted outcome stops being
 * something to try and becomes a claim to keep.
 */
export function OneFreeAction({
  action,
  localSuggestion,
}: {
  action?: string
  /** A country-aware food suggestion, when one is available. */
  localSuggestion?: string
}) {
  if (!action) return null

  return (
    <section className="border-t border-border bg-secondary/10 px-6 py-14">
      <div className="mx-auto max-w-2xl">
        <ScrollReveal>
          <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            One thing you can try
          </h2>
          <div className="mt-5 rounded-2xl border border-border bg-background p-6">
            <p className="text-base leading-relaxed text-foreground">{action}</p>
            {localSuggestion && (
              <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
                {localSuggestion}
              </p>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground/70">
            Small and specific on purpose. Notice how it settles before adding anything else.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
