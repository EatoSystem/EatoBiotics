import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import {
  QUESTION_SCIENCE_CONTRACTS,
  SCIENCE_CONTRACT_VERSION,
  scienceContractFor,
  type AllowedReportUse,
  type ProhibitedInference,
  type ReviewedQuestionId,
} from "@/lib/consultation/science-contract"
import type { ConsultationReportTarget } from "@/lib/consultation/types"

import type { ReportCapability } from "./capabilities"

/**
 * Which answers may become customer-facing sentences — Phase 4A-S2.
 *
 * ══ THE RULE ════════════════════════════════════════════════════════════════
 *
 * A customer-facing proposition may exist ONLY where an explicit, versioned
 * record below grants it. Absence of a record is absence of permission.
 * Nothing is inferred from silence, from a question "looking operational", or
 * from `question.reportTargets` in the bank.
 *
 * ══ WHY NOT question.reportTargets ══════════════════════════════════════════
 *
 * Because that field is the bank author's INTENT — what a question was written
 * to inform — and intent is not permission. The Science Contract withdrew
 * `bodySignalMap` from three questions whose bank entries still list their own
 * targets, which is precisely the gap: reading the bank would grant a target
 * adjudication removed. So the bank is never consulted here, and a guard
 * asserts this module does not import it for that purpose.
 *
 * ══ THE FIRST DRAFT'S MISTAKE, RECORDED ═════════════════════════════════════
 *
 * An earlier design said "the 15 unadjudicated questions default to recap and
 * operational filtering". That invented a permission no contract granted, in
 * the one module whose entire purpose is to stop that. There is no default
 * here. Every one of the 21 core questions carries an explicit record, and
 * three of them carry records that grant NOTHING at value level.
 *
 * ══ TWO BASES, KEPT APART ═══════════════════════════════════════════════════
 *
 * `science-adjudicated` — mirrors `QUESTION_SCIENCE_CONTRACTS` mechanically.
 *   It may never widen the allowed uses, targets, interpretation or action
 *   boundaries of its contract, and a test compares the two field for field.
 *
 * `product-operational` — a WEAKER, non-clinical authority covering logistics
 *   and stated preference. It is incapable of establishing any member of
 *   `ProhibitedInference`, and that is enforced as a CATEGORY invariant (see
 *   `PRODUCT_OPERATIONAL_USES`), not as a per-record list somebody might
 *   forget to extend.
 *
 * Conflating the two is how a product decision starts sounding like evidence.
 */

/** Bumped whenever any record below changes. Travels in every Report. */
export const REPORT_USE_RECORD_VERSION = "report-use-v1" as const

/* ══ Bases ═════════════════════════════════════════════════════════════════ */

export interface ScienceAdjudicatedBasis {
  readonly kind: "science-adjudicated"
  readonly contractVersion: typeof SCIENCE_CONTRACT_VERSION
  readonly questionId: ReviewedQuestionId
}

export interface ProductOperationalBasis {
  readonly kind: "product-operational"
  readonly recordVersion: typeof REPORT_USE_RECORD_VERSION
  readonly approvedBy: "product"
  /** Why this needs no clinical review. Reviewed prose, not decoration. */
  readonly rationale: string
}

export type PermissionBasis = ScienceAdjudicatedBasis | ProductOperationalBasis

/**
 * The ONLY uses a product-operational authority may grant.
 *
 * A category invariant. Every one of these describes or filters something the
 * customer stated about their own logistics; none of them reads a self-report
 * as evidence about the customer's body. The four uses deliberately excluded —
 * `educational-topic-selection`, `low-risk-self-observation`,
 * `transparent-reflection`, `routine-support` — all involve treating an answer
 * as a signal rather than a fact, which is a judgement only adjudication can
 * license.
 */
export const PRODUCT_OPERATIONAL_USES: readonly AllowedReportUse[] = [
  "descriptive-recap",
  "operational-filtering",
  "practical-fit",
  "practical-timing",
  "output-suppression",
]

/**
 * The category invariant, stated as executable fact.
 *
 * `false` for every member of `ProhibitedInference`, unconditionally — no
 * record can opt into one, and there is no per-record `neverInfers` array to
 * leave incomplete. A partial list is worse than none: it reads as exhaustive.
 */
