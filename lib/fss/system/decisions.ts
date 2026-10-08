import type { Answers } from "@/lib/fss/engine/score"
import type { ScoreProvenance } from "@/lib/fss/engine/provenance"
import type { FssDomain, ResolvedQuestionSet } from "@/lib/fss/questions/types"
import { ACTION_CATALOGUE } from "@/lib/fss/action/catalogue"
import { readFoodContext } from "@/lib/fss/action/context"
import { bindRecommendation, describeThirtyDayFocus } from "@/lib/fss/action/plan"
import { describePriority, priorityIdFor } from "@/lib/fss/action/priority"
import {
  ACTION_SET_VERSION,
  type CatalogueEntry,
  type FoodSystemPlan,
  type Recommendation,
  type ResolvedPriority,
} from "@/lib/fss/action/types"
import type {
  StoredPlanDecision,
  StoredPriorityDecision,
  StoredScore,
} from "@/lib/fss/persistence/repository"
import { SYSTEM_MODEL_VERSION, isCurrentSystemModel } from "./version"
import type { DecisionRefusal, PlanResolution, PriorityResolution } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   WRITING A DECISION DOWN, AND READING IT BACK.

   ══ THE QUESTION THIS MODULE ANSWERS ════════════════════════════════════════

   Today the engines select Diversity, and actions A, B and C. Six months from
   now the selection rule improves. Somebody opens the Food System they
   established today. WHAT DO THEY SEE?

   Selecting afresh shows them Meal Rhythm and actions D, E and F — silently,
   with no record that anything moved, and with their own completed actions
   hanging off a plan they were never given. That is not a recalculation. It is
   a rewritten history that happens to be internally consistent, which is the
   worst kind, because nothing in it looks wrong.

   So: A SELECTION IS A DECISION. It is written down, under a policy version.
   Everything that EXPLAINS the decision is derived — the headline, the
   rationale, the evidence, the reviewed sentences, the counts, the dates.

   ══ WHAT IS WRITTEN, AND WHAT IS NOT ════════════════════════════════════════

   Written:  catalogue ids · domains · ranks · two version anchors · timestamps
   Derived:  every sentence a person reads

   `tests/unit/fss-persistence.test.ts` walks both records and refuses any
   value that reads like a sentence, so "ids and versions only" is checked
   rather than intended.

   ══ READING BACK REFUSES RATHER THAN SUBSTITUTES ════════════════════════════

   Three version-shaped failures and one consistency failure, each with a state
   of its own and none with a fallback:

     the POLICY version moved     what was selected cannot be explained
     the CONTENT version moved    the wording shown cannot be recovered
     an entry was withdrawn       the id is no longer in the catalogue
     the records disagree         they could not have been written together

   In all four the answer is "decided under a method that has moved", never
   today's answer dressed as what somebody was told. The same refusal
   `resolveStoredAction` makes for one recommendation, and `canCompare` for two
   scores, applied one level up — to the decision itself.
   ════════════════════════════════════════════════════════════════════════ */

/* ── Writing ───────────────────────────────────────────────────────────── */

/**
 * Record which priorities were selected.
 *
 * `rank` is the engine's own order, kept because the FIRST priority is where
 * the thirty-day focus comes from. An order that re-sorted on read would move
 * the month's focus without moving anything visible.
 *
 * `decidedAt` is a parameter, not a `new Date()` call, for the reason the rest
 * of this layer uses: a caller decides when something happened, and a test can
 * say so exactly.
 */
export function toStoredPriorityDecision(args: {
  scoreId: string
  priorities: readonly ResolvedPriority[]
  decidedAt: string
}): StoredPriorityDecision {
  return {
    scoreId: args.scoreId,
    systemModelVersion: SYSTEM_MODEL_VERSION,
    selected: args.priorities.map((p, rank) => ({
      priorityId: p.id,
      sourceDomain: p.sourceDomain,
      rank,
    })),
    decidedAt: args.decidedAt,
  }
}

/**
 * Record which recommendations were selected, for each horizon.
 *
 * Carries BOTH versions, because the policy decided which entries to pick and
 * the catalogue decided what those entries said, and the two move
 * independently. One combined field could not express a reworded catalogue
 * under an unchanged policy, which is the common case.
 */
export function toStoredPlanDecision(args: {
  scoreId: string
  plan: FoodSystemPlan
  decidedAt: string
}): StoredPlanDecision {
  const { plan } = args
  return {
    scoreId: args.scoreId,
    systemModelVersion: SYSTEM_MODEL_VERSION,
    actionSetVersion: plan.actionSetVersion,
    todayRecommendationId: plan.today?.id ?? null,
    thisWeekRecommendationIds: plan.thisWeek.map((r) => r.id),
    thirtyDayFocusDomain: plan.thirtyDays?.sourceDomain ?? null,
    decidedAt: args.decidedAt,
  }
}

/* ── Reading back ──────────────────────────────────────────────────────── */

/** How much of one domain's scored instrument was answered. A pure count. */
function domainCompleteness(
  set: ResolvedQuestionSet,
  answers: Answers,
  domain: FssDomain,
): { answered: number; total: number } {
  const items = set.questions.filter((q) => q.contributes === "fss" && q.domain === domain)
  return {
    answered: items.filter((q) => typeof answers[q.id] === "number").length,
    total: items.length,
  }
}

