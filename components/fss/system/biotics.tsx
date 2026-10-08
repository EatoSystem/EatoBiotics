"use client"

import { BioticsProgressPanel } from "@/components/agent-loop/BioticsProgressPanel"
import { SECTION_COPY } from "@/lib/fss/presentation/system"

/**
 * Biotics — the science, taught accurately, and nothing of the person.
 *
 * ══ THIS COMPONENT TAKES NO PROPS, AND THAT IS THE DESIGN ═══════════════════
 *
 * `BIOTICS.select` returns `null`. The section is handed nothing, so there is
 * nothing here to render personally — not a score, not an answer, not a
 * mapping, not a bar. The permanent product rule is:
 *
 *   Measure the food system we can observe. Teach the biology accurately.
 *   Never present the biology as personally measured when it isn't.
 *
 * The third clause is the one that gets broken, and it has been broken four
 * times in four different forms: per-Biotic numbers in a pre-launch reveal, the
 * same on a results page and a public share image, the same in an email months
 * after every page had lost it, and fifteen sites across the agent loop
 * including a member's three Biotic scores drawn onto a public PNG. Every fix
 * was scoped to the form rather than the rule.
 *
 * So the defence here is not wording. It is that the component cannot do it:
 * no data reaches it.
 *
 * ══ AND THE EDUCATION IS NOT DEMOTED ════════════════════════════════════════
 *
 * `BioticsProgressPanel` is the Gate 3.6 rewrite — the three Biotics taught
 * from `PILLARS[*].whatItDoes`, a dot rather than a bar because a bar's length
 * is a quantity, and a closing line saying in so many words that there is no
 * personal score for any of the three. A correction is never a deletion.
 */
export function BioticsSection() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">{SECTION_COPY.biotics.label}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {SECTION_COPY.biotics.says}
        </p>
      </header>
      <BioticsProgressPanel />
    </div>
  )
}
