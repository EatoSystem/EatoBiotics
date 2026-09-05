import type { AddonType } from "@/lib/addon-types"
import { asAddonType } from "@/lib/addon-types"

import type { ConsultationAnswer, ConsultationAnswers, ConsultationFoundation } from "./types"
import { bankMatches, CURRENT_CONSULTATION_BANK, fingerprintFor, resolveConsultationBank } from "./bank-registry"
import { validateAnswer } from "./validation"

/**
 * What a deterministic Consultation stores, and how it is told apart from a
 * legacy one — Phase 3C-A.
 *
 * ══ THE DISCRIMINATOR IS THE JSON SHAPE ITSELF ══════════════════════════════
 *
 * `deep_assessments.questions` holds the legacy generated question set — an
 * ARRAY. A deterministic session stores an OBJECT here instead. That single
 * structural difference is the discriminator, and it needs no migration and no
 * new column because every existing reader already refuses a non-array:
 *
 *   - `readQuestionSnapshot` opens with `if (!Array.isArray(persisted)) return null`,
 *     so the legacy save route answers 409 rather than storing against it;
 *   - `resolveTrustedQuestions` narrows with `Array.isArray(persisted) ? … : []`,
 *     so submit resolves no core questions and returns `no_question_set`;
 *   - `generate-deep-questions` goes further: seeing a non-null value it cannot
 *     characterise, it REFUSES rather than overwriting — "overwriting a value we
 *     cannot characterise is the one thing the CAS exists to forbid".
 *
 * So the legacy stack cannot read a deterministic session, cannot write to one,
 * and cannot destroy one. `tests/unit/consultation-persistence-contract.test.ts`
 * pins all of that against the real modules rather than against this comment.
 *
 * The reverse direction is equally structural: a legacy array can never satisfy
 * `readDeterministicConsultationSnapshot`, which requires an object carrying a
 * literal `kind`. A guard asserts this module names no legacy type at all.
 *
 * ══ WHAT LIVES HERE, AND WHAT DOES NOT ══════════════════════════════════════
 *
 * This envelope is the IMMUTABLE identity of the session: which bank, which
 * foundation, which lens. It carries no answers and no cursor — those move on
 * every keystroke and belong in the state envelope, stored separately in
 * `answers`. Mixing them would mean rewriting the session's identity every time
 * a customer picks an option, which is how identity fields drift.
 */

export const DETERMINISTIC_SNAPSHOT_KIND = "deterministic-consultation" as const
export const DETERMINISTIC_SNAPSHOT_SCHEMA_VERSION = 1 as const

export interface DeterministicConsultationSnapshot {
  readonly kind: typeof DETERMINISTIC_SNAPSHOT_KIND
  readonly schemaVersion: typeof DETERMINISTIC_SNAPSHOT_SCHEMA_VERSION
  readonly bankVersion: string
  readonly bankFingerprint: string
  readonly foundation: ConsultationFoundation
  readonly entitledLens: AddonType | null
  readonly createdAt: string
}

function isFoundation(value: unknown): value is ConsultationFoundation {
  return value === "you" || value === "family"
}

/**
 * Parse a stored `questions` value as a deterministic snapshot, or refuse.
 *
 * Strict and non-coercive. Nothing is defaulted, nothing is repaired: a session
 * whose identity we cannot read exactly is a session we must not answer
 * questions against. `null` is the only failure mode, and every caller treats it
 * as "not a deterministic session" rather than "an empty one".
 *
 * Note what is NOT checked here: whether the fingerprint still matches TODAY's
 * bank. That is a separate question — this says "the stored shape is a
 * well-formed deterministic snapshot", and `snapshotIsResolvable` says "and we
 * still hold the bank it names". Collapsing them would make a bank edit look
 * like data corruption.
 */
