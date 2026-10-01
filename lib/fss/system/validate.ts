import { isLegacyUnversioned, type ScoreProvenance } from "@/lib/fss/engine/provenance"
import { ACTION_SET_VERSION } from "@/lib/fss/action/types"
import { ACTION_CATALOGUE } from "@/lib/fss/action/catalogue"
import type {
  StoredAction,
  StoredAssessment,
  StoredFoodSystem,
  StoredPlanDecision,
  StoredPriorityDecision,
  StoredScore,
} from "@/lib/fss/persistence/repository"
import { isCurrentSystemModel } from "./version"

/* ════════════════════════════════════════════════════════════════════════
   VALIDATING A CURRENT FOOD SYSTEM, AND FAILING CLOSED.

   ══ WHY THIS EXISTS AT ALL ══════════════════════════════════════════════════

   `localStorage` has no transactions. Establishing a Food System writes six
   things in order and makes the last one — the `system.current` pointer — the
   commit point. That ordering means a half-created system is never CURRENT, but
   it does not mean a current system is always coherent: storage can be edited
   by hand, cleared selectively, or written by an older version of this code.

   So the pointer is not trusted on sight. Everything it reaches is checked
   first, and if any check fails the surface renders a refusal rather than a
   partial Food System.

   ══ IT REFUSES. IT DOES NOT REPAIR. ═════════════════════════════════════════

   There is no branch here that fills in a missing score, re-derives a decision,
   recomputes anything, or deletes a record to make the error go away. A
   validator that repaired its input would be the silent-recalculation defect
   wearing a different hat — and deleting somebody's records to clear an error
   message is the most destructive thing this layer could do.

   Records are left exactly where they are. The pointer is left alone. Offering
   to start a new assessment is the surface's business and is allowed; quietly
   discarding the old one is not.

   ══ THE RESULT IS A VALUE, SO THE FAILING CHECK IS TESTABLE ═════════════════

   `{ ok: false, failed: "score-missing" }` rather than a thrown error or a
   boolean, so a test can assert WHICH check caught a given tampering — one case
   per check — instead of only that something did.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * The checks, in the order they run.
 *
 * Order matters for the message, not the verdict: existence before agreement
 * before version, so a missing score is reported as a missing score rather
 * than as an identity mismatch with `undefined`.
 */
export type SystemCheck =
  /**
   * `system.current` names a system record that is not there.
   *
   * Checked by the loader rather than here, because this function is handed a
   * system record and cannot be called without one. It is in this union so
   * that every way a current pointer can fail has ONE vocabulary — a loader
   * reporting a missing system as "assessment-missing" would send whoever read
   * the message looking in the wrong place.
   */
  | "system-record-missing"
  | "assessment-missing"
  | "score-missing"
  | "priority-decision-missing"
  | "plan-decision-missing"
  | "identities-disagree"
  | "provenance-malformed"
  | "policy-version-unresolvable"
  | "action-set-version-unresolvable"
  | "action-references-unknown-entry"

export const SYSTEM_CHECKS: readonly SystemCheck[] = [
  "system-record-missing",
  "assessment-missing",
  "score-missing",
  "priority-decision-missing",
  "plan-decision-missing",
  "identities-disagree",
  "provenance-malformed",
  "policy-version-unresolvable",
  "action-set-version-unresolvable",
  "action-references-unknown-entry",
]

/** Everything a Food System needs in order to be shown. */
export interface FoodSystemRecords {
  readonly system: StoredFoodSystem
  readonly assessment: StoredAssessment | null
  readonly score: StoredScore | null
  readonly priorityDecision: StoredPriorityDecision | null
  readonly planDecision: StoredPlanDecision | null
  readonly actions: readonly StoredAction[]
}

export type SystemValidation =
  | {
      readonly ok: true
      readonly system: StoredFoodSystem
      readonly assessment: StoredAssessment
      readonly score: StoredScore
      readonly priorityDecision: StoredPriorityDecision
      readonly planDecision: StoredPlanDecision
      readonly actions: readonly StoredAction[]
    }
  | { readonly ok: false; readonly failed: SystemCheck }

