import type { ConsultationReportTarget } from "./types"

/**
 * The machine-readable Phase 3A Science Contract v1.0.
 *
 * ══ WHAT THIS IS ════════════════════════════════════════════════════════════
 *
 * The adjudicated output of the blinded multi-model science and evidence review
 * (`docs/phase-3a-science-contract-v1.md`), expressed as types and data so it
 * can be tested rather than remembered.
 *
 * That document is authoritative. This module implements it; it does not
 * reinterpret it. Where the two could disagree, the document wins and this file
 * is wrong.
 *
 * ══ WHAT THIS IS NOT ════════════════════════════════════════════════════════
 *
 * Not a medical rules engine. There is deliberately no diagnostic scoring, no
 * health-risk scoring, no disease likelihood, no allergy severity, no symptom
 * triage, no biomarker proxy, and no microbiome, metabolic or Postbiotics
 * score. This module CONSTRAINS interpretation. It does not invent any.
 *
 * Not clinical validation, not scientific validation in the experimental sense,
 * not professional medical sign-off, not regulatory approval. Three blinded AI
 * reviews reduce single-reviewer error; they are not evidence, and agreement
 * between them establishes nothing the underlying evidence does not.
 *
 * ══ DORMANT ════════════════════════════════════════════════════════════════
 *
 * Nothing here is wired into the live runtime. The deterministic Consultation
 * bank is still dormant, `/assessment/deep` still runs the runtime-AI path, and
 * the live Report generator is untouched. Phase 4A integrates this contract
 * into Report generation; this phase only records it in a form Phase 4A can
 * mechanically consume.
 */

/* ══ Vocabulary ════════════════════════════════════════════════════════════ */

/**
 * Adjudicated status of the PROPOSED USE of an answer — never of the topic.
 *
 * A well-studied topic still earns `CONTEXT_ONLY` when the product's intended
 * use of the answer outruns what the evidence supports for that use.
 */
export type ScienceEvidenceStatus = "SUPPORTED" | "CONTEXT_ONLY" | "PROHIBITED" | "SPECIALIST_REVIEW"

export type CollectionDecision = "KEEP" | "REMOVE"

/**
 * The inferences a question's answer may not support.
 *
 * A closed union rather than prose, so a test can ask "is `microbiome-composition`
 * prohibited for every CONTEXT_ONLY signal question?" without string matching —
 * and so a new prohibited inference has to be named once and reused, rather than
 * re-phrased slightly differently in seven places.
 */
export type ProhibitedInference =
  | "diagnosis"
  | "causation"
  | "efficacy-prediction"
  | "proven-trigger"
  | "glucose-state"
  | "insulin-state"
  | "metabolic-state"
  | "endocrine-state"
  | "circadian-diagnosis"
  | "sleep-diagnosis"
  | "nutrient-deficiency"
  | "food-intolerance"
  | "food-allergy"
  | "allergy-severity"
  | "clinical-risk-level"
  | "inflammatory-state"
  | "immune-state"
  | "microbiome-composition"
  | "microbial-function"
  | "microbial-metabolite"
  | "postbiotics-state"
  | "clinical-state"
  | "biomarker"
  | "dietary-adequacy"
  | "medical-necessity-verification"
  | "treatment-selection"
  | "therapeutic-food-prescription"
  | "physiology-driven-food-selection"
  | "guaranteed-recurrence"

/** What a Report is permitted to do with an answer. */
export type AllowedReportUse =
  | "descriptive-recap"
  | "educational-topic-selection"
  | "low-risk-self-observation"
  | "transparent-reflection"
  | "practical-timing"
  | "practical-fit"
  | "routine-support"
  | "operational-filtering"
  | "output-suppression"

/** Targeted human gates that remain OPEN. None is closed by this contract. */
export type SpecialistGate =
  | "food-allergy-dietetic-eu-taxonomy"
  | "safety-netting-wording"
  | "eu-legal-health-claims"

