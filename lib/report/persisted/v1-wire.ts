/**
 * The frozen Report-v1 wire contract — Phase 4A-S4.
 *
 * ══ WHY EVERY VALUE BELOW IS TYPED OUT BY HAND ══════════════════════════════
 *
 * A persisted canonical Report is a historical artifact. It was produced by one
 * exact build, and what it MEANT was fixed on the day it was written. The live
 * modules describe what a Report means TODAY: `COMPOSER_VERSION` moves,
 * `SCIENCE_CONTRACT_VERSION` moves, the bank fingerprint moves, the add-on
 * vocabulary moves, a capability appears when a specialist gate closes.
 *
 * So a decoder that validated a stored Report against those constants would
 * make every previously-valid artifact unreadable the moment any of them moved
 * — which is exactly the failure the historical-authority rule exists to
 * prevent, and it would show up as a customer's paid Report disappearing.
 *
 * Nothing here is imported. Every value is a copy of what was true at the
 * baseline commit, recorded as a fact about the past. Companion tests assert
 * that the live constants still form the current producer identity, so a
 * genuine version bump FAILS THE BUILD until somebody appends a reviewed
 * tuple — the decision is forced, never inferred.
 *
 * ══ WHY A PRODUCER TUPLE AND NOT INDEPENDENT ALLOW-LISTS ════════════════════
 *
 * Independent lists accept the cross product. With `composer-v2` and a future
 * `composer-v3` in one list and `content-pack-v1` and `content-pack-v2` in
 * another, a Report claiming `composer-v2` + `content-pack-v2` would validate —
 * a combination no build ever emitted, and therefore an artifact nobody
 * reviewed. Provenance is matched as a WHOLE identity: eight facts that a real
 * build actually shipped together.
 */

/* ══ Structural vocabularies ═══════════════════════════════════════════════ */

export const V1_REPORT_SCHEMA_VERSION = "personal-food-system-report-v1"

export const V1_FOUNDATIONS = ["you", "family"] as const

export const V1_PROPOSITION_KINDS = [
  "recap",
  "lever",
  "loop-step",
  "constraint",
  "quotation",
  "provenance",
] as const

export const V1_REPORT_CAPABILITIES = [
  "specificFoods",
  "bioticsLanguage",
  "safetyNetting",
] as const

export const V1_ALLOWED_REPORT_USES = [
  "descriptive-recap",
  "educational-topic-selection",
  "low-risk-self-observation",
  "transparent-reflection",
  "practical-timing",
  "practical-fit",
  "routine-support",
  "operational-filtering",
  "output-suppression",
] as const

/** The only uses a product-operational authority could grant in v1. */
export const V1_PRODUCT_OPERATIONAL_USES = [
  "descriptive-recap",
  "operational-filtering",
  "practical-fit",
  "practical-timing",
  "output-suppression",
] as const

export const V1_REPORT_TARGETS = [
  "systemSnapshot",
  "foodSystemMap",
  "educationModules",
  "bodySignalMap",
  "priorityLever",
  "foodTools",
  "thirtyDayLoop",
  "familyContext",
  "closingMissionPage",
] as const

export const V1_EVIDENCE_STATUSES = [
  "SUPPORTED",
  "CONTEXT_ONLY",
  "PROHIBITED",
  "SPECIALIST_REVIEW",
] as const

export const V1_FOOD_SAFETY_STATES = [
  "none-declared",
  "constraints-known",
  "unresolved-avoidance",
  "undisclosed",
  "contradictory",
] as const

export const V1_BASIS_KINDS = ["science-adjudicated", "product-operational"] as const

/* ══ Document-role coherence ═══════════════════════════════════════════════ */

/**
 * Which (kind, target) pair each document position carries.
 *
 * The composer picks both, and a stored Report that names a valid kind in the
 * wrong position is not a Report this producer could have written — a recap
 * sitting where the lever goes, or a constraint labelled `thirtyDayLoop`,
 * describes a document assembled by something else. Every value here is a
 * legal v1 value on its own, which is precisely why the PAIR has to be pinned.
 *
 * `provenance` is a legal `PropositionKind` and appears in no position: the
 * current composer never emits one into the document.
 */
export const V1_SECTION_ROLES = {
  systemSnapshot: { kind: "recap", target: "systemSnapshot" },
  priorityLever: { kind: "lever", target: "priorityLever" },
  thirtyDayLoop: { kind: "loop-step", target: "thirtyDayLoop" },
  constraints: { kind: "constraint", target: "foodTools" },
  familyContext: { kind: "recap", target: "familyContext" },
  quotation: { kind: "quotation", target: "systemSnapshot" },
} as const