export function productOperationalCanInfer(_inference: ProhibitedInference): false {
  return false
}

/* ══ Value-level rules ═════════════════════════════════════════════════════ */

/**
 * What a specific answer VALUE may do, where the question-level grant is too
 * coarse. Follows the precedent of `AnswerActionBoundary` in the Science
 * Contract, which is already value-level.
 */
export type ValueEffect =
  /** Collected and stored; never becomes customer-facing content. */
  | "no-proposition"
  /** May inform filtering/logistics only — never described as a state or a finding. */
  | "operational-only"
  /** Must never be read as an absence, a clearance or a "no". */
  | "never-absence"
  /** Must never be split into its component circumstances. */
  | "atomic"

export interface ValueRule {
  readonly value: string
  readonly effect: ValueEffect
  readonly reason: string
}

/* ══ The record ════════════════════════════════════════════════════════════ */

export interface ReportUsePermission {
  readonly questionId: string
  readonly answerField: string
  readonly basis: PermissionBasis
  /** May be EMPTY — an explicit grant of nothing, which is not the same as no record. */
  readonly allowedUses: readonly AllowedReportUse[]
  readonly allowedTargets: readonly ConsultationReportTarget[]
  /** Recorded rather than omitted, so a withdrawal is visible to a reader. */
  readonly withheldTargets: readonly ConsultationReportTarget[]
  /**
   * Capability requirements attached to a SPECIFIC GRANT, keyed by target.
   *
   * Not to the question. A question can legitimately support two operations
   * with different requirements — `environment.whoPrepares` may recap who does
   * the cooking with no gate at all, while a future named-food suggestion from
   * that same answer needs the dietetic gate. Marking the whole question
   * "requires specificFoods" would suppress a benign recap, and marking it
   * ungated would let a food through; only the operation can answer.
   *
   * Most requirements come from the TARGET (see `TARGET_CAPABILITIES`) or from
   * the words themselves (see `ContentTemplate.requiresCapabilities`). This
   * field is for the rarer case where one question's grant of a target needs
   * something the target does not need in general.
   */
  readonly grantCapabilities?: Readonly<Partial<Record<ConsultationReportTarget, readonly ReportCapability[]>>>
  readonly valueRules?: readonly ValueRule[]
  readonly notes: string
}

/* ══ Shared reasons, so identical rules cannot drift apart ═════════════════ */

const UNDISCLOSED_REASON =
  "A declined disclosure is not a statement that there is nothing to disclose. Reading it as an absence converts silence into an affirmative clearance."

const sa = (questionId: ReviewedQuestionId): ScienceAdjudicatedBasis => ({
  kind: "science-adjudicated",
  contractVersion: SCIENCE_CONTRACT_VERSION,
  questionId,
})

const po = (rationale: string): ProductOperationalBasis => ({
  kind: "product-operational",
  recordVersion: REPORT_USE_RECORD_VERSION,
  approvedBy: "product",
  rationale,
})

/**
 * Project a science-adjudicated record straight from its contract.
 *
 * Derived, never retyped. A hand-copied list is a list that can be widened by
 * one careless edit, and the whole guarantee of this basis is that it cannot
 * say more than the adjudication said.
 */
function fromContract(
  questionId: ReviewedQuestionId,
  answerField: string,
  extra: { capability?: ReportCapability; valueRules?: readonly ValueRule[]; notes: string },
): ReportUsePermission {
  const contract = QUESTION_SCIENCE_CONTRACTS[questionId]
  return {
    questionId,
    answerField,
    basis: sa(questionId),
    allowedUses: contract.allowedReportUses,
    allowedTargets: contract.reportTargets.allowed,
    withheldTargets: contract.reportTargets.prohibited,
    ...extra,
  }
}

/* ══ The 21 records ════════════════════════════════════════════════════════ */