/* ══ Per-question contract ═════════════════════════════════════════════════ */

/**
 * How a semantic answer value may NOT be turned into an instruction.
 *
 * Distinct from `ProhibitedInference`: those are claims about the customer's
 * biology, these are actions taken on the customer's eating. An innocuous
 * self-report is one short step from a restriction instruction, and that step
 * must not be available.
 */
export type ProhibitedOperationalisation =
  | "eat-less"
  | "smaller-portions"
  | "fewer-meals"
  | "reduced-calories"
  | "calorie-restriction"
  | "restriction"
  | "meal-skipping"
  | "progressive-restriction"

export interface AnswerActionBoundary {
  /** The semantic answer value this boundary governs. */
  answerValue: string
  /** The only reading permitted of that value. */
  allowedInterpretation: string
  prohibitedOperationalisations: readonly ProhibitedOperationalisation[]
}

/**
 * An OR-bundled semantic value, recorded so downstream code cannot pretend the
 * customer selected one half of it.
 *
 * `components` exists to be asserted against, NOT to be read as a decomposition
 * API. There is deliberately no exported function that splits a bundle: the
 * whole point is that "you selected sleep" is a claim the customer never made
 * when what they selected was "Stress was high or sleep was short".
 */
export interface BundledAnswerValue {
  questionId: string
  value: string
  /** The label's own OR-components. Never separately derivable. */
  components: readonly string[]
  integrity: "atomic"
}

export interface ReportTargetContract {
  /** Targets this answer may inform, with the meaning each is limited to. */
  allowed: readonly ConsultationReportTarget[]
  /** Targets explicitly withheld by adjudication. */
  prohibited: readonly ConsultationReportTarget[]
  /** What an allowed target may mean for THIS question. */
  meaning?: Partial<Record<ConsultationReportTarget, string>>
}

export interface QuestionScienceContract {
  questionId: string
  evidenceStatus: ScienceEvidenceStatus
  collectionDecision: CollectionDecision
  /** The single maximum allowed reading of the answer. */
  allowedInterpretation: string
  allowedReportUses: readonly AllowedReportUse[]
  prohibitedInferences: readonly ProhibitedInference[]
  reportTargets: ReportTargetContract
  actionBoundaries?: readonly AnswerActionBoundary[]
  bundledValues?: readonly BundledAnswerValue[]
  specialistGate?: SpecialistGate
}

/** The six questions surviving adjudication. */
export type ReviewedQuestionId =
  | "core_signals_post_meal_pattern_v1"
  | "core_signals_energy_shape_v1"
  | "core_signals_context_v1"
  | "core_signals_settled_days_v1"
  | "core_environment_constraints_v1"
  | "core_environment_food_avoidances_v1"

/** Inferences no CONTEXT_ONLY self-report may ever support. Shared so the four
 *  signal questions cannot drift apart on the things that matter most. */
const SELF_REPORT_PROHIBITED: readonly ProhibitedInference[] = [
  "diagnosis",
  "causation",
  "glucose-state",
  "insulin-state",
  "metabolic-state",
  "inflammatory-state",
  "immune-state",
  "microbiome-composition",
  "microbial-function",
  "microbial-metabolite",
  "postbiotics-state",
  "clinical-state",
  "biomarker",
]

