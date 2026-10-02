import type { Answers } from "@/lib/fss/engine/score"
import type { ResolvedQuestionSet } from "@/lib/fss/questions/types"
import type {
  FoodSystemRepository,
  StoredAssessmentDraft,
} from "@/lib/fss/persistence/repository"
import { newId } from "./identity"

/* ════════════════════════════════════════════════════════════════════════
   A REASSESSMENT ATTEMPT.

   ══ THE DRAFT IS NOT THE ASSESSMENT ════════════════════════════════════════

   A draft is MUTABLE and RESUMABLE — somebody answering, changing their mind,
   paging back. A completed `StoredAssessment` is IMMUTABLE — the evidence a
   Food System was built from, never written to again while that system exists.

   Conflating the two is precisely how a baseline gets overwritten, and until
   Gate 5 they WERE conflated: the in-progress assessment was saved to
   `assessment.candidate`, the same key an established baseline was read from.

   ══ NOTHING HERE TOUCHES `system.current` ══════════════════════════════════

   Starting a draft, answering into it, abandoning it — none of it moves the
   pointer. The person's existing Food System stays intact and fully readable
   for the whole life of an attempt, and only a successful establishment moves
   anything. `tests/unit/my-food-system.test.ts` asserts the abandoned case
   directly, because "we did not mean to" is not a property.

   ══ AND THE DELETE IS CALLED IN EXACTLY TWO PLACES ═════════════════════════

   After `setCurrentSystem` succeeds, and when a person explicitly abandons.
   NEVER on a failure path: a failed establishment must leave the old system
   current and the draft still there, so the attempt is recoverable rather than
   discarded on their behalf.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Begin an attempt.
 *
 * `previousSystemId` is captured HERE, at the moment the attempt starts,
 * rather than read again at completion. It records which system this
 * reassessment was started against — which is what the chain should say, even
 * if the pointer moved in another tab in between.
 */
export async function startDraft(args: {
  repo: FoodSystemRepository
  set: ResolvedQuestionSet
  previousSystemId: string | null
  now: string
}): Promise<StoredAssessmentDraft> {
  const { repo, set, previousSystemId, now } = args
  const draft: StoredAssessmentDraft = {
    id: newId("assessment"),
    previousSystemId,
    assessmentVersion: set.assessmentVersion,
    questionSetVersion: set.questionSetVersion,
    startedAt: now,
    answers: {},
    index: 0,
  }
  await repo.saveDraft(draft)
  await repo.setCurrentDraft(draft.id)
  return draft
}

/** Record an answer, or a move. Lenient: losing a place beats crashing. */
export async function updateDraft(args: {
  repo: FoodSystemRepository
  draft: StoredAssessmentDraft
  answers: Answers
  index: number
}): Promise<StoredAssessmentDraft> {
  const next: StoredAssessmentDraft = { ...args.draft, answers: args.answers, index: args.index }
  await args.repo.saveDraft(next)
  return next
}

/**
 * The attempt in progress, if there is one, and if it still applies.
 *
 * ── A DRAFT FROM A DIFFERENT INSTRUMENT IS NOT RESUMED ────────────────────
 *
 * If the question set has moved since the attempt began, its answers describe
 * questions that may no longer exist or may no longer mean the same thing.
 * Resuming would silently mix two instruments inside one assessment, which is
 * the defect `canCompare` refuses one layer up. It is reported as stale rather
 * than deleted — the person decides, and their answers are still there.
 */
export type DraftState =
  | { readonly state: "none" }
  | { readonly state: "open"; readonly draft: StoredAssessmentDraft; readonly resumeAt: number }
  | { readonly state: "stale"; readonly draft: StoredAssessmentDraft }

export async function loadCurrentDraft(args: {
  repo: FoodSystemRepository
  set: ResolvedQuestionSet
}): Promise<DraftState> {
  const { repo, set } = args
  const id = await repo.loadCurrentDraftId()
  if (!id) return { state: "none" }

  const draft = await repo.loadDraft(id)
  if (!draft) return { state: "none" }

  if (draft.questionSetVersion !== set.questionSetVersion) return { state: "stale", draft }

  return { state: "open", draft, resumeAt: reconcileIndex(set, draft) }
}

/**
 * Where to put somebody back, reconciling the stored cursor with the answers.
 *
 * ── THE CURSOR IS A HINT; THE ANSWERS ARE THE AUTHORITY ───────────────────
 *
 * Gate 4 refused to store a cursor at all, because "a stored cursor could
 * disagree with the answers it was meant to describe", and derived the resume
 * point from the first unanswered question. That is right about correctness and
 * wrong about one real case: somebody who paged BACKWARDS to re-read an earlier
 * question and closed the tab there gets thrown to the end of their answers.
 *
 * So both are used. The stored cursor is honoured when it sits at or before the
 * first unanswered question — which is exactly the paged-backwards case — and
 * the derived point wins otherwise. A stale or tampered number can never put
 * somebody on a question their own answers contradict.
 */
export function reconcileIndex(set: ResolvedQuestionSet, draft: StoredAssessmentDraft): number {
  const questions = set.questions
  const firstUnanswered = questions.findIndex(
    (q) => typeof draft.answers[q.id] !== "number",
  )
  const derived = firstUnanswered === -1 ? Math.max(0, questions.length - 1) : firstUnanswered

  const stored = draft.index
  const inRange = Number.isInteger(stored) && stored >= 0 && stored < questions.length
  if (!inRange) return derived

  // Honoured only when it does not skip past unanswered work.
  return stored <= derived ? stored : derived
}

/**
 * Abandon an attempt.
 *
 * Deletes the draft and its pointer, and NOTHING else. The established Food
 * System, whatever it is, is exactly as it was — which is the property that
 * makes starting a reassessment a safe thing to do.
 */
export async function abandonDraft(args: {
  repo: FoodSystemRepository
  draftId: string
}): Promise<void> {
  await args.repo.clearCurrentDraft()
  await args.repo.deleteDraft(args.draftId)
}