export const REPORT_USE_PERMISSIONS: readonly ReportUsePermission[] = [
  /* ── Signals ──────────────────────────────────────────────────────────── */

  fromContract("core_signals_post_meal_pattern_v1", "signals.postMealPattern", {
    valueRules: [
      { value: "prefer-not-to-say", effect: "never-absence", reason: UNDISCLOSED_REASON },
    ],
    notes:
      "May summarise what the customer reports noticing. Never where it happens in the body: bodySignalMap is withdrawn by adjudication.",
  }),

  fromContract("core_signals_energy_shape_v1", "signals.energyShape", {
    notes:
      "Timing only. The action must already be appropriate on its own terms; this answer decides WHEN it is placed, never whether or why.",
  }),

  fromContract("core_signals_context_v1", "signals.context", {
    valueRules: [
      { value: "rushed", effect: "atomic", reason: "An OR-bundled option. The customer never said which half." },
      { value: "large-late", effect: "atomic", reason: "An OR-bundled option. The customer never said which half." },
      { value: "stress-sleep", effect: "atomic", reason: "An OR-bundled option. The customer never said which half." },
      { value: "prefer-not-to-say", effect: "never-absence", reason: UNDISCLOSED_REASON },
    ],
    notes:
      "Recalled co-occurrence. Never a demonstrated trigger, a mechanism, or a prediction that changing it will help.",
  }),

  {
    questionId: "core_signals_household_mealtime_v1",
    answerField: "signals.householdMealtime",
    basis: po(
      "Describes the atmosphere of a household mealtime as the account holder reports it. Logistics and mood of a routine, not a claim about anyone's body.",
    ),
    allowedUses: ["descriptive-recap", "practical-fit"],
    allowedTargets: ["familyContext", "systemSnapshot", "thirtyDayLoop"],
    withheldTargets: [],
    notes: "Household routine, recapped and used to fit suggestions to it.",
  },

  {
    questionId: "core_signals_household_hardest_moment_v1",
    answerField: "signals.householdHardestMoment",
    basis: po(
      "Names the point in the day the household finds hardest. A scheduling fact about a family's week.",
    ),
    allowedUses: ["descriptive-recap", "practical-fit"],
    allowedTargets: ["familyContext", "thirtyDayLoop", "priorityLever"],
    withheldTargets: [],
    notes: "priorityLever here means practical starting point — the moment worth attending to first.",
  },

  fromContract("core_signals_settled_days_v1", "signals.settledDays", {
    valueRules: [
      {
        value: "lighter-meals",
        effect: "operational-only",
        reason:
          "The customer's own report of what tends to differ. Never operationalised into eating less: the slide from 'lighter' to a restriction programme is the failure the action boundary exists to stop.",
      },
    ],
    notes: "A routine the customer themselves reports, which the Report may back rather than replace.",
  }),

  /* ── Rhythm ───────────────────────────────────────────────────────────── */

  {
    questionId: "core_rhythm_first_meal_v1",
    answerField: "rhythm.firstMeal",
    basis: po("When the customer first eats. A clock fact about their morning."),
    allowedUses: ["descriptive-recap", "practical-timing"],
    allowedTargets: ["thirtyDayLoop"],
    // The bank also lists foodSystemMap and foodTools. foodSystemMap is a
    // biological diagram no self-report can populate; foodTools names foods.
    withheldTargets: ["foodSystemMap"],
    notes:
      "Timing only. A late first meal is not a metabolic finding. Its only granted target is thirtyDayLoop, which carries no food guidance; a named food would have to go through foodTools, which is gated.",
  },

  {
    questionId: "core_rhythm_longest_gap_v1",
    answerField: "rhythm.longestGap",
    basis: po(
      "The longest stretch between eating, as the customer reports it. A clock fact. A gap is not a fast, and this authority cannot make it one.",
    ),
    allowedUses: ["descriptive-recap", "practical-timing"],
    allowedTargets: ["thirtyDayLoop", "priorityLever"],
    withheldTargets: [],
    notes: "priorityLever means timing. No metabolic, glucose or insulin reading is available from this authority.",
  },

  {
    questionId: "core_rhythm_household_shared_meals_v1",
    answerField: "rhythm.householdSharedMeals",
    basis: po("How often the household eats together. A scheduling fact."),
    allowedUses: ["descriptive-recap", "practical-fit"],
    allowedTargets: ["familyContext", "thirtyDayLoop", "systemSnapshot"],
    withheldTargets: [],
    notes: "Shapes whether the plan works towards a shared table or around separate ones.",
  },

  {
    questionId: "core_rhythm_week_shape_v1",
    answerField: "rhythm.weekShape",
    basis: po("Whether weekends differ from weekdays. A calendar fact."),
    allowedUses: ["descriptive-recap", "practical-fit"],
    allowedTargets: ["thirtyDayLoop", "systemSnapshot"],
    withheldTargets: [],
    notes: "Decides whether a plan needs one shape or two.",
  },

  {
    questionId: "core_rhythm_recent_change_v1",
    answerField: "rhythm.recentChange",
    basis: po(
      "Recent life changes that affected eating. Recapped as context for why a pattern is recent rather than lifelong. Selecting content from a life change would be inference, so no target beyond the recap is granted.",
    ),
    allowedUses: ["descriptive-recap"],
    allowedTargets: ["systemSnapshot"],
    // The bank lists educationModules and priorityLever. Choosing an
    // educational topic BECAUSE of a reported health event is topic selection
    // from health history — an inference this authority cannot make.
    withheldTargets: ["educationModules", "priorityLever"],
    valueRules: [
      {
        value: "health-event",
        effect: "no-proposition",
        reason:
          "Health history. The antibiotics question was adjudicated OUT of the bank for exactly this reason; recapping a health event here would reintroduce by the back door what the Science Contract removed at the front. Held pending adjudication.",
      },
      {
        value: "caring",
        effect: "operational-only",
        reason:
          "Caring responsibilities are other people's circumstances as much as the customer's. Recapped as a demand on their time, never as a state of theirs.",
      },
      { value: "prefer-not-to-say", effect: "never-absence", reason: UNDISCLOSED_REASON },
    ],
    notes: "The only route by which history is asked for at all, and it stays context.",
  },

  {
    questionId: "core_rhythm_household_separate_reason_v1",
    answerField: "rhythm.householdSeparateReason",
    basis: po("Why eating together is difficult. A logistics fact about a household."),
    allowedUses: ["descriptive-recap", "practical-fit"],
    allowedTargets: ["familyContext", "thirtyDayLoop"],
    withheldTargets: [],
    valueRules: [
      {
        value: "works-better",
        effect: "operational-only",
        reason:
          "A complete and legitimate answer. The Report must stop trying to assemble everyone at a table and make the separate meals work better instead.",
      },
    ],
    notes: "Only asked of households that rarely eat together.",
  },

  /* ── Environment ──────────────────────────────────────────────────────── */

  {
    questionId: "core_environment_cooking_frequency_v1",
    answerField: "environment.cookingFrequency",
    basis: po("How much cooking happens at home. A logistics fact."),
    allowedUses: ["descriptive-recap", "operational-filtering", "practical-fit"],
    allowedTargets: ["thirtyDayLoop"],
    withheldTargets: [],
    notes:
      "Filters suggestions to what this kitchen actually does. The recap itself is ungated — how often somebody cooks is not food guidance — and anything that named a food would reach foodTools, which is.",
  },

  {
    questionId: "core_environment_who_prepares_v1",
    answerField: "environment.whoPrepares",
    basis: po("Who does the preparing. A household-roles fact."),
    allowedUses: ["descriptive-recap", "operational-filtering", "practical-fit"],
    allowedTargets: ["familyContext", "thirtyDayLoop"],
    withheldTargets: [],
    notes:
      "A plan addressed to the wrong person in the household is not a plan. Recapping who prepares food is ungated; naming what they should prepare is not, and would reach the gated target.",
  },

  {
    questionId: "core_environment_planning_v1",
    answerField: "environment.planning",
    basis: po("How food arrives — planned shop, top-ups, delivery. A logistics fact."),
    allowedUses: ["descriptive-recap", "operational-filtering", "practical-fit"],
    allowedTargets: ["thirtyDayLoop", "priorityLever"],
    withheldTargets: [],
    notes: "priorityLever means practical fit with how they already shop. Ungated: how food arrives is logistics, not food guidance.",
  },

  fromContract("core_environment_constraints_v1", "environment.constraints", {
    // No grant-level entry needed: its food-capable target is `foodTools`,
    // which `TARGET_CAPABILITIES` already gates for every question.
    valueRules: [
      { value: "prefer-not-to-say", effect: "never-absence", reason: UNDISCLOSED_REASON },
      {
        value: "allergy",
        effect: "operational-only",
        reason: "A thing to work around. Never a diagnosis, a severity or a risk level.",
      },
      {
        value: "medical-avoid",
        effect: "operational-only",
        reason: "A thing to work around. Never a diagnosis, a severity or a risk level.",
      },
    ],
    notes:
      "Operational filtering, practical feasibility and safety — not clinical interpretation.",
  }),

  {
    questionId: "core_environment_household_differing_needs_v1",
    answerField: "environment.householdDifferingNeeds",
    basis: po(
      "THAT household needs differ, and in what broad way. Never what anyone's condition is — the question is deliberately written not to ask.",
    ),
    allowedUses: ["descriptive-recap", "operational-filtering"],
    allowedTargets: ["familyContext", "thirtyDayLoop"],
    withheldTargets: [],
    valueRules: [
      {
        value: "allergies",
        effect: "operational-only",
        reason:
          "Direct household information only — never a diagnosis or a severity. It also participates in the Q17 safety contradiction rule (see report-safety.ts): this value is NOT wired into deriveFoodGuidanceConstraints, so the composer must fail closed rather than let a household allergy pass unnoticed.",
      },
      { value: "prefer-not-to-say", effect: "never-absence", reason: UNDISCLOSED_REASON },
    ],
    notes: "The conflicting-needs problem that defines most household food systems.",
  },

  fromContract("core_environment_food_avoidances_v1", "environment.foodAvoidances", {
    // `foodTools` is gated by TARGET_CAPABILITIES.
    valueRules: [
      {
        value: "other",
        effect: "never-absence",
        reason:
          "'Something else, not listed here' means an avoidance exists and is unresolved. It is not a clearance for anything.",
      },
      { value: "prefer-not-to-say", effect: "never-absence", reason: UNDISCLOSED_REASON },
    ],
    notes:
      "A product output filter, not clinical allergy management. Its own specialist gate governs the taxonomy.",
  }),

  /* ── Intentions ───────────────────────────────────────────────────────── */

  {
    questionId: "core_intentions_primary_focus_v1",
    answerField: "intentions.primaryFocus",
    basis: po(
      "What the customer says they want to work on. Their stated priority, quoted back as theirs — this authority reads it as a preference, never as a biological priority the product identified.",
    ),
    allowedUses: ["descriptive-recap", "practical-fit"],
    allowedTargets: ["priorityLever", "systemSnapshot", "thirtyDayLoop"],
    withheldTargets: [],
    notes: "priorityLever means THEIR stated starting point, not an inferred one.",
  },

  {
    questionId: "core_intentions_barrier_v1",
    answerField: "intentions.barrier",
    basis: po("What gets in the way, as the customer reports it. A practical obstacle."),
    allowedUses: ["descriptive-recap", "practical-fit"],
    allowedTargets: ["thirtyDayLoop", "priorityLever"],
    // The bank lists educationModules; choosing a teaching topic from a stated
    // barrier is topic selection, which needs adjudication.
    withheldTargets: ["educationModules"],
    notes: "A plan that ignores the stated barrier is a plan for somebody else.",
  },

  {
    questionId: "core_intentions_success_v1",
    answerField: "intentions.success",
    basis: po(
      "The customer's own words about what success would look like. Reproduced as a quotation and attributed to them; this authority permits no reading of it at all.",
    ),
    allowedUses: ["descriptive-recap"],
    allowedTargets: ["systemSnapshot"],
    // closingMissionPage is a marketing surface, not an answer target.
    withheldTargets: ["closingMissionPage"],
    notes:
      "Quotation only: never summarised, never paraphrased, never used to select any other content. The single unenumerated input, treated as data rather than signal.",
  },
]

