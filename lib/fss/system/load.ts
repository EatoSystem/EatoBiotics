import type { ResolvedQuestionSet } from "@/lib/fss/questions/types"
import type { FoodSystemRepository } from "@/lib/fss/persistence/repository"
import { composeMyFoodSystem } from "./compose"
import { validateFoodSystem, type SystemCheck } from "./validate"
import type { MyFoodSystem } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   LOADING THE CURRENT FOOD SYSTEM.

   The one impure half of the pair: this reads, `composeMyFoodSystem` composes.
   Keeping them apart is what lets the composer be pure and diffable, and lets
   this be the only thing a test has to fake in order to exercise a load.

   ── Three outcomes, and `none` is not a failure ───────────────────────────

     `none`         there is no current Food System. A first-time visitor, or
                    somebody who cleared their storage. The surface shows the
                    assessment; nothing is wrong.
     `unavailable`  there IS a pointer, and what it reaches does not validate.
                    The surface says so and CHANGES NOTHING — see below.
     `ready`        composed and safe to render.

   Collapsing `none` and `unavailable` would be the costly mistake: a visitor
   with no system would be shown an error, and — far worse — somebody whose
   records exist but failed a check would be shown the assessment, as though
   they had never taken it.

   ── `unavailable` IS NOT DESTRUCTIVE ──────────────────────────────────────

   No record is deleted, no pointer is cleared, nothing is recomputed, and the
   failing check is reported rather than repaired. Clearing the pointer would
   "fix" the symptom by throwing away the person's Food System, which is the
   most destructive thing this layer could do and is never the right response to
   a failed read.
   ════════════════════════════════════════════════════════════════════════ */

export type FoodSystemLoad =
  | { readonly state: "none" }
  | { readonly state: "unavailable"; readonly failed: SystemCheck; readonly systemId: string }
  | { readonly state: "ready"; readonly system: MyFoodSystem }

export async function loadCurrentFoodSystem(args: {
  repo: FoodSystemRepository
  set: ResolvedQuestionSet
}): Promise<FoodSystemLoad> {
  const { repo, set } = args

  const systemId = await repo.loadCurrentSystemId()
  if (!systemId) return { state: "none" }

  const system = await repo.loadSystem(systemId)
  if (!system) return { state: "unavailable", failed: "system-record-missing", systemId }

  const verdict = validateFoodSystem({
    system,
    assessment: await repo.loadAssessment(system.assessmentId),
    score: await repo.loadScore(system.scoreId),
    priorityDecision: await repo.loadPriorityDecision(system.scoreId),
    planDecision: await repo.loadPlanDecision(system.scoreId),
    actions: await repo.loadActions(system.scoreId),
  })

  if (!verdict.ok) return { state: "unavailable", failed: verdict.failed, systemId }

  return {
    state: "ready",
    system: composeMyFoodSystem({
      system: verdict.system,
      assessment: verdict.assessment,
      score: verdict.score,
      priorityDecision: verdict.priorityDecision,
      planDecision: verdict.planDecision,
      actions: verdict.actions,
      set,
    }),
  }
}