export const QUESTION_SCIENCE_CONTRACTS: Readonly<Record<ReviewedQuestionId, QuestionScienceContract>> = {
  core_signals_post_meal_pattern_v1: {
    questionId: "core_signals_post_meal_pattern_v1",
    evidenceStatus: "CONTEXT_ONLY",
    collectionDecision: "KEEP",
    allowedInterpretation:
      "The customer reports that this is the thing they tend to notice after eating.",
    allowedReportUses: [
      "descriptive-recap",
      "educational-topic-selection",
      "low-risk-self-observation",
      "transparent-reflection",
    ],
    prohibitedInferences: [
      ...SELF_REPORT_PROHIBITED,
      "food-intolerance",
      "food-allergy",
      "treatment-selection",
      "therapeutic-food-prescription",
    ],
    reportTargets: {
      allowed: ["systemSnapshot"],
      // Adjudicated: the name asserts a reported sensation has been located in
      // a body system, which the product cannot establish. Phase 4A decides the
      // replacement representation; this contract only withholds the target.
      prohibited: ["bodySignalMap"],
      meaning: {
        systemSnapshot: "May summarise customer-reported information only. Never what is happening biologically inside the customer.",
      },
    },
  },

  core_signals_energy_shape_v1: {
    questionId: "core_signals_energy_shape_v1",
    evidenceStatus: "CONTEXT_ONLY",
    collectionDecision: "KEEP",
    allowedInterpretation:
      "The customer reports a particular pattern in their energy across a typical day.",
    // Timing only. The action must already be appropriate on its own terms; this
    // answer decides WHEN it is placed, never whether or why.
    allowedReportUses: ["practical-timing", "descriptive-recap", "transparent-reflection"],
    prohibitedInferences: [
      ...SELF_REPORT_PROHIBITED,
      "endocrine-state",
      "circadian-diagnosis",
      "sleep-diagnosis",
      "nutrient-deficiency",
      "physiology-driven-food-selection",
    ],
    reportTargets: {
      allowed: ["priorityLever", "thirtyDayLoop"],
      prohibited: ["bodySignalMap"],
      meaning: {
        priorityLever: "PRACTICAL TIMING / FIT. Never a causal physiological lever.",
        thirtyDayLoop: "Timing only.",
      },
    },
  },

  core_signals_context_v1: {
    questionId: "core_signals_context_v1",
    evidenceStatus: "CONTEXT_ONLY",
    collectionDecision: "KEEP",
    allowedInterpretation:
      "The customer reports that this context is often also present on the days they notice the reported pattern. This is customer-reported recalled co-occurrence, not observed association, not a demonstrated trigger, not a mechanism and not causation.",
    allowedReportUses: ["practical-fit", "descriptive-recap", "transparent-reflection"],
    prohibitedInferences: [...SELF_REPORT_PROHIBITED, "efficacy-prediction", "proven-trigger"],
    reportTargets: {
      allowed: ["priorityLever", "thirtyDayLoop"],
      prohibited: ["bodySignalMap"],
      meaning: {
        priorityLever: "FIT / RELEVANCE / PRACTICAL STARTING POINT. Never efficacy, proven trigger, causal target or physiological lever.",
      },
    },
    bundledValues: [
      {
        questionId: "core_signals_context_v1",
        value: "rushed",
        components: ["meals were rushed", "meals were skipped"],
        integrity: "atomic",
      },
      {
        questionId: "core_signals_context_v1",
        value: "large-late",
        components: ["meals were unusually large", "meals were late"],
        integrity: "atomic",
      },
      {
        questionId: "core_signals_context_v1",
        value: "stress-sleep",
        components: ["stress was high", "sleep was short"],
        integrity: "atomic",
      },
    ],
  },

  core_signals_settled_days_v1: {
    questionId: "core_signals_settled_days_v1",
    evidenceStatus: "CONTEXT_ONLY",
    collectionDecision: "KEEP",
    allowedInterpretation:
      "The customer reports that this tends to be different on days they experience as more settled.",
    allowedReportUses: ["routine-support", "low-risk-self-observation", "transparent-reflection"],
    prohibitedInferences: [...SELF_REPORT_PROHIBITED, "efficacy-prediction", "guaranteed-recurrence"],
    reportTargets: {
      allowed: ["priorityLever", "thirtyDayLoop"],
      prohibited: [],
      meaning: {
        priorityLever: "A routine the customer themselves reports, which the Report may back rather than replace.",
      },
    },
    actionBoundaries: [
      {
        answerValue: "lighter-meals",
        allowedInterpretation:
          "The customer reports that lighter or simpler meals tend to occur on days they describe as more settled.",
        // The whole list, because the failure is a slide: "lighter" → "less" →
        // "smaller portions" → a restriction programme nobody adjudicated.
        prohibitedOperationalisations: [
          "eat-less",
          "smaller-portions",
          "fewer-meals",
          "reduced-calories",
          "calorie-restriction",
          "restriction",
          "meal-skipping",
          "progressive-restriction",
        ],
      },
    ],
  },

  core_environment_constraints_v1: {
    questionId: "core_environment_constraints_v1",
    evidenceStatus: "SUPPORTED",
    collectionDecision: "KEEP",
    allowedInterpretation:
      "The customer says these are constraints the Report needs to work around. Support is for operational filtering, practical feasibility and safety — not clinical interpretation.",
    allowedReportUses: ["operational-filtering", "practical-fit", "transparent-reflection"],
    prohibitedInferences: [
      "diagnosis",
      "food-allergy",
      "allergy-severity",
      "medical-necessity-verification",
      "dietary-adequacy",
      "clinical-state",
    ],
    reportTargets: {
      allowed: ["foodTools", "thirtyDayLoop", "familyContext"],
      prohibited: [],
    },
  },

  core_environment_food_avoidances_v1: {
    questionId: "core_environment_food_avoidances_v1",
    evidenceStatus: "SUPPORTED",
    collectionDecision: "KEEP",
    allowedInterpretation:
      "The customer asked the Report not to suggest these declared broad food categories. This is a product output filter, not clinical allergy management.",
    allowedReportUses: ["operational-filtering", "output-suppression"],
    prohibitedInferences: [
      "diagnosis",
      "allergy-severity",
      "clinical-risk-level",
      "medical-necessity-verification",
      "clinical-state",
    ],
    reportTargets: {
      allowed: ["foodTools", "thirtyDayLoop"],
      prohibited: [],
    },
    // The broad categories are not a definitive Irish/EU allergen ontology.
    // Resolving that is the gate's job, not this contract's.
    specialistGate: "food-allergy-dietetic-eu-taxonomy",
  },
} as const