/* ══ Capability requirements ═══════════════════════════════════════════════ */

/**
 * Requirements that belong to a TARGET, whatever question feeds it.
 *
 * `foodTools` is the Report's food section: anything landing there is, by
 * definition, food guidance, so it needs the dietetic gate no matter which
 * answer produced it. Every other target is ungated at this level — a gate
 * may still be required by the words (the content pack) or by one question's
 * particular grant.
 */
export const TARGET_CAPABILITIES: Readonly<
  Partial<Record<ConsultationReportTarget, readonly ReportCapability[]>>
> = {
  foodTools: ["specificFoods"],
}

/**
 * Every capability one operation needs, as an immutable derived set.
 *
 * DERIVED, never supplied. The caller states what it is trying to do — which
 * questions, which use, which target, which template — and this answers what
 * that operation costs. A caller that could pass a capability in could pass a
 * different one, and substituting `safetyNetting` for `specificFoods` would
 * satisfy a check while naming a food.
 *
 * Union of three authorities, deduplicated and sorted so the set is stable:
 *   · the target          — `foodTools` is food guidance whatever fed it
 *   · each question's own grant of that target
 *   · the template        — words that name a food need the gate even if the
 *                           target would not have required it
 */
export function requiredCapabilitiesFor(input: {
  sourceQuestionIds: readonly string[]
  target: ConsultationReportTarget
  templateCapabilities?: readonly ReportCapability[]
}): readonly ReportCapability[] {
  const required = new Set<ReportCapability>(TARGET_CAPABILITIES[input.target] ?? [])
  for (const questionId of input.sourceQuestionIds) {
    for (const capability of BY_ID.get(questionId)?.grantCapabilities?.[input.target] ?? []) {
      required.add(capability)
    }
  }
  for (const capability of input.templateCapabilities ?? []) required.add(capability)
  /*
   * Frozen, not merely returned. The requirement set is an authority's answer,
   * and a caller that could splice one out afterwards would have the override
   * this function exists to remove.
   */
  return Object.freeze([...required].sort())
}

