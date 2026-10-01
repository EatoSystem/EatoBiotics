import type { ActionState, StoredAction } from "@/lib/fss/persistence/repository"
import { ACTION_CATALOGUE } from "./catalogue"
import { ACTION_SET_VERSION, type Recommendation } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   Storing a recommendation, and reading one back.

   ── The refusal this module exists for ────────────────────────────────────

   A stored action keeps an id and two versions, never the prose. So reading
   one back is a LOOKUP, and a lookup can fail in two ways that matter:

     the content version has moved    the sentence that was shown is not the
                                      sentence that is there now
     the id is not in the catalogue   the entry was withdrawn

   In both cases the honest answer is "this was recommended under a method that
   has moved", not today's wording presented as what somebody was told. Showing
   the current sentence would be rewriting history to look consistent — the same
   dishonesty `legacy-unversioned` refuses for scores, and the same reason
   `LEGACY_UNVERSIONED` is a distinct sentinel rather than a guess.

   ── Why this is built now, with no caller ─────────────────────────────────

   Because the reasoning is fresh. Gate 2 declared `StoredAction` empty on
   exactly that argument — "so that the shape Gate 3 has to satisfy is agreed
   while the reasoning is fresh rather than invented alongside the content" —
   and the refusal is the part that would be hardest to add later, once there
   are stored rows that a convenient fallback would quietly paper over.
   ════════════════════════════════════════════════════════════════════════ */

/** What a stored action resolves to. Never a silent substitution. */
export type StoredActionResolution =
  | { readonly state: "resolved"; readonly recommendation: Recommendation }
  | {
      readonly state: "unresolvable"
      readonly reason: "content-version-moved" | "entry-withdrawn"
      readonly storedVersion: string
      readonly storedRecommendationId: string
    }

/**
 * Record a recommendation a person was shown.
 *
 * `createdAt` is a parameter rather than a `new Date()` call, so a caller
 * decides when something happened and a test can say so exactly. The plan
 * itself carries no clock at all; this is the one place a time is real.
 */
export function toStoredAction(args: {
  id: string
  scoreId: string
  recommendation: Recommendation
  state: ActionState
  createdAt: string
  /**
   * When the state last moved. Defaults to `createdAt`, so a freshly created
   * action reports "never changed" as a real timestamp rather than a null the
   * reader has to interpret.
   */
  changedAt?: string
}): StoredAction {
  const { id, scoreId, recommendation: r, state, createdAt } = args
  return {
    id,
    scoreId,
    sourcePriority: r.priorityId,
    sourceDomain: r.sourceDomain,
    recommendationId: r.id,
    actionCategory: r.category,
    timeHorizon: r.timeHorizon,
    provenance: r.provenance,
    actionSetVersion: r.actionSetVersion,
    state,
    createdAt,
    changedAt: args.changedAt ?? createdAt,
  }
}

/**
 * Move one action to a new state.
 *
 * Returns a NEW record — nothing is mutated — and takes the time as a
 * parameter for the same reason `toStoredAction` does: a caller decides when
 * something happened, and a test can say so exactly.
 *
 * It asserts nothing about what the move means. There is no outcome parameter,
 * no benefit, and no effect: a person marking an action done is reporting what
 * they did, and this product cannot see what it did inside them.
 */
export function withActionState(
  stored: StoredAction,
  state: ActionState,
  changedAt: string,
): StoredAction {
  return { ...stored, state, changedAt }
}

/**
 * Read a stored action back into the recommendation it was.
 *
 * Refuses rather than substitutes. There is no fallback to the current
 * catalogue, no partial resolution, and no "closest match" — a recommendation
 * whose reasoning cannot be reconstructed exactly is not auditable, and
 * pretending otherwise is worse than admitting it.
 */
export function resolveStoredAction(stored: StoredAction): StoredActionResolution {
  const unresolvable = (reason: "content-version-moved" | "entry-withdrawn") =>
    ({
      state: "unresolvable",
      reason,
      storedVersion: stored.actionSetVersion,
      storedRecommendationId: stored.recommendationId,
    }) as const

  /*
   * Version first. If the content set has moved, the entry's id matching tells
   * us nothing — the sentence under that id may have been reworded, which is
   * exactly the case this refusal exists for.
   */
  if (stored.actionSetVersion !== ACTION_SET_VERSION) {
    return unresolvable("content-version-moved")
  }

  const entry = ACTION_CATALOGUE.find((e) => e.id === stored.recommendationId)
  if (!entry) return unresolvable("entry-withdrawn")

  return {
    state: "resolved",
    recommendation: {
      ...entry,
      priorityId: stored.sourcePriority,
      sourceDomain: entry.domain,
      status: "candidate-pending-review",
      provenance: stored.provenance,
      actionSetVersion: ACTION_SET_VERSION,
    },
  }
}
