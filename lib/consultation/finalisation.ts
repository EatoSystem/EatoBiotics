import type { AddonType } from "@/lib/addon-types"
import { isAddon } from "@/lib/addon-types"

import type {
  ConsultationAnswer,
  ConsultationAnswers,
  ConsultationContext,
  ConsultationFoundation,
} from "./types"
import { resolveConsultationBank } from "./bank-registry"
import {
  sanitiseCandidateAnswers,
  snapshotIsResolvable,
  type DeterministicConsultationSnapshot,
  type DeterministicConsultationState,
} from "./session-envelope"
import { trustedAnswersByField, validateConsultationAnswers } from "./completeness"
import { deriveFoodGuidanceConstraints, type FoodGuidanceConstraints } from "./food-guidance"
import { SCIENCE_CONTRACT_VERSION } from "./science-contract"

/**
 * What a completed deterministic Consultation is allowed to hand off.
 *
 * ══ WHAT THIS MODULE IS ═════════════════════════════════════════════════════
 *
 * The definition of the frozen record: which answers survived, under which
 * bank, under which Science Contract, with which safety constraints. Phase
 * 3C-C2 will run this immediately before persisting a handoff; Phase 4A will
 * build a Report from what it produces. Neither exists yet, and nothing calls
 * this — it is defined and proven first, on purpose, because a payload argued
 * about after a route is written is a payload the route has already shaped.
 *
 * ══ WHAT IT IS NOT ══════════════════════════════════════════════════════════
 *
 * Not a Report, and not a step towards writing one here. There is no
 * interpretation, no recommendation, no summary, no prose, no priority, no
 * causal claim and no inferred biology anywhere below. Combining trusted
 * answers does not create a biomarker: `AGGREGATION_EVIDENCE_RULE` in the
 * Science Contract says so, and this module is where that would most tempting
 * to forget, because everything needed to invent one is finally in one place.
 *
 * It also writes nothing. No database client, no payment provider, no HTTP
 * framework, no model vendor — the imports above are the whole dependency
 * surface, and they are all canonical Consultation modules.
 *
 * ══ WHY IT DERIVES RATHER THAN ACCEPTS ══════════════════════════════════════
 *
 * The builder takes the stored snapshot and the stored state, and derives
 * everything else. It does NOT accept trusted answers, a context, a bank or a
 * completeness verdict from its caller. A route that could pass those in could
 * claim trust rather than establish it, and the whole value of this payload is
 * that every field in it was computed from the customer's own stored answers by
 * the same canonical functions that decided what to ask them.
 */

/* ══ Versions ══════════════════════════════════════════════════════════════ */

export const FINALISATION_KIND = "deterministic-consultation-finalisation" as const
export const FINALISATION_SCHEMA_VERSION = 1 as const

/**
 * The finalisation CONTRACT version — the shape and meaning of this payload.
 *
 * Deliberately separate from the bank version and from the Science Contract
 * version, because the three move independently: a question can be revised
 * without the contract changing, the contract can be re-adjudicated without a
 * question changing, and this payload's shape can change without either. All
 * three therefore travel in every finalisation, so a stored record says exactly
 * what it was frozen under.
 */
export const CONSULTATION_FINALISATION_VERSION = "consultation-finalisation-v1" as const

/* ══ The payload ═══════════════════════════════════════════════════════════ */

export interface ConsultationFinalisation {
  readonly kind: typeof FINALISATION_KIND
  readonly schemaVersion: typeof FINALISATION_SCHEMA_VERSION
  readonly finalisationVersion: typeof CONSULTATION_FINALISATION_VERSION

  /** Which questions these answers were given against. */
  readonly bankVersion: string
  /** And proof that bank has not drifted since. */
  readonly bankFingerprint: string
  /** Which adjudicated Science Contract governs what may be inferred. */
  readonly scienceContractVersion: typeof SCIENCE_CONTRACT_VERSION

  readonly foundation: ConsultationFoundation
  readonly entitledLens: AddonType | null

  /**
   * What the trusted projection considered applicable at this moment, in bank
   * order. Provenance: it records which questions were live, so a later reader
   * can tell "not asked" from "asked and unanswered".
   */
  readonly applicableQuestionIds: readonly string[]

  /** The ONLY answers anything downstream may read, keyed by question id. */
  readonly trustedAnswers: ConsultationAnswers
  /**
   * The same answers keyed by semantic field — `rhythm.longestGap` rather than
   * `core_rhythm_longest_gap_v1`.
   *
   * Both are kept. The field map is what a Report should read, because it
   * survives a question being revised to v2; the id map is what an audit needs,
   * because it says which exact question produced the value.
   */
  readonly trustedAnswersByField: Readonly<Record<string, ConsultationAnswer>>