/**
 * How many sources a proposition of this producer carries. Exactly one.
 *
 * The S2 Core keeps `no-source`, `mixed-basis` and weakest-wins aggregation as
 * future safety invariants, and they are live code — but no proposition the
 * current composer emits has ever had more than the single derived source. A
 * decoder that accepted many would be advertising a capability this producer
 * does not have, and the first multi-source Report to arrive would be one
 * nobody reviewed. A future producer widens this in its own reviewed tuple.
 */
export const V1_SOURCES_PER_PROPOSITION = 1

/* ══ Producer identity ═════════════════════════════════════════════════════ */

export interface V1ProducerIdentity {
  readonly composerVersion: string
  readonly scienceContractVersion: string
  readonly finalisationVersion: string
  readonly reportUseRecordVersion: string
  readonly contentPackVersion: string
  readonly bankVersion: string
  readonly bankFingerprint: string
  readonly capabilitiesAtCompose: {
    readonly specificFoods: boolean
    readonly bioticsLanguage: boolean
    readonly safetyNetting: boolean
  }
  /**
   * The lens entitlements this producer can render. `[null]` — nothing else.
   *
   * Not a detail: `composePersonalFoodSystemReport` REFUSES every non-null lens
   * outright, because the deterministic bank holds no lens questions and a
   * core-only Report carrying a Stability, Glucose, Mind or Performance
   * entitlement would attest a purchase it asked nothing about. A stored Report
   * bound to a lens seal is therefore not something this producer could have
   * written, whatever else agrees. A lens-capable producer needs its own
   * reviewed identity — and its own reviewed content.
   */
  readonly supportedEntitledLenses: readonly (string | null)[]
}

/**
 * Every complete producer identity Report v1 will read.
 *
 * ONE entry: the build at the baseline commit. All three capability flags are
 * `false` because all three specialist gates are OPEN, and a capability is
 * enabled only by a CLOSED gate — so closing one produces a different producer
 * and needs a new tuple here, which is correct, because it changes what a
 * Report is allowed to contain.
 */
export const V1_KNOWN_PRODUCER_IDENTITIES: readonly V1ProducerIdentity[] = [
  {
    composerVersion: "composer-v2",
    scienceContractVersion: "science-contract-v1.0",
    finalisationVersion: "consultation-finalisation-v1",
    reportUseRecordVersion: "report-use-v1",
    contentPackVersion: "content-pack-v1",
    bankVersion: "consultation-v1",
    bankFingerprint: "591ceb245296dab2d70dfb0420e0163a",
    capabilitiesAtCompose: {
      specificFoods: false,
      bioticsLanguage: false,
      safetyNetting: false,
    },
    supportedEntitledLenses: [null],
  },
]

/* ══ Question authority, versioned by report-use record ════════════════════ */

export interface V1ScienceAdjudicatedAuthority {
  readonly answerField: string
  readonly basisKind: "science-adjudicated"
  readonly contractVersion: string
  readonly basisQuestionId: string
}

export interface V1ProductOperationalAuthority {
  readonly answerField: string
  readonly basisKind: "product-operational"
  readonly recordVersion: string
  readonly approvedBy: "product"
  readonly rationale: string
}

export type V1QuestionAuthority =
  | V1ScienceAdjudicatedAuthority
  | V1ProductOperationalAuthority

/**
 * Which question carried which authority, keyed by REPORT-USE RECORD VERSION.
 *
 * ══ WHY THIS IS A MAP OF MAPS ═══════════════════════════════════════════════
 *
 * A timeless map would have to be edited in place when `report-use-v2` ships,
 * and editing it would silently re-describe every `report-use-v1` Report
 * already persisted — the same class of mistake as validating a historical
 * artifact against a live registry, just slower. A second record version
 * appends a SECOND map; the first is never touched, and Reports keep decoding
 * against the authority they were actually written under.
 *
 * ══ WHAT IT PREVENTS ═══════════════════════════════════════════════════════
 *
 * A stored proposition naming an adjudicated question while claiming a
 * product-operational basis — the relabelling that would let a self-report
 * about someone's body be justified as a logistics fact, or the reverse. The
 * basis is checked against the authority belonging to the proposition's primary
 * source, so the two cannot be pulled apart.
 *
 * The `rationale` strings are the exact reviewed prose the Report carries. A
 * live edit to one, without a `report-use-v2` bump, makes newly composed
 * Reports fail the pre-persist self-check — loudly, before anything is written.
 * That is the intended behaviour, not a bug to route around.
 */
export const V1_QUESTION_AUTHORITY_BY_REPORT_USE_VERSION: Readonly<
  Record<string, Readonly<Record<string, V1QuestionAuthority>>>