/** Five non-empty strings. Not "is this version current" — only "is it a version". */
function provenanceWellFormed(p: ScoreProvenance | undefined): boolean {
  if (!p) return false
  const fields = [
    p.fssMethodVersion,
    p.assessmentVersion,
    p.questionSetVersion,
    p.calculationVersion,
    p.interpretationVersion,
  ]
  return fields.every((v) => typeof v === "string" && v.trim().length > 0)
}

/**
 * May this Food System be shown?
 *
 * ── A note on the two version checks, because they look stricter than they are
 *
 * `policy-version-unresolvable` and `action-set-version-unresolvable` fail the
 * whole system, while `resolvePriorityDecision` and `resolvePlanDecision` turn
 * the same conditions into a rendered "decided under a method that has moved".
 * Both are deliberate, and they are not the same situation:
 *
 *   · the DECISION resolvers handle a version recorded on a DECISION. That is a
 *     historical record, it is expected to age, and showing it with its refusal
 *     is the honest thing to do.
 *   · this handles the version recorded on the SYSTEM, which is what every
 *     other resolution is read through. If that cannot be resolved, we cannot
 *     say what cadence set the review point or what policy was in force, so
 *     there is no coherent Food System to compose — only a pile of records.
 *
 * So Gate 4 fails closed on the system anchor and renders the refusal on the
 * decision anchors. A future gate that wants to show an aged system in a
 * read-only "historical" mode has somewhere to put that; it is not this gate,
 * and guessing it now would be designing for a requirement nobody has stated.
 *
 * ── `legacy-unversioned` is NOT malformed ─────────────────────────────────
 *
 * It is a complete, well-formed provenance whose five fields all say "we do not
 * know". It passes this check and is refused by `canCompare` instead, which is
 * where that refusal belongs.
 */
export function validateFoodSystem(records: FoodSystemRecords): SystemValidation {
  const { system, assessment, score, priorityDecision, planDecision, actions } = records

  const fail = (failed: SystemCheck) => ({ ok: false, failed }) as const

  if (!assessment) return fail("assessment-missing")
  if (!score) return fail("score-missing")
  if (!priorityDecision) return fail("priority-decision-missing")
  if (!planDecision) return fail("plan-decision-missing")

  if (
    system.assessmentId !== assessment.id ||
    system.scoreId !== score.id ||
    score.assessmentId !== assessment.id ||
    priorityDecision.scoreId !== score.id ||
    planDecision.scoreId !== score.id ||
    actions.some((a) => a.scoreId !== score.id)
  ) {
    return fail("identities-disagree")
  }

  if (!provenanceWellFormed(score.provenance)) return fail("provenance-malformed")

  if (!isCurrentSystemModel(system.systemModelVersion)) return fail("policy-version-unresolvable")
  if (system.actionSetVersion !== ACTION_SET_VERSION) {
    return fail("action-set-version-unresolvable")
  }

  /*
   * An action whose catalogue id is unknown while the content version still
   * matches means the catalogue changed without its version changing — a
   * defect in the content set rather than an aged record. Fail closed: the
   * alternative is showing a person an action nothing can describe, on a
   * surface that claims every sentence is reviewed.
   */
  const known = new Set(ACTION_CATALOGUE.map((e) => e.id))
  if (actions.some((a) => a.actionSetVersion === ACTION_SET_VERSION && !known.has(a.recommendationId))) {
    return fail("action-references-unknown-entry")
  }

  return { ok: true, system, assessment, score, priorityDecision, planDecision, actions }
}

/**
 * Exported only so a test can prove the `legacy-unversioned` carve-out is real
 * rather than incidental. Nothing in the validation path calls it.
 */
export const VALIDATION_ACCEPTS_LEGACY_PROVENANCE = (p: ScoreProvenance): boolean =>
  isLegacyUnversioned(p) && provenanceWellFormed(p)
