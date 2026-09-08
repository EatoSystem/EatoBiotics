import type { DeterministicConsultationState } from "./session-envelope"

/**
 * Is this Consultation sealed? — Phase 3C-C2A.
 *
 * ══ WHY THIS IS ONE FUNCTION AND NOT THREE CHECKS ═══════════════════════════
 *
 * Three routes need the answer and each would answer it differently if left to
 * itself: the finalise route cares about reusing a seal, the progress and
 * review routes care about refusing to write through one. Written separately,
 * the first divergence would be a mutation route that accepted a state the
 * finalise route considers sealed — and the write it let through would land on
 * a Consultation that had already been frozen and handed off.
 *
 * So "sealed" is defined once, from the row and the parsed state together, and
 * each caller maps the same three outcomes onto its own behaviour.
 *
 * ══ WHY "INCOHERENT" IS ITS OWN OUTCOME ═════════════════════════════════════
 *
 * A half-seal is not a maybe. Migration 48's CHECK constraints make it
 * unstorable, so seeing one means either the migration is not applied or
 * something wrote outside every route that knows these rules. Neither is a
 * situation to guess through: it is not "unsealed" (a write would trample real
 * evidence of a handoff) and not "sealed" (there may be nothing to hand back).
 * Callers refuse, and nobody repairs it automatically.
 */

/** The two Migration 48 columns, as they come back from PostgREST. */
export interface ConsultationSealColumns {
  consultation_finalisation?: unknown
  consultation_handoff_id?: unknown
}

export type ConsultationSeal =
  /** Ordinary: nothing has been sealed, and the state does not claim otherwise. */
  | { status: "unsealed" }
  /** Complete and self-consistent. `finalisation` is still UNVALIDATED jsonb. */
  | { status: "sealed"; handoffId: string; finalisation: unknown }
  /** Contradictory. Never repaired, never written through. */
  | { status: "incoherent"; detail: string }

/**
 * Read the seal from a row and its parsed deterministic state.
 *
 * `state` is the already-parsed envelope rather than raw jsonb, because the
 * phase and cursor are half of what makes a seal coherent and re-parsing them
 * here would be a second reader of the same bytes.
 */
export function readConsultationSeal(
  row: ConsultationSealColumns,
  state: Pick<DeterministicConsultationState, "phase" | "currentQuestionId">,
): ConsultationSeal {
  const finalisation = row.consultation_finalisation
  const hasFinalisation = finalisation !== null && finalisation !== undefined
  const rawHandoff = row.consultation_handoff_id
  const handoffId = typeof rawHandoff === "string" && rawHandoff.trim().length > 0 ? rawHandoff : null
  const isReady = state.phase === "ready-for-report"

  if (!hasFinalisation && handoffId === null && !isReady) return { status: "unsealed" }

  // A handoff column holding something that is not a usable id — a number, an
  // empty string, an object — is reported as a contradiction rather than
  // silently read as "no handoff", which would let a mutation through.
  if (rawHandoff !== null && rawHandoff !== undefined && handoffId === null) {
    return { status: "incoherent", detail: "handoff-not-a-string" }
  }

  if (!hasFinalisation || handoffId === null || !isReady) {
    return {
      status: "incoherent",
      detail: `finalisation=${hasFinalisation} handoff=${handoffId !== null} ready=${isReady}`,
    }
  }

  // Sealed but pointing at a question: the pair (ready, questionId) describes a
  // finished Consultation that is also mid-edit, which is not a state any
  // correct write produces.
  if (state.currentQuestionId !== null) {
    return { status: "incoherent", detail: "sealed-with-open-cursor" }
  }

  return { status: "sealed", handoffId, finalisation }
}
