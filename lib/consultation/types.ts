/**
 * The Personal Food System Consultation contract — the FUTURE deterministic
 * question architecture.
 *
 * ══ NON-ACTIVATING ══════════════════════════════════════════════════════════
 *
 * Nothing in `lib/consultation/` is wired into the live paid Consultation.
 * `/assessment/deep` still runs the runtime-AI question path, and this module
 * is not imported by any route, page or component. That is deliberate for
 * Phase 3A: the whole bank — every question, option, answer field, sensitivity
 * classification and report mapping — must be reviewable in full BEFORE a
 * paying customer ever sees it. Activation for new sessions is Phase 3B.
 *
 * `tests/unit/consultation-question-bank.test.ts` asserts the non-import
 * property mechanically, so "additive only" cannot quietly stop being true.
 *
 * ══ WHY DETERMINISTIC ═══════════════════════════════════════════════════════
 *
 * The core paid questions are currently authored by Claude at runtime. That is
 * the wrong owner for them. Questions are product and science assets: they need
 * review, stable meaning, a declared reason to exist, and an answer the report
 * builder can actually branch on. A generated question can satisfy none of
 * those, and it cannot be checked against the free Assessment for duplication
 * because it does not exist until the customer is already paying.
 *
 * The existing lens banks (lib/assessment/addon-questions.ts) are the
 * architectural reference: fixed ids, stable answer values, and documentation
 * carried as data rather than kept in a file beside the code. This contract
 * takes that further — stable semantic ids, semantic answer fields, declared
 * report targets, declared sensitivity, and declared applicability.
 *
 * AI keeps the job it is actually good at: interpreting the answers into the
 * Personal Food System Report narrative.
 *
 * ══ COUPLING, AND THE ONE EXCEPTION ═════════════════════════════════════════
 *
 * This module imports exactly one thing: `AddonType` from `lib/addon-types.ts`.
 *
 * That import is required rather than chosen. `tests/unit/addon-contract.test.ts`
 * fails the build if any file under lib/, app/ or components/ re-declares the
 * add-on union, because that list was once written out by hand in four places
 * and a fifth add-on would have been added to three of them. `addon-types.ts`
 * is a dependency-free leaf built precisely so that modules which cannot import
 * each other can both import it, so taking it costs nothing in coupling and
 * respects an invariant that predates this phase.
 *
 * `ConsultationFoundation` and `ConsultationReportTarget` are still restated
 * rather than imported: `FoundationKey` lives in `lib/assessment/registry.ts`,
 * which pulls in glucose scoring, stability types and pregnancy types, and
 * `FoodSystemReport` pulls in zod and the report model. Neither belongs in a
 * module that is supposed to be inert.
 *
 * Restating a union is normally how two lists drift apart, so the drift is
 * closed where it can be closed for free: the test file imports the real
 * `FoundationKey` and `FoodSystemReport` and asserts, at compile time, that
 * these unions still agree with them. `tsc` runs in the gate, so a divergence
 * is a build failure — the failure simply lands in a test rather than in the
 * dependency graph.
 */

import type { AddonType } from "@/lib/addon-types"

/**
 * The application-level version of this bank.
 *
 * NOT a database schema version — Phase 3A adds no migration and no column.
 * It is the version that appears in every core question id (`…_v1`), and the
 * bank validator checks the two agree, so a v2 question cannot be dropped into
 * a v1 bank without the version constant moving with it.
 */
export const CONSULTATION_BANK_VERSION = "v1"

/**
 * The four customer-facing sections.
 *
 * `signals` is what someone notices day to day — not symptoms, not diagnosis.
 * `rhythm` is how food fits into the real day, including selected history as
 * context (there is deliberately no "Gut History" or "Medical History"
 * section). `environment` is what they buy, prepare, can access and need the
 * Report to work around. `intentions` is what matters to them and what has
 * made change hard — "Intentions", never "Goals".
 *
 * Lens questions are NOT a section here: the entitled lens appends its own
 * deterministic bank (lib/assessment/addon-questions.ts), which this contract
 * deliberately does not redesign. Orientation and Answer Review are future UI
 * states, not sections.
 */
