import { canCompare } from "@/lib/fss/engine/compare"
import { readFoodContext } from "@/lib/fss/action/context"
import { resolveStoredAction } from "@/lib/fss/action/stored"
import type { ResolvedQuestionSet } from "@/lib/fss/questions/types"
import type {
  StoredAction,
  StoredAssessment,
  StoredFoodSystem,
  StoredPlanDecision,
  StoredPriorityDecision,
  StoredScore,
} from "@/lib/fss/persistence/repository"
import { resolvePlanDecision, resolvePriorityDecision } from "./decisions"
import { readReportedItems } from "./reported"
import { resolveReviewPoint } from "./review"
import type { MyFoodSystem, ProgressFacts, ResolvedAction } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   COMPOSING MY FOOD SYSTEM.

   ══ PURE. NO CLOCK, NO I/O, NO RANDOMNESS. ══════════════════════════════════

   Every input is a record somebody already read. Nothing in here reads storage,
   calls `Date.now()`, or generates an id. Two runs over the same records
   produce byte-identical output, which is what lets a test diff two systems
   directly and a reviewer reproduce exactly what a person saw.

   The clock lives at the edge: `ReviewPoint.dueAt` is an absolute date and the
   COMPONENT turns it into "in 24 days" using a `now` it was handed.

   ══ IT COMPOSES. IT DOES NOT DECIDE. ════════════════════════════════════════

   `resolvePriorities` and `buildPlan` are NOT called here, and that absence is
   the most important line in the file. Those two functions SELECT, and a
   selection is a decision that was made once, written down under a policy
   version, and must not be silently re-made six months later under a newer
   rule. What this does is read the stored decisions back and fill in their
   explanations.

   The explanations are derived every time, on purpose: headlines, rationales,
   evidence, domain copy, counts, dates. If reviewed wording changes, a
   historical Food System shows the new wording for the SAME decision — which is
   correct, and is why persisting prose would have made a copy edit a migration.

   ══ IT RE-EXPORTS NOTHING ═══════════════════════════════════════════════════

   `score` and `assessment` are referenced whole. There is no `score: number` on
   the aggregate, no `priorityDomain`, no `todayAction`. `MY_FOOD_SYSTEM_KEYS`
   pins that, because a convenience field is a second copy and a second copy is
   how one screen comes to disagree with itself.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Build the view of one Food System.
 *
 * Takes the records rather than a repository: the caller does the reading, so
 * this stays pure and a test supplies a fixture instead of a store.
 */
export function composeMyFoodSystem(input: {
  system: StoredFoodSystem
  assessment: StoredAssessment
  score: StoredScore
  priorityDecision: StoredPriorityDecision
  planDecision: StoredPlanDecision
  actions: readonly StoredAction[]
  set: ResolvedQuestionSet
}): MyFoodSystem {
  const { system, assessment, score, priorityDecision, planDecision, actions, set } = input
  const answers = assessment.answers

  const priorities = resolvePriorityDecision({ decision: priorityDecision, score, set, answers })

  /*
   * The plan is resolved against the priorities THIS read produced, so a
   * recommendation is always bound to the priority the stored decision says it
   * came from. When the priority decision did not resolve, the plan cannot
   * either — a plan bound to priorities we could not explain would be a plan
   * whose reasoning is missing, presented as complete.
   */
  const plan =
    priorities.state === "resolved"
      ? resolvePlanDecision({
          decision: planDecision,
          priorities: priorities.priorities,
          set,
          answers,
          provenance: score.provenance,
        })
      : priorities.state === "none-selected"
        ? ({ state: "none-selected" } as const)
        : ({
            state: "unresolvable",
            reason: priorities.reason,
            storedSystemModelVersion: planDecision.systemModelVersion,
            storedActionSetVersion: planDecision.actionSetVersion,
          } as const)

  const resolvedActions: readonly ResolvedAction[] = actions
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
    .map((a) => ({
      id: a.id,
      state: a.state,
      createdAt: a.createdAt,
      changedAt: a.changedAt,
      timeHorizon: a.timeHorizon,
      actionCategory: a.actionCategory,
      /*
       * An action whose content cannot be resolved is KEPT, carrying its
       * refusal. Dropping it would make the method change invisible, which is
       * the failure `resolveStoredAction` exists to prevent — and it would also
       * silently reduce the person's own counts.
       */
      content: resolveStoredAction(a),
    }))

  return {
    systemId: system.id,
    assessmentId: assessment.id,
    scoreId: score.id,
    score,
    assessment,
    priorities,
    plan,
    context: readFoodContext(set, answers),
    observations: readReportedItems(set, answers, "what-you-notice"),
    contextItems: readReportedItems(set, answers, "food-context"),
    actions: resolvedActions,
    review: resolveReviewPoint({
      establishedAt: system.establishedAt,
      systemModelVersion: system.systemModelVersion,
    }),
    progress: countProgress(system, score, resolvedActions),
    provenance: score.provenance,
  }
}

/**
 * Four facts, counted.
 *
 * ── Why `canCompare` is called when there is nothing to compare ───────────
 *
 * They are two different questions, and conflating them is how a product ends
 * up drawing a line through a methodology change.
 *
 *   `scoresAvailable`     is there a PAIR on this screen at all? Read from
 *                         `previousSystemId`, which is a fact on the record —
 *                         so this stays pure and needs no second load. `1`
 *                         means no comparison exists to attempt; `2` means one
 *                         does, and says NOTHING about whether it is permitted.
 *   `comparability`       could this score EVER be compared? For a
 *                         `legacy-unversioned` provenance the answer is no,
 *                         permanently, and that is worth telling somebody
 *                         before they wait a month for a comparison that
 *                         cannot happen.
 *
 * Carrying both means no surface can read `comparable: true` as "there is a
 * trend here". Carrying only the verdict would invite exactly that.
 */
function countProgress(
  system: StoredFoodSystem,
  score: StoredScore,
  actions: readonly ResolvedAction[],
): ProgressFacts {
  return {
    baselineEstablishedAt: system.establishedAt,
    scoresAvailable: system.previousSystemId === null ? 1 : 2,
    actionsPlanned: actions.filter((a) => a.state === "planned").length,
    actionsDone: actions.filter((a) => a.state === "done").length,
    actionsSkipped: actions.filter((a) => a.state === "skipped").length,
    comparability: canCompare(score.provenance, score.provenance),
  }
}