/**
 * Read a stored priority decision back into described priorities.
 *
 * ── It does not re-select, and that is the whole contract ─────────────────
 *
 * Nothing here looks at which domain scored lowest. The decision says which
 * domains were chosen; this fills in the explanation for those domains through
 * `describePriority`, the same function `resolvePriorities` uses. One describer
 * means a decision read back is described identically to one just made.
 */
export function resolvePriorityDecision(args: {
  decision: StoredPriorityDecision
  score: StoredScore
  set: ResolvedQuestionSet
  answers: Answers
}): PriorityResolution {
  const { decision, score, set, answers } = args
  const storedDomains = decision.selected
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((s) => s.sourceDomain)

  if (decision.selected.length === 0) return { state: "none-selected" }

  const refuse = (reason: DecisionRefusal) =>
    ({
      state: "unresolvable",
      reason,
      storedSystemModelVersion: decision.systemModelVersion,
      storedDomains,
    }) as const

  /*
   * Policy first. If the selection rule has moved, the ids matching tells us
   * nothing useful — the explanation we would produce is this version's
   * explanation for a choice a different version made.
   */
  if (!isCurrentSystemModel(decision.systemModelVersion)) {
    return refuse("policy-version-moved")
  }

  const scoredCount = score.domains.filter((d) => d.state === "scored").length
  const priorities: ResolvedPriority[] = []

  for (const domain of storedDomains) {
    const entry = score.domains.find((d) => d.domain === domain)
    if (!entry || entry.state !== "scored" || typeof entry.score !== "number") {
      return refuse("domain-absent-from-score")
    }
    const { answered, total } = domainCompleteness(set, answers, domain)
    priorities.push(
      describePriority({
        domain,
        domainScore: entry.score,
        answered,
        total,
        scoredDomains: scoredCount,
        set,
        answers,
        provenance: score.provenance,
      }),
    )
  }

  /*
   * A recorded id that does not match the id this version mints for the same
   * domain means the identity FORMAT changed while the policy version did not.
   * Surfaced as inconsistency rather than quietly accepted, because accepting
   * it would mean trusting the domain and ignoring the id we were given.
   */
  for (const s of decision.selected) {
    if (s.priorityId !== priorityIdFor(s.sourceDomain)) return refuse("decision-inconsistent")
  }

  return { state: "resolved", priorities }
}

/**
 * Read a stored plan decision back into the plan it was.
 *
 * ── Why a moved content version fails the WHOLE plan ──────────────────────
 *
 * `actionSetVersion` is recorded once for the decision, not per recommendation,
 * so if it has moved then every sentence in that plan is unrecoverable
 * together. Resolving three of four and refusing one would present a partial
 * plan as though it were the plan somebody was given, which is the substitution
 * this refuses in the first place.
 */
export function resolvePlanDecision(args: {
  decision: StoredPlanDecision
  priorities: readonly ResolvedPriority[]
  set: ResolvedQuestionSet
  answers: Answers
  provenance: ScoreProvenance
}): PlanResolution {
  const { decision, priorities, set, answers, provenance } = args

  const refuse = (reason: DecisionRefusal) =>
    ({
      state: "unresolvable",
      reason,
      storedSystemModelVersion: decision.systemModelVersion,
      storedActionSetVersion: decision.actionSetVersion,
    }) as const

  const empty =
    decision.todayRecommendationId === null &&
    decision.thisWeekRecommendationIds.length === 0 &&
    decision.thirtyDayFocusDomain === null
  if (empty) return { state: "none-selected" }

  if (!isCurrentSystemModel(decision.systemModelVersion)) return refuse("policy-version-moved")
  if (decision.actionSetVersion !== ACTION_SET_VERSION) return refuse("content-version-moved")

  const byDomain = new Map(priorities.map((p) => [p.sourceDomain, p]))

  /** Bind one recorded id, or say which way it failed. */
  function bindId(id: string): Recommendation | PlanResolution {
    const entry: CatalogueEntry | undefined = ACTION_CATALOGUE.find((e) => e.id === id)
    if (!entry) return refuse("entry-withdrawn")
    const priority = byDomain.get(entry.domain)
    if (!priority) return refuse("decision-inconsistent")
    return bindRecommendation(entry, priority, provenance)
  }

  let today: Recommendation | null = null
  if (decision.todayRecommendationId) {
    const bound = bindId(decision.todayRecommendationId)
    if ("state" in bound) return bound
    today = bound
  }

  const thisWeek: Recommendation[] = []
  for (const id of decision.thisWeekRecommendationIds) {
    const bound = bindId(id)
    if ("state" in bound) return bound
    thisWeek.push(bound)
  }

  let thirtyDays = null
  if (decision.thirtyDayFocusDomain) {
    const priority = byDomain.get(decision.thirtyDayFocusDomain)
    if (!priority) return refuse("decision-inconsistent")
    thirtyDays = describeThirtyDayFocus(priority)
  }

  return {
    state: "resolved",
    plan: {
      actionSetVersion: ACTION_SET_VERSION,
      provenance,
      priorities,
      today,
      thisWeek,
      thirtyDays,
      context: readFoodContext(set, answers),
    },
  }
}