/* ══ Removed by adjudication ═══════════════════════════════════════════════ */

/**
 * Questions the science contract removed, kept as an explicit record.
 *
 * Recorded rather than forgotten so the decision cannot be quietly reversed by
 * someone re-adding the question without knowing it was adjudicated out. This
 * is a tombstone, not a bank entry — a test asserts these ids are absent from
 * the live bank.
 */
export interface RemovedQuestionRecord {
  questionId: string
  evidenceStatus: Extract<ScienceEvidenceStatus, "PROHIBITED">
  collectionDecision: Extract<CollectionDecision, "REMOVE">
  reason: string
  /** Personalised actions this answer must never drive, were it ever restored. */
  prohibitedPersonalisation: readonly string[]
  /** Thresholds explicitly NOT approved, so none returns as a "compromise". */
  rejectedThresholds: readonly string[]
}

export const REMOVED_BY_SCIENCE_CONTRACT: readonly RemovedQuestionRecord[] = [
  {
    questionId: "core_rhythm_antibiotics_v1",
    evidenceStatus: "PROHIBITED",
    collectionDecision: "REMOVE",
    reason:
      "No sufficiently useful EatoBiotics-specific downstream action survives the evidence review. The question collected high-sensitivity medication and health-history data while the product cannot infer present microbiome state, recovery status, microbial function, Postbiotics state, dietary need or treatment need.",
    prohibitedPersonalisation: [
      "Feed",
      "Seed",
      "Regenerate",
      "probiotics",
      "fermented foods",
      "fibre prescriptions",
      "restoration",
      "repair",
      "rebuilding",
      "reseeding",
      "microbiome recovery",
    ],
    rejectedThresholds: ["six months", "two years"],
  },
] as const