  /** Applicable, optional, unanswered and deliberately passed. Provenance only. */
  readonly skippedOptionalQuestionIds: readonly string[]

  /** The frozen food-safety state, derived — never inferred by a model. */
  readonly foodGuidance: FoodGuidanceConstraints

  readonly finalisedAt: string
}

/* ══ Outcome ═══════════════════════════════════════════════════════════════ */

export type FinalisationRefusalReason =
  /** The snapshot names a bank this build does not hold. */
  | "bank-unavailable"
  /** We hold the bank, but it has drifted from the fingerprint stored with it. */
  | "bank-mismatch"
  /** The customer has not reached Review. */
  | "not-in-review"
  /** In Review, but editing one answer — a Consultation mid-correction. */
  | "review-edit-active"
  /** Canonical completeness says something is outstanding. */
  | "incomplete"

export type FinalisationResult =
  | { ok: true; finalisation: ConsultationFinalisation }
  | {
      ok: false
      reason: FinalisationRefusalReason
      /** Where to send the customer back to, when the reason is incompleteness. */
      firstQuestionId?: string | null
      missingQuestionIds?: readonly string[]
      invalidQuestionIds?: readonly string[]
    }

export interface FinalisationInput {
  /** The stored session identity. The ONLY source of foundation and lens. */
  snapshot: DeterministicConsultationSnapshot
  /** The stored answer state, as persisted. */
  state: DeterministicConsultationState
  /**
   * Server time, injected.
   *
   * A browser clock is not evidence of when anything happened, and this value
   * ends up in a frozen record. Phase 3C-C2's route supplies it; tests supply a
   * fixed one so an identical input produces an identical payload.
   */
  finalisedAt: Date
}

/**
 * Prepare the finalisation payload, or say why it cannot be prepared.
 *
 * ══ REFUSALS ARE VALUES, NOT EXCEPTIONS ═════════════════════════════════════
 *
 * An unfinished Consultation is the ordinary state of a Consultation. Throwing
 * for it would make "not finished yet" and "something is broken" the same
 * event, and the caller would have to tell them apart from a stack trace.
 *
 * ══ THE PRECONDITIONS ═══════════════════════════════════════════════════════
 *
 * `phase === "review"` with a NULL cursor. Both halves matter: the pair
 * (review, questionId) means the customer is editing one answer, and freezing
 * a record mid-correction would capture a value they are in the middle of
 * changing.
 */