export function readDeterministicConsultationSnapshot(
  persisted: unknown,
): DeterministicConsultationSnapshot | null {
  if (!persisted || typeof persisted !== "object" || Array.isArray(persisted)) return null
  const v = persisted as Record<string, unknown>

  if (v.kind !== DETERMINISTIC_SNAPSHOT_KIND) return null
  if (v.schemaVersion !== DETERMINISTIC_SNAPSHOT_SCHEMA_VERSION) return null
  if (typeof v.bankVersion !== "string" || v.bankVersion.length === 0) return null
  if (typeof v.bankFingerprint !== "string" || v.bankFingerprint.length === 0) return null
  if (!isFoundation(v.foundation)) return null
  if (typeof v.createdAt !== "string" || v.createdAt.length === 0) return null

  // An unrecognised lens becomes a refusal, not `null`. `null` is a real value
  // here — "no lens was purchased" — so coercing an unknown string to it would
  // silently downgrade an entitlement.
  let entitledLens: AddonType | null
  if (v.entitledLens === null) entitledLens = null
  else {
    const narrowed = asAddonType(v.entitledLens)
    if (narrowed === null) return null
    entitledLens = narrowed
  }

  return {
    kind: DETERMINISTIC_SNAPSHOT_KIND,
    schemaVersion: DETERMINISTIC_SNAPSHOT_SCHEMA_VERSION,
    bankVersion: v.bankVersion,
    bankFingerprint: v.bankFingerprint,
    foundation: v.foundation,
    entitledLens,
    createdAt: v.createdAt,
  }
}

/** True when this build still holds the exact bank the snapshot names. */
export function snapshotIsResolvable(snapshot: DeterministicConsultationSnapshot): boolean {
  return bankMatches(snapshot.bankVersion, snapshot.bankFingerprint)
}

/** Build the snapshot for a NEW deterministic session. */
export function createDeterministicConsultationSnapshot(input: {
  foundation: ConsultationFoundation
  entitledLens: AddonType | null
  bankVersion?: string
  now?: Date
}): DeterministicConsultationSnapshot {
  const bankVersion = input.bankVersion ?? CURRENT_CONSULTATION_BANK
  const bankFingerprint = fingerprintFor(bankVersion)
  if (!bankFingerprint) {
    throw new Error(`cannot open a Consultation against unknown bank "${bankVersion}"`)
  }
  return {
    kind: DETERMINISTIC_SNAPSHOT_KIND,
    schemaVersion: DETERMINISTIC_SNAPSHOT_SCHEMA_VERSION,
    bankVersion,
    bankFingerprint,
    foundation: input.foundation,
    entitledLens: input.entitledLens,
    createdAt: (input.now ?? new Date()).toISOString(),
  }
}

/* ══ Answer state ══════════════════════════════════════════════════════════ */

export const DETERMINISTIC_STATE_KIND = "deterministic-consultation-state" as const
export const DETERMINISTIC_STATE_SCHEMA_VERSION = 1 as const

/**
 * How far the Consultation has got.
 *
 * `ready-for-report` is typed but never SET in Phase 3C-A: finalisation is
 * Phase 3C-B's, and the Report engine is Phase 4A's. It exists here so the
 * parser's accepted set is fixed now rather than widened later by a route that
 * happens to need it.
 */
export type ConsultationPhase = "questions" | "review" | "ready-for-report"

const PHASES: readonly ConsultationPhase[] = ["questions", "review", "ready-for-report"]

export interface DeterministicConsultationState {
  readonly kind: typeof DETERMINISTIC_STATE_KIND
  readonly schemaVersion: typeof DETERMINISTIC_STATE_SCHEMA_VERSION
  /**
   * Everything the customer has entered, including answers to branches that
   * have since closed. Candidates, never conclusions — `projectTrustedAnswers`
   * decides what counts, and §13 of the phase spec requires that a valid answer
   * is NOT destroyed merely because its branch stopped applying.
   */
  readonly candidateAnswers: ConsultationAnswers
  /** Questions the customer has actually interacted with (see the slider rule). */
  readonly touchedQuestionIds: readonly string[]
  /** Optional questions the customer deliberately moved past without answering. */
  readonly skippedOptionalQuestionIds: readonly string[]
  /** A question id — never an index. The applicable sequence changes length. */
  readonly currentQuestionId: string | null
  readonly phase: ConsultationPhase
}

export const EMPTY_DETERMINISTIC_STATE: DeterministicConsultationState = {
  kind: DETERMINISTIC_STATE_KIND,
  schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
  candidateAnswers: {},
  touchedQuestionIds: [],
  skippedOptionalQuestionIds: [],
  currentQuestionId: null,
  phase: "questions",
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((v): v is string => typeof v === "string" && v.length > 0))]
}