/* ══ Cross-cutting rules ═══════════════════════════════════════════════════ */

/**
 * AGGREGATION DOES NOT UPGRADE EVIDENCE.
 *
 * Where a questionnaire most easily acquires a claim none of its questions
 * earned: every answer handled correctly, and the synthesis quietly asserting
 * what no input supported.
 */
export const AGGREGATION_EVIDENCE_RULE = {
  id: "aggregation-does-not-upgrade-evidence",
  statement:
    "Combining multiple self-reported answers does not increase their evidentiary status. Multiple self-reports remain multiple self-reports.",
  /** States no combination of self-reports may produce. */
  cannotProduce: [
    "diagnosis",
    "biomarker",
    "clinical-state",
    "metabolic-state",
    "glucose-state",
    "insulin-state",
    "inflammatory-state",
    "immune-state",
    "microbiome-composition",
    "microbial-function",
    "microbial-metabolite",
    "postbiotics-state",
  ] as const satisfies readonly ProhibitedInference[],
  /** A validated system model is likewise not reachable by composition. */
  cannotProduceValidatedSystemModel: true,
} as const

/**
 * The status of a set of answers considered together.
 *
 * Pure, and deliberately monotone downward: the combination is never stronger
 * than its weakest input. Four `CONTEXT_ONLY` answers combine to
 * `CONTEXT_ONLY`, never to `SUPPORTED` — which is the entire rule, expressed
 * as something a test can execute rather than something a reviewer must
 * remember.
 */
export function aggregateEvidenceStatus(
  statuses: readonly ScienceEvidenceStatus[],
): ScienceEvidenceStatus {
  if (statuses.length === 0) return "PROHIBITED"
  // Weakest wins. Order is the strength ladder, lowest first.
  const ladder: readonly ScienceEvidenceStatus[] = [
    "PROHIBITED",
    "SPECIALIST_REVIEW",
    "CONTEXT_ONLY",
    "SUPPORTED",
  ]
  let weakest = "SUPPORTED" as ScienceEvidenceStatus
  for (const s of statuses) {
    if (ladder.indexOf(s) < ladder.indexOf(weakest)) weakest = s
  }
  return weakest
}

/**
 * What the Report may and may not do with synthesis itself.
 *
 * No future AI-generation prompt may use synthesis as evidence.
 */
export const REPORT_COMPOSITION_BOUNDARY = {
  allowedFramings: [
    "You told us",
    "You reported",
    "You notice",
    "You said this tends to happen",
    "Based on the routines and constraints you described",
  ],
  prohibitedFramings: [
    "We found",
    "This shows",
    "This indicates your biology",
    "This reveals",
    "Your microbiome is",
    "Your metabolism is",
    "Your system is",
  ],
  note: "Prohibited framings become available only if a future, separately validated measurement genuinely establishes the claim.",
} as const

/**
 * The Postbiotics inference boundary.
 *
 * A postbiotic is an appropriate preparation of inanimate microorganisms and/or
 * their components that confers a health benefit on the host. Self-report does
 * not reach it.
 *
 * `prohibitedRelationships` is the part that matters and is stronger than the
 * pre-review proposal, which covered only "quantify". The softer verbs are how
 * the same claim returns wearing a hedge.
 */
export const POSTBIOTICS_INFERENCE_BOUNDARY = {
  prohibitedSubjects: [
    "personal Postbiotics state",
    "Postbiotics inadequacy",
    "Postbiotics production",
    "low Postbiotics",
    "high Postbiotics",
    "Postbiotics recovery",
    "microbial-metabolite state",
    "microbial activity",
    "microbiome composition",
  ],
  prohibitedRelationships: [
    "quantify",
    "indicate",
    "reflect",
    "correspond-to",
    "result-from",
    "reveal",
    "be-produced-by",
  ],
  statement:
    "EatoBiotics may use self-reported patterns as educational context, but those patterns do not quantify, indicate, reflect, correspond to, result from or reveal postbiotic preparations, microbial products, microbial metabolites, microbial activity, microbial production, microbiome composition or clinical adequacy.",
} as const

