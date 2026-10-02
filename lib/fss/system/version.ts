/* ════════════════════════════════════════════════════════════════════════
   The system/plan policy version.

   ── Why this is a THIRD anchor and not a reuse of an existing one ─────────

   Three different things can move independently, and conflating any two of
   them makes a historical decision unreadable:

     `ScoreProvenance`      HOW THE SCORE WAS CALCULATED — five fields,
                            `lib/fss/engine/provenance.ts`
     `SYSTEM_MODEL_VERSION` HOW THE DECISION WAS MADE — which priority was
                            selected, how the plan was built from it, and when
                            a review point sits
     `ACTION_SET_VERSION`   WHAT WORDING THE RECOMMENDATION HAD — the reviewed
                            catalogue, `lib/fss/action/types.ts`

   `repository.ts` already argues why there are two rather than one: provenance
   says which METHOD scored the person, `actionSetVersion` says which CONTENT
   recommended to them, "and they move independently — reviewed wording can
   change without any arithmetic changing". The same argument, one step further:
   the SELECTION POLICY can change without either the arithmetic or the wording
   changing, and it is the policy that decided Diversity rather than Meal
   Rhythm.

   ── What would go wrong if `actionSetVersion` carried this ────────────────

   Reviewed copy changes often; selection policy changes rarely. Hanging the
   policy on the content version means every wording edit reads as a policy
   change, so every stored decision reads as "decided under a method that has
   moved" after the first typo fix — and a refusal that fires constantly stops
   being read. The reverse is worse: a real policy change that shipped without a
   copy change would be invisible.

   ── The reassessment cadence belongs here, not in the catalogue ───────────

   `REASSESSMENT.afterDays` lives in `lib/fss/action/catalogue.ts` because that
   is where the thirty-day horizon's content lives. That is a location, not a
   claim about what kind of thing it is: WHEN TO REASSESS is a policy decision,
   so a stored review point resolves through THIS version. The coincidence of
   the constant's filename is not an argument.

   ── It is a candidate, like everything else in this layer ─────────────────

   No reviewer has signed off the selection rule, the tie behaviour, the
   one-action-today rule or the thirty-day cadence. Moving this version is how a
   future reviewer's decision becomes visible in records written before it.
   ════════════════════════════════════════════════════════════════════════ */

/** The policy that selects a priority, builds a plan, and sets a review point. */
export const SYSTEM_MODEL_VERSION = "system-model-v1.0" as const

export type SystemModelVersion = typeof SYSTEM_MODEL_VERSION

/** Does a stored decision's policy version resolve against what is here now? */
export function isCurrentSystemModel(version: string): boolean {
  return version === SYSTEM_MODEL_VERSION
}
