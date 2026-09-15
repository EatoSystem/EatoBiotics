/**
 * Composing a Report for the first time — Phase 4A-S4, current path.
 *
 * ══ WHY THIS ONE MAY USE THE LIVE MODULES ═══════════════════════════════════
 *
 * Because it is the build doing the composing. A Report produced now is
 * produced by today's composer, today's content pack and today's permission
 * registry, and it must be refused outright if today's build cannot understand
 * the seal it was asked to read. That is the opposite of the historical path's
 * job, which is why they are different files rather than two branches in one.
 *
 * ══ WHAT IT WILL NOT DO ═════════════════════════════════════════════════════
 *
 * It does not seal. It does not write to `deep_assessments`. It does not
 * reinterpret an old contract, widen a refusal into a default, or persist
 * anything it could not read back — the self-check runs the frozen decoder and
 * the frozen binding before the INSERT, so a Report that could be written but
 * never read is refused while it is still cheap.
 */

import { composePersonalFoodSystemReport } from "@/lib/report/deterministic/compose"
import { serialiseReport } from "@/lib/report/deterministic/serialise"
import { readConsultationFinalisation } from "@/lib/consultation/finalisation"
import { readConsultationSeal } from "@/lib/consultation/seal"
import {
  readDeterministicConsultationSnapshot,
  readDeterministicStateSlot,
} from "@/lib/consultation/session-envelope"

import { reportDigest } from "../digest"
import { refuse, type EnsureReportResult } from "../outcomes"
import {
  readPersistedReport,
  resolveHistoricalSeal,
  type AssessmentRowForHistory,
  type PersistedReportRow,
} from "./historical-read"

export interface ComposedReport {
  readonly canonicalText: string
  readonly digest: string
  readonly handoffId: string
}

export type ComposeResult =
  | { ok: true; composed: ComposedReport }
  | { ok: false; result: EnsureReportResult }

/**
 * Compose, then prove the result is readable before anyone offers to store it.
 */
export function composeForFirstGeneration(row: AssessmentRowForHistory): ComposeResult {
  const snapshot = readDeterministicConsultationSnapshot(row.questions)
  if (!snapshot) return { ok: false, result: refuse("mode-conflict", "not a deterministic snapshot") }

  const slot = readDeterministicStateSlot(row.answers)
  if (slot.status === "unreadable") {
    return { ok: false, result: refuse("state-unreadable", "answers") }
  }

  const seal = readConsultationSeal(
    {
      consultation_finalisation: row.consultation_finalisation,
      consultation_handoff_id: row.consultation_handoff_id,
    },
    slot.state,
  )
  if (seal.status === "incoherent") {
    return { ok: false, result: refuse("seal-incoherent", seal.detail) }
  }
  if (seal.status === "unsealed") {
    // S4 never seals. An unfinished Consultation is finished by the finalise
    // route, by the customer, or not at all.
    return { ok: false, result: refuse("not-finalised", "no seal on this Consultation") }
  }

  const persisted = readConsultationFinalisation(seal.finalisation, snapshot)
  if (!persisted.ok) {
    if (persisted.reason === "unsupported-version") {
      /*
       * A valid seal this build is not the producer for. Distinct from the
       * composer's bank refusals on purpose: the seal is fine, the Consultation
       * is fine, and this build simply cannot be the one that writes its
       * Report. Nothing is reinterpreted and nothing is re-sealed.
       */
      return {
        ok: false,
        result: refuse("generation-version-unsupported", "the seal names a contract this build does not implement"),
      }
    }
    if (persisted.reason === "identity-mismatch") {
      return { ok: false, result: refuse("generation-identity-mismatch", "seal belongs to another session") }
    }
    return { ok: false, result: refuse("seal-incoherent", persisted.reason) }
  }

  const composed = composePersonalFoodSystemReport({
    finalisation: persisted.finalisation,
    handoffId: seal.handoffId,
  })
  if (!composed.ok) {
    // Relayed verbatim. Every one of these is a decision the Core already made,
    // and softening any of them here would be this module overruling it.
    return { ok: false, result: refuse(composed.reason, composed.detail) }
  }

  const canonicalText = serialiseReport(composed.report)
  const digest = reportDigest(canonicalText)

  /* ── The rehearsal, before anything is offered to the database ───────── */
  /*
   * ══ WHAT CAN BE WRITTEN IS WHAT CAN LATER BE READ ══════════════════════
   *
   * An earlier version of this decoded the composed Report and compared the
   * handoff, which is most of the check and therefore the dangerous amount. A
   * future producer regression could have satisfied it and still emitted a
   * document the historical reader refuses — a bankVersion that disagrees with
   * the seal, a capability flag no producer identity claims — and the row would
   * have been INSERTed into a table where nothing can ever correct it. The
   * post-insert re-read would then report an immutable Report as unreadable,
   * which is the worst outcome this phase can produce.
   *
   * So the candidate is put through `readPersistedReport`, the EXACT function
   * every future read uses, against a row built exactly as the INSERT will
   * build it. Not a copy of its checks: copies drift, and a drifting copy of
   * this particular check would be invisible until the day it mattered.
   */
  const frozenSeal = resolveHistoricalSeal(row)
  if (!frozenSeal.ok) return { ok: false, result: frozenSeal.result }
  if (frozenSeal.context.handoffId !== seal.handoffId) {
    return { ok: false, result: refuse("self-check-failed", "handoff disagreement between readers") }
  }

  const candidate: PersistedReportRow = {
    consultation_handoff_id: seal.handoffId,
    assessment_id: row.id,
    canonical_report: canonicalText,
    canonical_report_sha256: digest,
  }

  const rehearsal = readPersistedReport({ row, reportRow: candidate, seal: frozenSeal.context })
  if (!rehearsal.ok) {
    // Whatever a future read would have said about this document, said now,
    // while refusing still costs nothing.
    return {
      ok: false,
      result: refuse("self-check-failed", `${rehearsal.reason}: ${rehearsal.detail}`),
    }
  }

  return { ok: true, composed: { canonicalText, digest, handoffId: seal.handoffId } }
}