export type ConsultationSection = "signals" | "rhythm" | "environment" | "intentions"

export const CONSULTATION_SECTIONS: readonly ConsultationSection[] = [
  "signals",
  "rhythm",
  "environment",
  "intentions",
]

/**
 * Section-level explanation, so that individual questions do not each need to
 * carry a miniature health claim. See `supportText` on the question spec.
 */
export const SECTION_META: Record<
  ConsultationSection,
  { title: string; familyTitle: string; purpose: string }
> = {
  signals: {
    title: "Your Signals",
    familyTitle: "Your Signals",
    purpose: "What you notice day to day. There is no wrong answer, and nothing here is a medical judgement.",
  },
  rhythm: {
    title: "Your Rhythm",
    familyTitle: "Your Rhythm",
    purpose: "How food actually fits into your day and week, including anything that has recently changed.",
  },
  environment: {
    title: "Your Food Environment",
    familyTitle: "Your Food Environment",
    purpose: "What you buy, cook and have access to — so your Report suggests things that fit your real life.",
  },
  intentions: {
    title: "Your Intentions",
    familyTitle: "Your Intentions",
    purpose: "What you want from this, and what has made change hard before.",
  },
}

/**
 * Canonical foundation. Restates `FoundationKey` (lib/assessment/registry.ts).
 * Phase 3A introduces no third foundation and no persisted `sourceAssessment`.
 */
export type ConsultationFoundation = "you" | "family"

export const CONSULTATION_FOUNDATIONS: readonly ConsultationFoundation[] = ["you", "family"]

/**
 * The entitled lens, if any — the canonical `AddonType`, imported rather than
 * restated (see the header note on `addon-contract.test.ts`).
 *
 * Present in the resolver's context because a future runtime appends the lens
 * bank after the core bank. This contract never renames a lens answer value
 * and never redesigns the four lens products.
 */
export type ConsultationLens = AddonType

/**
 * Question interaction types.
 *
 * `yesno` is deliberately ABSENT. The legacy `DeepQuestion` schema has it, but
 * a two-option `single` carries the same information with one fewer branch in
 * every validator, renderer and report reader — and the legacy yes/no
 * questions only exist to hang a `followUp` off, which this contract replaces
 * with declared applicability. Retaining a type because a previous schema had
 * it is how type proliferation starts.
 *
 * `slider` is supported by the contract and its validator but is not used by
 * the v1 bank: nothing in v1 is genuinely a magnitude, and adding a slider to
 * exercise the type would inflate the bank. The validator still implements and
 * tests the slider rules, because a future bank will need them and "no
 * implicit or default answer" is the rule most likely to be got wrong later.
 */
export type ConsultationQuestionType = "single" | "multi" | "slider" | "textarea"

export const CONSULTATION_QUESTION_TYPES: readonly ConsultationQuestionType[] = [
  "single",
  "multi",
  "slider",
  "textarea",
]

/**
 * How sensitive the answer is, as review architecture rather than runtime
 * behaviour.
 *
 * The point is to force a decision to be visible. "The customer consented" is
 * not a reason to collect something, and a `high` classification is a standing
 * invitation to ask whether the question should exist at all or at least be
 * optional. Nothing in Phase 3A branches on this at runtime.
 */
export type ConsultationSensitivity = "low" | "medium" | "high"

export const CONSULTATION_SENSITIVITIES: readonly ConsultationSensitivity[] = ["low", "medium", "high"]

/**
 * Where an answer is intended to add value, named in the frozen report's own
 * terms. Every member is a real field of `FoodSystemReport`
 * (lib/report/food-system-report-types.ts) — the test asserts that at compile
 * time, so this cannot drift into inventing future deliverables.
 *
 * A question with no legitimate report target should not exist, which is why
 * `reportTargets` is required and non-empty.
 */