> = {
  "report-use-v1": {
    core_signals_post_meal_pattern_v1: {
      answerField: "signals.postMealPattern",
      basisKind: "science-adjudicated",
      contractVersion: "science-contract-v1.0",
      basisQuestionId: "core_signals_post_meal_pattern_v1",
    },
    core_signals_energy_shape_v1: {
      answerField: "signals.energyShape",
      basisKind: "science-adjudicated",
      contractVersion: "science-contract-v1.0",
      basisQuestionId: "core_signals_energy_shape_v1",
    },
    core_signals_context_v1: {
      answerField: "signals.context",
      basisKind: "science-adjudicated",
      contractVersion: "science-contract-v1.0",
      basisQuestionId: "core_signals_context_v1",
    },
    core_signals_settled_days_v1: {
      answerField: "signals.settledDays",
      basisKind: "science-adjudicated",
      contractVersion: "science-contract-v1.0",
      basisQuestionId: "core_signals_settled_days_v1",
    },
    core_environment_constraints_v1: {
      answerField: "environment.constraints",
      basisKind: "science-adjudicated",
      contractVersion: "science-contract-v1.0",
      basisQuestionId: "core_environment_constraints_v1",
    },
    core_environment_food_avoidances_v1: {
      answerField: "environment.foodAvoidances",
      basisKind: "science-adjudicated",
      contractVersion: "science-contract-v1.0",
      basisQuestionId: "core_environment_food_avoidances_v1",
    },
    core_signals_household_mealtime_v1: {
      answerField: "signals.householdMealtime",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "Describes the atmosphere of a household mealtime as the account holder reports it. Logistics and mood of a routine, not a claim about anyone's body.",
    },
    core_signals_household_hardest_moment_v1: {
      answerField: "signals.householdHardestMoment",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "Names the point in the day the household finds hardest. A scheduling fact about a family's week.",
    },
    core_rhythm_first_meal_v1: {
      answerField: "rhythm.firstMeal",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "When the customer first eats. A clock fact about their morning.",
    },
    core_rhythm_longest_gap_v1: {
      answerField: "rhythm.longestGap",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "The longest stretch between eating, as the customer reports it. A clock fact. A gap is not a fast, and this authority cannot make it one.",
    },
    core_rhythm_household_shared_meals_v1: {
      answerField: "rhythm.householdSharedMeals",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "How often the household eats together. A scheduling fact.",
    },
    core_rhythm_week_shape_v1: {
      answerField: "rhythm.weekShape",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "Whether weekends differ from weekdays. A calendar fact.",
    },
    core_rhythm_recent_change_v1: {
      answerField: "rhythm.recentChange",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "Recent life changes that affected eating. Recapped as context for why a pattern is recent rather than lifelong. Selecting content from a life change would be inference, so no target beyond the recap is granted.",
    },
    core_rhythm_household_separate_reason_v1: {
      answerField: "rhythm.householdSeparateReason",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "Why eating together is difficult. A logistics fact about a household.",
    },
    core_environment_cooking_frequency_v1: {
      answerField: "environment.cookingFrequency",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "How much cooking happens at home. A logistics fact.",
    },
    core_environment_who_prepares_v1: {
      answerField: "environment.whoPrepares",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "Who does the preparing. A household-roles fact.",
    },
    core_environment_planning_v1: {
      answerField: "environment.planning",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "How food arrives — planned shop, top-ups, delivery. A logistics fact.",
    },
    core_environment_household_differing_needs_v1: {
      answerField: "environment.householdDifferingNeeds",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "THAT household needs differ, and in what broad way. Never what anyone's condition is — the question is deliberately written not to ask.",
    },
    core_intentions_primary_focus_v1: {
      answerField: "intentions.primaryFocus",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "What the customer says they want to work on. Their stated priority, quoted back as theirs — this authority reads it as a preference, never as a biological priority the product identified.",
    },
    core_intentions_barrier_v1: {
      answerField: "intentions.barrier",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "What gets in the way, as the customer reports it. A practical obstacle.",
    },
    core_intentions_success_v1: {
      answerField: "intentions.success",
      basisKind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale:
        "The customer's own words about what success would look like. Reproduced as a quotation and attributed to them; this authority permits no reading of it at all.",
    },
  },
}

/** The authority map a Report's own provenance selects. */
export function v1QuestionAuthorityFor(
  reportUseRecordVersion: string,
): Readonly<Record<string, V1QuestionAuthority>> | undefined {
  return V1_QUESTION_AUTHORITY_BY_REPORT_USE_VERSION[reportUseRecordVersion]
}