export function prepareConsultationFinalisation(input: FinalisationInput): FinalisationResult {
  const { snapshot, state } = input

  const bank = resolveConsultationBank(snapshot.bankVersion)
  if (!bank) return { ok: false, reason: "bank-unavailable" }
  // Held, but drifted. Answers given against a different set of questions are
  // not answers to these ones, and adopting today's bank would silently
  // reinterpret them.
  if (!snapshotIsResolvable(snapshot)) return { ok: false, reason: "bank-mismatch" }

  if (state.phase !== "review") return { ok: false, reason: "not-in-review" }
  if (state.currentQuestionId !== null) return { ok: false, reason: "review-edit-active" }

  // The context comes from the SNAPSHOT, which was written from the settled
  // payment. There is deliberately no way for a caller to supply one.
  const context: ConsultationContext = {
    foundation: snapshot.foundation,
    lens: snapshot.entitledLens,
  }

  // Unknown ids and invalid values drop here; valid-but-inapplicable answers
  // survive into `answers` and are excluded by the projection below, exactly as
  // they are everywhere else.
  const { answers } = sanitiseCandidateAnswers(state.candidateAnswers, snapshot.bankVersion)
  const completenessInput = { questions: bank, context, answers }

  /*
   * The final gate, re-run here.
   *
   * Not Review's earlier verdict, not the client's, not the review route's.
   * Each of those was true when it was computed, and a concurrent edit is
   * exactly the case where an earlier verdict is still true and no longer
   * correct. Phase 3C-C2 runs this same function immediately before it writes.
   */
  const completeness = validateConsultationAnswers(completenessInput)
  if (!completeness.complete) {
    const firstQuestionId =
      completeness.applicableQuestionIds.find(
        (id) =>
          completeness.missingQuestionIds.includes(id) ||
          completeness.invalidQuestionIds.includes(id),
      ) ?? null
    return {
      ok: false,
      reason: "incomplete",
      firstQuestionId,
      missingQuestionIds: completeness.missingQuestionIds,
      invalidQuestionIds: completeness.invalidQuestionIds,
    }
  }

  /*
   * Skips, filtered rather than copied.
   *
   * A stored skip marker can outlive the question it describes — the customer
   * skipped an optional branch, then changed a parent and closed it. Copying
   * the array would freeze a statement about a question that was not asked at
   * finalisation. Only markers that are applicable, optional and still
   * unanswered survive, in bank order so the output is stable.
   */
  const stored = new Set(state.skippedOptionalQuestionIds)
  const applicable = new Set(completeness.applicableQuestionIds)
  const skippedOptionalQuestionIds = bank
    .filter(
      (q) =>
        stored.has(q.id) &&
        applicable.has(q.id) &&
        !q.required &&
        completeness.trustedAnswers[q.id] === undefined,
    )
    .map((q) => q.id)

  return {
    ok: true,
    finalisation: {
      kind: FINALISATION_KIND,
      schemaVersion: FINALISATION_SCHEMA_VERSION,
      finalisationVersion: CONSULTATION_FINALISATION_VERSION,

      bankVersion: snapshot.bankVersion,
      bankFingerprint: snapshot.bankFingerprint,
      scienceContractVersion: SCIENCE_CONTRACT_VERSION,

      foundation: snapshot.foundation,
      entitledLens: snapshot.entitledLens,

      applicableQuestionIds: completeness.applicableQuestionIds,

      // Exactly the projection's output. No candidate answer reaches this by
      // any other route, so a closed branch cannot arrive through the back door.
      trustedAnswers: completeness.trustedAnswers,
      trustedAnswersByField: trustedAnswersByField(completenessInput),

      skippedOptionalQuestionIds,

      // Derived from the same trusted input, by the canonical helper. No model
      // reinterprets a missing avoidance detail, and `unresolvedSpecificAvoidance`
      // continues to mean ONLY "we do not have enough specific information" —
      // never severity, risk or likelihood.
      foodGuidance: deriveFoodGuidanceConstraints(completenessInput),

      finalisedAt: input.finalisedAt.toISOString(),
    },
  }
}

/* ══ Reading one back ══════════════════════════════════════════════════════ */

/**
 * Why a stored finalisation could not be trusted.
 *
 * Separate from `FinalisationRefusalReason` because they answer different
 * questions. That one says why a Consultation cannot be finalised YET, and the
 * customer can act on most of it. This one says the sealed record we hold does
 * not describe the session it is attached to — nothing the customer did causes
 * it, and nothing they can do fixes it.
 */
export type StoredFinalisationRefusal =
  /** Not a recognisable finalisation envelope at all. */
  | "malformed"
  /** Recognisable, but written by a build whose contract we do not implement. */
  | "unsupported-version"
  /** Well-formed, but describes a different session than the one it sits on. */
  | "identity-mismatch"

export type StoredFinalisationResult =
  | { ok: true; finalisation: ConsultationFinalisation }
  | { ok: false; reason: StoredFinalisationRefusal }

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(isNonEmptyString)

/** One stored answer, in the shape the canonical answer union allows. */
const isAnswer = (v: unknown): v is ConsultationAnswer =>
  typeof v === "string" ||
  typeof v === "number" ||
  (Array.isArray(v) && v.every((x) => typeof x === "string"))

const isAnswerMap = (v: unknown): v is ConsultationAnswers =>
  isPlainObject(v) && Object.values(v).every(isAnswer)

/** An ISO instant that round-trips. A string that merely looks like one is not. */
const isInstant = (v: unknown): v is string =>
  typeof v === "string" && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString() === v

function isFoodGuidance(v: unknown): v is FoodGuidanceConstraints {
  if (!isPlainObject(v)) return false
  return (
    isStringArray(v.declaredConstraints) &&
    isStringArray(v.safetyConstraints) &&
    isStringArray(v.practicalConstraints) &&
    isStringArray(v.knownAvoidances) &&
    typeof v.declaresNoConstraints === "boolean" &&
    typeof v.constraintsUndisclosed === "boolean" &&
    typeof v.requiresSpecificAvoidance === "boolean" &&
    typeof v.unresolvedSpecificAvoidance === "boolean"
  )
}

