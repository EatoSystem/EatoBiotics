import type { Answers } from "@/lib/fss/engine/score"
import type { Contribution, ResolvedQuestionSet } from "@/lib/fss/questions/types"
import type { ReportedItem } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   Reading an unscored answer back.

   ── Why this is a function and not five lines in a component ──────────────

   It was five lines in a component: `candidate-result.tsx`'s `UnscoredSection`
   filtered the question set by `contributes` and looked up the chosen option
   inline. Gate 4's My Food section needs the same read-back, and a second
   inline copy is how two surfaces start disagreeing about what somebody said.

   So the DERIVATION lives here and the REVIEWED COPY stays where it was. The
   result page's two notes — why What You Notice is unscored, why Food Context
   never reduces anything — are unchanged and still in the component. This moved
   a loop, not a sentence.

   ── What it refuses to produce ────────────────────────────────────────────

   No number. `ReportedItem` has no numeric field, so an unscored answer cannot
   be summed, averaged or ranked by anything downstream of here. These items
   reach the Score by no path (`lib/fss/engine/score.ts` throws if one does),
   and the surest way to keep it that way is for the read-back not to carry a
   value in the first place.

   No interpretation either. `answer` is the option label the person chose,
   quoted. "You reported X" is a statement about what they told us; anything
   beyond that is a different claim class, and this layer does not have one.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * The answers to one unscored part, in asked order.
 *
 * An unanswered item is INCLUDED with `answer: null`, deliberately: dropping it
 * would make a skipped part look like a part that was never offered, and
 * "you did not answer this" is itself worth reflecting back.
 */
export function readReportedItems(
  set: ResolvedQuestionSet,
  answers: Answers,
  contributes: Extract<Contribution, "what-you-notice" | "food-context">,
): readonly ReportedItem[] {
  return set.questions
    .filter((q) => q.contributes === contributes)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((q) => {
      const value = answers[q.id]
      const chosen = q.options.find((o) => o.value === value)
      return {
        questionId: q.id,
        order: q.order,
        question: q.text,
        answer: chosen?.label ?? null,
      }
    })
}
