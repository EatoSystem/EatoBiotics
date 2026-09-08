import { readQuestionSnapshot } from "@/lib/assessment/question-snapshot"
import type { DeepQuestion } from "@/lib/deep-assessment"

import {
  readDeterministicConsultationSnapshot,
  type DeterministicConsultationSnapshot,
} from "./session-envelope"

/**
 * Which flow owns this paid session? — Phase 3C-C2B.
 *
 * ══ WHY `questions` IS THE DISCRIMINATOR ════════════════════════════════════
 *
 * Because it already is one, and because it is the only field that can be
 * claimed atomically. `deep_assessments.stripe_session_id` is UNIQUE, so a
 * conditional `UPDATE … WHERE questions IS NULL` and an `INSERT` that raises
 * 23505 between them decide a single winner without a lock, a lease or a second
 * round trip. `generate-deep-questions` has worked this way since #227.
 *
 * A dedicated `consultation_mode` column was considered and rejected. It would
 * be a SECOND statement about which flow owns the row, able to disagree with
 * the column it describes, and it would need a migration to say something the
 * data already says. Two sources of truth about ownership is the shape of the
 * bug, not the fix.
 *
 * ══ WHY THE MODE IS STICKY ══════════════════════════════════════════════════
 *
 * The two flows store different things under the same key: legacy holds a
 * generated `DeepQuestion[]`, deterministic holds a frozen snapshot object. A
 * conversion in either direction destroys the other's session — the customer's
 * answers stop matching the questions they were asked. So once either has won,
 * nothing converts it. This module only ever REPORTS the winner; it never picks
 * one.
 *
 * ══ WHY AN UNRECOGNISED VALUE IS ITS OWN ANSWER ═════════════════════════════
 *
 * `unknown` is not "probably legacy". A non-null value neither parser accepts is
 * something no writer in this repository produces, so it is either corruption or
 * a shape from a build that is not this one. Both are reasons to stop rather
 * than to guess, and guessing here means overwriting a paying customer's
 * session with the flow that guessed.
 *
 * ══ WHAT MUST NEVER DECIDE THIS ═════════════════════════════════════════════
 *
 * Not `status` — it is written by several routes for several reasons and has
 * never meant "which flow". Not the request body, not a query parameter, not
 * the tier, not the answers, not the report prose. Only the stored questions.
 */

export type ConsultationMode =
  /** A generated `DeepQuestion[]`: the legacy paid questionnaire owns this row. */
  | { kind: "legacy"; questions: DeepQuestion[] }
  /** A frozen deterministic snapshot: the Consultation owns this row. */
  | { kind: "deterministic"; snapshot: DeterministicConsultationSnapshot }
  /** Nothing stored yet. The ONLY state in which a claim may be made. */
  | { kind: "unclaimed" }
  /** Present, and neither parser recognises it. Fail closed. */
  | { kind: "unknown" }

/**
 * Classify the stored `questions` value.
 *
 * Pure and total: every input maps to exactly one of the four, and nothing here
 * reads a database, a request or an environment.
 */
export function readConsultationMode(questions: unknown): ConsultationMode {
  if (questions === null || questions === undefined) return { kind: "unclaimed" }

  // Legacy first, because it is the shape the live product writes today. Both
  // parsers are the canonical ones — this module owns the ORDER of the
  // questions, not the definition of either shape.
  const legacy = readQuestionSnapshot(questions)
  if (legacy) return { kind: "legacy", questions: legacy }

  const snapshot = readDeterministicConsultationSnapshot(questions)
  if (snapshot) return { kind: "deterministic", snapshot }

  return { kind: "unknown" }
}

/**
 * May a row in this mode be claimed by a flow that does not yet own it?
 *
 * Only `unclaimed`. Written as a function rather than left to each caller's
 * `=== "unclaimed"` so the rule has one definition: a caller that wrote the
 * comparison itself is a caller that can widen it.
 */
export function isClaimable(mode: ConsultationMode): boolean {
  return mode.kind === "unclaimed"
}