/**
 * Parse a stored `answers` value as deterministic state, or refuse.
 *
 * A legacy flat answer map — `{ dq1: "…", dq2: 3 }` — has no `kind`, so it can
 * never parse here. That is the second half of the discriminator: the legacy
 * ANSWER shape and the deterministic ANSWER shape are as structurally distinct
 * as the two question shapes, and neither side can be mistaken for the other.
 *
 * Returns `null` rather than an empty state on malformed input, so a caller
 * cannot confuse "this session has no answers yet" with "this session's answers
 * are unreadable".
 */
export function readDeterministicConsultationState(
  persisted: unknown,
): DeterministicConsultationState | null {
  if (!persisted || typeof persisted !== "object" || Array.isArray(persisted)) return null
  const v = persisted as Record<string, unknown>

  if (v.kind !== DETERMINISTIC_STATE_KIND) return null
  if (v.schemaVersion !== DETERMINISTIC_STATE_SCHEMA_VERSION) return null

  const rawAnswers =
    v.candidateAnswers && typeof v.candidateAnswers === "object" && !Array.isArray(v.candidateAnswers)
      ? (v.candidateAnswers as Record<string, unknown>)
      : {}

  const phase = PHASES.includes(v.phase as ConsultationPhase)
    ? (v.phase as ConsultationPhase)
    : "questions"

  return {
    kind: DETERMINISTIC_STATE_KIND,
    schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
    // Values are shape-checked against the bank by `sanitiseCandidateAnswers`,
    // not here: this parser only establishes that the ENVELOPE is ours.
    candidateAnswers: rawAnswers as ConsultationAnswers,
    touchedQuestionIds: stringArray(v.touchedQuestionIds),
    skippedOptionalQuestionIds: stringArray(v.skippedOptionalQuestionIds),
    currentQuestionId: typeof v.currentQuestionId === "string" ? v.currentQuestionId : null,
    phase,
  }
}

/* ══ Candidate sanitisation ════════════════════════════════════════════════ */

export interface SanitisedCandidates {
  answers: ConsultationAnswers
  /** Ids that were stored but are not in the bank at all. */
  droppedUnknownIds: readonly string[]
  /** Ids in the bank whose stored value does not validate. */
  droppedInvalidIds: readonly string[]
}

/**
 * Keep only answers that are individually legitimate.
 *
 * Three outcomes, and the third is the point:
 *
 *   unknown question id  → dropped. Nothing can render or read it.
 *   invalid value        → dropped. It would fail the projection anyway, and
 *                          storing it lets a malformed value survive a round
 *                          trip looking like data.
 *   valid but currently
 *   INAPPLICABLE         → KEPT.
 *
 * That last case is the Phase 3B rule carried into storage (§13): a customer
 * who answers the allergy follow-up, goes back and removes the allergy has not
 * un-said the follow-up. The answer stops counting — `projectTrustedAnswers`
 * excludes it, because applicability is resolved fresh — but it is still theirs,
 * and if they re-open the branch it is still there. Deleting it here would be a
 * second, destructive rule about what an answer is worth, running in a place the
 * server cannot verify.
 */
export function sanitiseCandidateAnswers(
  raw: unknown,
  bankVersion: string,
): SanitisedCandidates {
  const bank = resolveConsultationBank(bankVersion)
  const empty: SanitisedCandidates = { answers: {}, droppedUnknownIds: [], droppedInvalidIds: [] }
  if (!bank) return empty
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return empty

  const byId = new Map(bank.map((q) => [q.id, q]))
  const answers: ConsultationAnswers = {}
  const droppedUnknownIds: string[] = []
  const droppedInvalidIds: string[] = []

  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const question = byId.get(id)
    if (!question) {
      droppedUnknownIds.push(id)
      continue
    }
    const result = validateAnswer(question, value)
    if (result.status === "valid") {
      answers[id] = result.value as ConsultationAnswer
      continue
    }
    // `missing` is not a stored answer at all; only a present-but-wrong value
    // is worth reporting as dropped.
    if (result.status === "invalid") droppedInvalidIds.push(id)
  }

  return { answers, droppedUnknownIds, droppedInvalidIds }
}