/**
 * The `Regenerate` boundary.
 *
 * The Feed · Seed · Regenerate action language is preserved and NOT renamed.
 * What is bounded is what `Regenerate` may be taken to mean scientifically. A
 * future science/brand-language pass may define it positively; this contract
 * only says what it does not mean today.
 */
export const REGENERATE_BOUNDARY = {
  term: "Regenerate",
  preservedAsActionLanguage: true,
  mustNotMean: [
    "increase Postbiotics",
    "produce Postbiotics",
    "restore Postbiotics",
    "increase butyrate",
    "increase acetate",
    "increase propionate",
    "restore microbial metabolites",
    "rebuild the microbiome",
    "repair the microbiome",
  ],
  note: "Unless future evidence and an appropriate measurement justify such a claim.",
} as const

/* ══ Constraint classes ════════════════════════════════════════════════════ */

/**
 * How a declared constraint must be read downstream.
 *
 * `undisclosed` is the load-bearing member. Collapsing "prefer not to say" into
 * "no constraint" converts a declined disclosure into an affirmative safety
 * claim — the single most consequential misreading available in this question.
 */
export type ConstraintClass = "safety" | "practical" | "undisclosed" | "none-declared"

export const CONSTRAINT_CLASSES = {
  /** Require a specific avoidance to be resolved before specific food guidance. */
  safety: ["allergy", "medical-avoid"],
  /** Shape suggestions without making an unnamed food unsafe. */
  practical: ["vegetarian-vegan", "religious-cultural", "budget", "time", "dislikes"],
  /** A declined disclosure. NEVER equivalent to `none-declared`. */
  undisclosed: ["prefer-not-to-say"],
  /** An affirmative statement that there is nothing to work around. */
  noneDeclared: ["none"],
} as const

/** The class of one declared constraint value. */
export function constraintClass(value: string): ConstraintClass {
  if ((CONSTRAINT_CLASSES.safety as readonly string[]).includes(value)) return "safety"
  if ((CONSTRAINT_CLASSES.practical as readonly string[]).includes(value)) return "practical"
  if ((CONSTRAINT_CLASSES.undisclosed as readonly string[]).includes(value)) return "undisclosed"
  if ((CONSTRAINT_CLASSES.noneDeclared as readonly string[]).includes(value)) return "none-declared"
  // Unknown values are treated as undisclosed rather than absent: an
  // unrecognised constraint is information we do not have, not information that
  // there is nothing to work around.
  return "undisclosed"
}

/**
 * True only where the customer affirmatively said there is nothing to work
 * around. A declined disclosure returns false.
 */
export function declaresNoConstraints(values: readonly string[]): boolean {
  if (values.length === 0) return false
  return values.every((v) => constraintClass(v) === "none-declared")
}

/* ══ unresolvedSpecificAvoidance ═══════════════════════════════════════════ */

/**
 * What `unresolvedSpecificAvoidance` (lib/consultation/food-guidance.ts) means,
 * and — more importantly — what it does not.
 *
 * It is the absence of information, full stop. Reading it as a risk level is
 * how a conservative product behaviour becomes an unearned clinical claim.
 */
export const UNRESOLVED_AVOIDANCE_SEMANTICS = {
  means: "EatoBiotics does not have enough specific information.",
  doesNotMean: [
    "clinical risk level",
    "allergy severity",
    "anaphylaxis likelihood",
    "diagnostic confidence",
    "medical-risk score",
  ],
  /** Required product behaviour while true. Recorded, not activated. */
  requiredBehaviourWhenTrue: [
    "suppress specific food recommendations that could conflict with an unknown restriction",
    "use generic food and routine guidance",
    "never infer a safe substitute",
    "never coerce disclosure",
    "never describe an unselected food as safe",
  ],
} as const