/* ══ Lookup ════════════════════════════════════════════════════════════════ */

const BY_ID: ReadonlyMap<string, ReportUsePermission> = new Map(
  REPORT_USE_PERMISSIONS.map((p) => [p.questionId, p]),
)

/** The record for a question, or `undefined` — which means NO permission. */
export function permissionFor(questionId: string): ReportUsePermission | undefined {
  return BY_ID.get(questionId)
}

/**
 * May this question support this use, for this target?
 *
 * Named `permitsUse` rather than `useIsPermitted` because the latter reads as
 * a React hook — the lint rule said so, and it was right: a `use`-prefixed
 * function called inside a loop is exactly what that rule exists to catch.
 */
export function permitsUse(
  questionId: string,
  use: AllowedReportUse,
  target: ConsultationReportTarget,
): boolean {
  const record = BY_ID.get(questionId)
  // Unknown question: no record, no permission. Never a fallback.
  if (!record) return false
  if (!record.allowedUses.includes(use)) return false
  if (!record.allowedTargets.includes(target)) return false
  // Belt and braces against a record that contradicts itself.
  if (record.withheldTargets.includes(target)) return false
  return true
}

/** The rule governing one answer value, if any. */
export function valueRuleFor(questionId: string, value: string): ValueRule | undefined {
  return BY_ID.get(questionId)?.valueRules?.find((r) => r.value === value)
}

/** True when this exact value may never become customer-facing content. */
export function valueIsSilenced(questionId: string, value: string): boolean {
  return valueRuleFor(questionId, value)?.effect === "no-proposition"
}

/**
 * Every bank question id, for the coverage guard.
 *
 * Read from the bank so "exactly the 21" cannot drift when the bank does — the
 * guard then fails rather than the registry silently under-covering.
 */
export function bankQuestionIds(): readonly string[] {
  return CONSULTATION_QUESTION_BANK.map((q) => q.id)
}

/**
 * Does a science-adjudicated record still match its contract exactly?
 *
 * Exported so the test can assert it rather than re-deriving the comparison,
 * and so the answer has one definition.
 */
export function mirrorsItsContract(record: ReportUsePermission): boolean {
  if (record.basis.kind !== "science-adjudicated") return true
  const contract = scienceContractFor(record.questionId)
  if (!contract) return false
  const same = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|")
  return (
    same(record.allowedUses, contract.allowedReportUses) &&
    same(record.allowedTargets, contract.reportTargets.allowed) &&
    same(record.withheldTargets, contract.reportTargets.prohibited)
  )
}
