"use client"

import { DOMAIN_PRESENTATION } from "@/lib/fss/presentation/domains"
import { SECTION_COPY, TODAY_COPY } from "@/lib/fss/presentation/system"
import type { ScoreSlice } from "@/lib/fss/system/sections"

/**
 * Score — the number, its provenance, and no band word.
 *
 * ══ WHY THERE IS NO BAND, AND WHY THAT IS NOT AN OVERSIGHT ══════════════════
 *
 * `FSS_V1_PROVENANCE.interpretationVersion` is `"interpretation-v1.0"`, and
 * `lib/fss/interpretation/bands.ts` registers no ladder under that name ON
 * PURPOSE — so `getScoreBand(score, provenance.interpretationVersion)` throws.
 * No reviewer has said what 67 means. "Good", "moderate", "needs work" are all
 * interpretations, and inventing one here would be this component deciding a
 * methodology question.
 *
 * So the number is shown with what produced it, and the reader is told how much
 * of the instrument it rests on. That is everything we can honestly say.
 *
 * ══ THE PROVENANCE IS SHOWN, NOT HIDDEN ═════════════════════════════════════
 *
 * Five version fields on screen look like debug output and are not: the live
 * defect this whole programme exists to prevent is a score with no record of
 * which method made it. A reviewer walking this surface needs to see them, and
 * a person is entitled to.
 */
export function ScoreSection({ slice }: { slice: ScoreSlice }) {
  const { score, provenance } = slice

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">{SECTION_COPY.score.label}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {SECTION_COPY.score.says}
        </p>
      </header>

      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {TODAY_COPY.scoreLabel}
        </p>
        {score.state === "scored" && typeof score.score === "number" ? (
          <p className="mt-2 font-serif text-5xl font-bold tabular-nums">{score.score}</p>
        ) : (
          /* A withheld score is not a zero and must not render as one. */
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Not enough of the assessment was answered to put one number on it.
          </p>
        )}
        <p className="mt-3 text-sm text-muted-foreground tabular-nums">
          Based on {Math.round(score.completeness * 100)}% of the assessment.
        </p>
      </div>

      <section>
        <h2 className="font-serif text-xl font-bold">The five domains</h2>
        <ul className="mt-4 space-y-3">
          {score.domains.map((d) => {
            const meta = DOMAIN_PRESENTATION[d.domain as keyof typeof DOMAIN_PRESENTATION]
            if (!meta) return null
            return (
              <li
                key={d.domain}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-2xl border p-4"
                style={{ borderColor: "var(--border)", background: "var(--card)" }}
              >
                <span className="font-semibold" style={{ color: meta.color }}>
                  {meta.label}
                </span>
                {d.state === "scored" && typeof d.score === "number" ? (
                  <span className="tabular-nums font-semibold">{d.score}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Not enough answered</span>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-xl font-bold">What produced this number</h2>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {(
            [
              ["Method", provenance.fssMethodVersion],
              ["Assessment", provenance.assessmentVersion],
              ["Questions", provenance.questionSetVersion],
              ["Calculation", provenance.calculationVersion],
              ["Interpretation", provenance.interpretationVersion],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-mono text-xs">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
        {TODAY_COPY.statusNote}
      </p>
    </div>
  )
}