/* ══ Specialist gates ══════════════════════════════════════════════════════ */

export interface SpecialistGateRecord {
  gate: SpecialistGate
  scope: readonly string[]
  requiredBefore: string
  status: "OPEN"
}

/**
 * All three gates remain OPEN. Nothing in the multi-model process closes one,
 * and no AI review may be described as professional validation.
 */
export const SPECIALIST_GATES: readonly SpecialistGateRecord[] = [
  {
    gate: "food-allergy-dietetic-eu-taxonomy",
    scope: [
      "Q6/Q7 taxonomy",
      "suppression logic",
      "unresolved failure modes",
      "safety copy",
      "broad-category design",
    ],
    requiredBefore: "activating specific food recommendations",
    status: "OPEN",
  },
  {
    gate: "safety-netting-wording",
    scope: ["one proportionate customer-facing sentence"],
    requiredBefore: "showing safety-netting copy in the Signals section",
    status: "OPEN",
  },
  {
    gate: "eu-legal-health-claims",
    scope: ["customer-facing use of Prebiotics, Probiotics and Postbiotics", "health-claims implications"],
    requiredBefore: "customer activation",
    status: "OPEN",
  },
] as const

/* ══ Approved future copy ══════════════════════════════════════════════════ */

/**
 * Adjudicated wording for Phase 4A. Present as constants so the approved text
 * cannot be paraphrased into something weaker when it is eventually used.
 *
 * NOT IMPLEMENTED. Not surfaced in any live UI, Report, PDF or email.
 */
export const FUTURE_FOOD_SAFETY_COPY = {
  status: "APPROVED_SCIENCE_CONTRACT_COPY_NOT_IMPLEMENTED",
  universal:
    "EatoBiotics does not verify ingredients or determine whether a food is safe for you. Check ingredients and labels against your own allergies, intolerances and medical food restrictions before trying a specific food suggestion.",
  unresolvedAvoidance:
    "If you're unsure what you need to avoid, use the general guidance only and check with an appropriate healthcare professional or registered dietitian before acting on specific food suggestions.",
} as const

/* ══ Lookups ═══════════════════════════════════════════════════════════════ */

export const REVIEWED_QUESTION_IDS = Object.keys(QUESTION_SCIENCE_CONTRACTS) as ReviewedQuestionId[]

export function scienceContractFor(questionId: string): QuestionScienceContract | undefined {
  return (QUESTION_SCIENCE_CONTRACTS as Record<string, QuestionScienceContract>)[questionId]
}

/** True when this inference is prohibited for this question. */
export function isInferenceProhibited(questionId: string, inference: ProhibitedInference): boolean {
  const contract = scienceContractFor(questionId)
  if (!contract) return true // unknown question: refuse rather than permit
  return contract.prohibitedInferences.includes(inference)
}

/** True when the answer value is an OR-bundle that must never be decomposed. */
export function isBundledValue(questionId: string, value: string): boolean {
  const contract = scienceContractFor(questionId)
  return (contract?.bundledValues ?? []).some((b) => b.value === value)
}

/**
 * Every bundled value in the contract.
 *
 * Note what is deliberately absent from this module: any function that returns
 * a bundle's components as separately-selected facts. `components` is recorded
 * on the bundle for review and testing; there is no decomposition API, because
 * the customer selecting "Stress was high or sleep was short" never told us
 * which.
 */
export function allBundledValues(): readonly BundledAnswerValue[] {
  return REVIEWED_QUESTION_IDS.flatMap((id) => QUESTION_SCIENCE_CONTRACTS[id].bundledValues ?? [])
}

/** Report targets adjudication withheld from a question. */
export function prohibitedReportTargets(questionId: string): readonly ConsultationReportTarget[] {
  return scienceContractFor(questionId)?.reportTargets.prohibited ?? []
}
