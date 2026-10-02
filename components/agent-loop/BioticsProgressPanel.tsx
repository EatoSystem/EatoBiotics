/**
 * BioticsProgressPanel — the Three Biotics as the science the product teaches.
 *
 * ══ WHAT THIS PANEL USED TO BE, AND WHY IT IS NOT THAT ═══════════════════════
 *
 * It rendered a number and a filled bar for each Biotic — "Prebiotics … 67 ·
 * Strong" — under the heading "Your three biotics", with the strongest tagged
 * "strongest" and the weakest "most room to grow". That is the exact shape
 * Tranche 1 removed from the pre-launch reveal, 2A from /assessment/results,
 * the share card and the generated OG image, and 2C from sequence-email.ts. It
 * survived here because no claims guard had ever read `components/agent-loop`.
 *
 * Under strict ISAPP a questionnaire and a meal photo reach none of the three,
 * and `POSTBIOTICS_INFERENCE_BOUNDARY` prohibits a "personal Postbiotics
 * state" by name. A bar reading `Postbiotics 45` is that state as a number;
 * "most room to grow" is the same state in words, which is why removing only
 * the digits would have moved the claim rather than retired it.
 *
 * ══ THE PROP IS GONE, AND THAT IS THE ACTUAL FIX ═════════════════════════════
 *
 * The signature was `{ biotics: BioticsScore }`. It is now `{ className? }`.
 * This component cannot render a personal Biotic state because IT IS NO LONGER
 * GIVEN ONE — the same absence-as-architecture as `ActionCategoryMeta` having
 * no numeric field, and the same reason `ScoreRing`'s `percentile` prop was
 * deleted at the component rather than at its two call sites: a prop that still
 * exists is an invitation to pass it again.
 *
 * ══ AND THE THREE BIOTICS STAY ═══════════════════════════════════════════════
 *
 * Type D: educational Biotics content is preserved and improved, never demoted
 * for being unscored. All three appear, in canonical order, with equal visual
 * weight and no ranking — because the ranking was the claim. The copy is
 * `PILLARS[key].whatItDoes` from `lib/pillars.ts`, which is the reviewed,
 * claims-corrected vocabulary of record and is already in the guarded corpus;
 * retyping it here would create a second place it lives.
 *
 * Postbiotics reads as the closing statement of the foundation rather than an
 * empty row — the architecture review's §7.1 recommendation, and the honest
 * answer to "why does this one have no number": nothing a person can tell us
 * measures it, and saying so earns the reader's trust in the numbers we do show.
 */

import { PILLARS, PILLAR_ORDER } from "@/lib/pillars"

export function BioticsProgressPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-foreground">The three biotics</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        The science your Biotics Score&trade; is built on. We teach these; what we measure is
        your food.
      </p>

      <div className="mt-4 space-y-4">
        {PILLAR_ORDER.map((key) => {
          const pillar = PILLARS[key]
          return (
            <div key={key} className="flex items-start gap-3">
              {/*
                A dot, not a bar. A bar's LENGTH is a quantity, and there is no
                quantity here — a full-width one would read as "100%" and a
                short one as a low score, which is the claim in a new costume.
              */}
              <span
                className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: pillar.color }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{pillar.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {pillar.whatItDoes}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
        There is no personal score for any of the three. Nothing you can tell us in an
        assessment, or show us in a meal, measures them directly.
      </p>
    </div>
  )
}