export type ConsultationReportTarget =
  | "systemSnapshot"
  | "foodSystemMap"
  | "educationModules"
  | "bodySignalMap"
  | "priorityLever"
  | "foodTools"
  | "thirtyDayLoop"
  | "familyContext"
  | "closingMissionPage"

export const CONSULTATION_REPORT_TARGETS: readonly ConsultationReportTarget[] = [
  "systemSnapshot",
  "foodSystemMap",
  "educationModules",
  "bodySignalMap",
  "priorityLever",
  "foodTools",
  "thirtyDayLoop",
  "familyContext",
  "closingMissionPage",
]

/**
 * Whether the wording of this question — or its support text — still needs
 * external human sign-off.
 *
 * `reviewed` must never be set by an agent or a developer. It means a
 * qualified human has actually read the wording, and nothing in this PR
 * carries it; a test asserts the v1 bank contains zero `reviewed` entries, so
 * the flag cannot become decoration.
 *
 * `not-required` means the wording makes no scientific claim at all — it asks
 * about cooking, shopping, timing or preference. It is not a claim that
 * something has been reviewed.
 */
export type ConsultationScienceReview = "not-required" | "required" | "reviewed"

/** A selectable answer for a `single` or `multi` question. */
export interface ConsultationOption {
  label: string
  /** Stable wire value. Renaming one is a breaking change to stored answers. */
  value: string
  /** Household wording, when the personal label would not fit a household. */
  familyLabel?: string
  /**
   * Cannot be selected alongside any other value on a `multi` question.
   *
   * Declared as data, never inferred by looking for the words "none" or "not
   * sure": a future option reading "Nothing much has changed" would silently
   * stop being exclusive under a word-matching rule the moment someone
   * rephrased it.
   */
  exclusive?: boolean
}

/**
 * Operators for a declared applicability rule.
 *
 * Each takes a LIST of values, which is what keeps this from needing an
 * expression language: "any of these" is expressed by the list rather than by
 * an `or` combinator, and every rule stays a single flat object.
 *
 *   equals     — a `single` answer that is one of `values`
 *   notEquals  — a `single` answer that is none of `values`
 *   includes   — a `multi` answer containing at least one of `values`
 *
 * There is no `and`, no nesting and no negation of a whole rule. Anything that
 * cannot be said with one of these three is a signal that the bank is getting
 * a decision tree, which §48 of the phase spec explicitly rules out.
 */
export type ConsultationOperator = "equals" | "notEquals" | "includes"

export const CONSULTATION_OPERATORS: readonly ConsultationOperator[] = ["equals", "notEquals", "includes"]

/**
 * The condition under which an adaptive question applies.
 *
 * The trigger question must be declared in the same bank, must appear BEFORE
 * this question, and every value listed must be an option the trigger question
 * actually offers — all three enforced by `validateConsultationBank`. A rule
 * pointing at a value the parent can never produce is a question that can
 * never be asked, which is worse than a missing question because it looks
 * present in review.
 */
export interface ConsultationApplicability {
  questionId: string
  operator: ConsultationOperator
  values: readonly string[]
}

/**
 * One question in the deterministic bank.
 *
 * Everything a reviewer needs is carried as data: this is what the review pack
 * (docs/phase-3a-consultation-question-bank-review.md) is generated from, so
 * the document cannot describe a bank that no longer exists.
 */
