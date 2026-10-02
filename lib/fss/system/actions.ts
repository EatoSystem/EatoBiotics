import { withActionState } from "@/lib/fss/action/stored"
import type {
  ActionState,
  FoodSystemRepository,
  StoredAction,
} from "@/lib/fss/persistence/repository"

/* ════════════════════════════════════════════════════════════════════════
   MOVING AN ACTION — the only mutable state in a Food System.

   ── Why this is a module and not a line in a component ────────────────────

   Because it is the one WRITE outside establishment, and it needs the same two
   properties establishment has: it is strict, and it is the only place that
   does this. A component calling `saveAction` directly would be a second
   writer of human state, and the first symptom of two writers is a count that
   disagrees with the row it counted.

   ── What it does not do, in order of how tempting each one is ─────────────

   It does not record an outcome. There is no benefit, effect or improvement
   parameter, and `StoredAction` has no field for one. Marking something done is
   a person reporting what they did; this product cannot see what it did inside
   them, and the gap between those two things is the whole reason the claims
   boundary exists.

   It does not touch the score. Nothing here reads, writes or invalidates a
   score, so marking an action cannot move a number. `Progress` is asserted
   byte-identical with zero completions and with three, apart from the counts.

   It does not re-plan. A person marking today's action done does not get a new
   one: the plan was decided once, under a policy version, and handing out a
   replacement would be re-deciding it silently — and would turn a day's
   suggestion into an endless queue, which is the habit tracker this gate
   deliberately is not.

   It does not refuse a reversal. `done` and `skipped` both go back to
   `planned`, because a mistyped tap should not become a verdict.
   ════════════════════════════════════════════════════════════════════════ */

export type ActionMoveResult =
  | { readonly ok: true; readonly actions: readonly StoredAction[] }
  | { readonly ok: false; readonly reason: "action-not-found" }
  | { readonly ok: false; readonly reason: "write-failed"; readonly cause: unknown }

/**
 * Move one action to a new state and persist it.
 *
 * Returns the whole updated set rather than the one row, so the caller renders
 * from what is now stored instead of from an optimistic local copy. A UI that
 * updated itself and then saved would show the new state even when the save
 * failed — which, on a surface whose entire purpose is to remember, is the
 * worst available failure.
 *
 * `now` is a parameter. The clock belongs to the caller.
 */
export async function moveAction(args: {
  repo: FoodSystemRepository
  scoreId: string
  actionId: string
  state: ActionState
  now: string
}): Promise<ActionMoveResult> {
  const { repo, scoreId, actionId, state, now } = args

  const existing = await repo.loadActions(scoreId)
  const target = existing.find((a) => a.id === actionId)
  if (!target) return { ok: false, reason: "action-not-found" }

  try {
    await repo.saveAction(withActionState(target, state, now))
  } catch (cause) {
    return { ok: false, reason: "write-failed", cause }
  }

  return { ok: true, actions: await repo.loadActions(scoreId) }
}