/**
 * Read a finalisation back out of storage — fail-closed, never coerced.
 *
 * ══ WHY THIS CANNOT BE A CAST ═══════════════════════════════════════════════
 *
 * `value as ConsultationFinalisation` would make every field below a promise
 * rather than a fact, and the promise would be kept by whatever happened to be
 * in a jsonb column. This record is the thing a Report will eventually be built
 * from; a missing `foodGuidance` read as `undefined` is a Report written with no
 * knowledge of an allergy.
 *
 * ══ WHY A MALFORMED SEAL IS NOT A REASON TO MAKE A NEW ONE ══════════════════
 *
 * The tempting repair — "we cannot read it, so rebuild it from the current
 * answers" — silently replaces a record of what the customer finished with a
 * record of whatever their session says today, under today's bank. The whole
 * point of sealing was that those can differ. So this refuses, and the caller
 * refuses with it.
 *
 * ══ IDENTITY, NOT CONTENT ═══════════════════════════════════════════════════
 *
 * `snapshot` is optional and checks only the four immutable facts a
 * finalisation shares with the session it belongs to: foundation, entitled
 * lens, bank version and bank fingerprint. Disagreement means the payload was
 * written for a different session — not that it is out of date. A finalisation
 * whose bank has since been revised is still the authority for its own handoff,
 * and is deliberately NOT recomputed.
 */
export function readConsultationFinalisation(
  value: unknown,
  snapshot?: Pick<
    DeterministicConsultationSnapshot,
    "foundation" | "entitledLens" | "bankVersion" | "bankFingerprint"
  >,
): StoredFinalisationResult {
  if (!isPlainObject(value)) return { ok: false, reason: "malformed" }
  if (value.kind !== FINALISATION_KIND) return { ok: false, reason: "malformed" }

  // Version before shape: a payload from a future contract is not malformed,
  // and calling it that would send whoever debugs it looking for corruption.
  if (
    value.schemaVersion !== FINALISATION_SCHEMA_VERSION ||
    value.finalisationVersion !== CONSULTATION_FINALISATION_VERSION
  ) {
    return { ok: false, reason: "unsupported-version" }
  }

  if (!isNonEmptyString(value.bankVersion)) return { ok: false, reason: "malformed" }
  if (!isNonEmptyString(value.bankFingerprint)) return { ok: false, reason: "malformed" }
  if (value.scienceContractVersion !== SCIENCE_CONTRACT_VERSION) {
    return { ok: false, reason: "unsupported-version" }
  }

  if (value.foundation !== "you" && value.foundation !== "family") {
    return { ok: false, reason: "malformed" }
  }
  // A lens the build does not recognise is REFUSED rather than narrowed to
  // `null`: those mean opposite things, and the second would quietly serve a
  // lens-less handoff for someone who paid for a lens.
  const entitledLens = value.entitledLens
  if (entitledLens !== null && !isAddon(entitledLens)) return { ok: false, reason: "malformed" }

  if (!isStringArray(value.applicableQuestionIds)) return { ok: false, reason: "malformed" }
  if (!isAnswerMap(value.trustedAnswers)) return { ok: false, reason: "malformed" }
  if (!isAnswerMap(value.trustedAnswersByField)) return { ok: false, reason: "malformed" }
  if (!isStringArray(value.skippedOptionalQuestionIds)) return { ok: false, reason: "malformed" }
  if (!isFoodGuidance(value.foodGuidance)) return { ok: false, reason: "malformed" }
  if (!isInstant(value.finalisedAt)) return { ok: false, reason: "malformed" }

  if (snapshot) {
    if (
      value.foundation !== snapshot.foundation ||
      entitledLens !== snapshot.entitledLens ||
      value.bankVersion !== snapshot.bankVersion ||
      value.bankFingerprint !== snapshot.bankFingerprint
    ) {
      return { ok: false, reason: "identity-mismatch" }
    }
  }

  return {
    ok: true,
    finalisation: {
      kind: FINALISATION_KIND,
      schemaVersion: FINALISATION_SCHEMA_VERSION,
      finalisationVersion: CONSULTATION_FINALISATION_VERSION,
      bankVersion: value.bankVersion,
      bankFingerprint: value.bankFingerprint,
      scienceContractVersion: SCIENCE_CONTRACT_VERSION,
      foundation: value.foundation,
      entitledLens,
      applicableQuestionIds: value.applicableQuestionIds,
      trustedAnswers: value.trustedAnswers,
      trustedAnswersByField: value.trustedAnswersByField,
      skippedOptionalQuestionIds: value.skippedOptionalQuestionIds,
      foodGuidance: value.foodGuidance,
      finalisedAt: value.finalisedAt,
    },
  }
}