export interface ConsultationQuestion {
  /**
   * Stable, semantic, versioned, globally unique, and NEVER positional.
   *
   * `dq1`/`dq2` encode display order into the identity of the answer, so
   * inserting a question renames every answer after it — and those answers are
   * persisted indefinitely. Shape: `core_<section>_<concept>_v<n>`, enforced by
   * the bank validator.
   *
   * Legacy `dq*` sessions are untouched by all of this. There is no migration
   * and no regeneration; the two id spaces simply cannot collide.
   */
  id: string
  /**
   * The semantic meaning of the ANSWER, which is a different thing from the
   * identity of the question. `core_rhythm_longest_gap_v1` is the question;
   * `rhythm.longestGap` is what its answer means. A future v2 of a question can
   * carry the same answer field, and the report reader keeps working.
   */
  answerField: string
  section: ConsultationSection
  type: ConsultationQuestionType
  /** Which foundations ask this. Never empty. */
  foundations: readonly ConsultationFoundation[]
  /** Customer-facing wording (the "You" phrasing). */
  text: string
  /** Household phrasing. Required when `foundations` includes `family` and the
   *  personal wording would not fit a household. */
  familyText?: string
  /**
   * Optional neutral "why we're asking" line.
   *
   * Deliberately not present on most questions. A paid Consultation that
   * attaches a miniature health claim to every question is making fifteen
   * unreviewed claims, and the section purpose (SECTION_META) already carries
   * the explanation in the place it belongs.
   */
  supportText?: string
  familySupportText?: string
  options?: readonly ConsultationOption[]
  /** `slider` bounds. */
  min?: number
  max?: number
  minLabel?: string
  maxLabel?: string
  /** `multi` — how many selections a REQUIRED question needs. Defaults to 1. */
  minSelections?: number
  /** `textarea` — maximum characters after trimming. Required for textareas. */
  maxLength?: number
  /**
   * Required when applicable. An adaptive question with `required: true` is
   * required only in the runs where its condition holds.
   */
  required: boolean
  sensitivity: ConsultationSensitivity
  scienceReview: ConsultationScienceReview
  /** Present only on adaptive questions. */
  applicableWhen?: ConsultationApplicability

  /* ── Documentation carried as data ── */
  /** What this question is for, in one line. */
  intent: string
  /** Why the Report cannot say something useful without it. */
  whyNeeded: string
  /** Where the answer is intended to add value. Never empty. */
  reportTargets: readonly ConsultationReportTarget[]
  /**
   * How this relates to the free Food System Assessment's fifteen questions.
   *
   * `none` — the free Assessment does not touch this construct at all.
   * `deeper` — it touches the construct, and `deeperBecause` must say what NEW
   * information this collects. "Same construct, new wording" is not depth, and
   * the bank validator rejects `deeper` without a substantial explanation.
   */
  freeAssessmentOverlap: "none" | "deeper"
  /** Required when `freeAssessmentOverlap` is `deeper`. */
  deeperBecause?: string
  /** The free question ids this builds on, e.g. `["q13"]`. */
  freeAssessmentQuestionIds?: readonly string[]
}

/** A submitted answer, before validation. */
export type ConsultationAnswer = string | string[] | number

export type ConsultationAnswers = Record<string, ConsultationAnswer>

/**
 * Everything the resolver is allowed to adapt on.
 *
 * Deliberately narrow. Individual free-Assessment answers are NOT here: the
 * duplication problem they would solve is solved by design instead (every
 * question declares its overlap and is reviewed against q1–q15), and carrying
 * fifteen raw health answers through checkout to solve it would expand
 * sensitive-data transport for a benefit the review pack already delivers.
 */
export interface ConsultationContext {
  foundation: ConsultationFoundation
  /** The entitled lens, when one was purchased. */
  lens?: ConsultationLens | null
  /**
   * The Three Biotics pattern from the free Assessment, when available. Not
   * used for adaptation in v1 — carried so Phase 3B can adapt on it without a
   * contract change, and so the review pack can state plainly that v1 does not.
   */
  bioticsPattern?: {
    strongest?: "prebiotics" | "probiotics" | "postbiotics"
    priority?: "prebiotics" | "probiotics" | "postbiotics"
  } | null
}
