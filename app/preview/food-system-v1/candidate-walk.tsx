"use client"

import { useCallback, useEffect, useState } from "react"
import { CandidateAssessment } from "@/components/fss/candidate-assessment"
import { CandidateResult } from "@/components/fss/candidate-result"
import { MyFoodSystemView } from "@/components/fss/my-food-system"
import { SystemUnavailable } from "@/components/fss/system/unavailable"
import { computeFoodSystemScore, type Answers, type FoodSystemScore } from "@/lib/fss/engine/score"
import {
  DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
  nonProductionFixture,
} from "@/lib/fss/engine/weights"
import type { ResolvedQuestionSet } from "@/lib/fss/questions/types"
import { foodSystemRepository } from "@/lib/fss/persistence/local"
import { establishFoodSystem } from "@/lib/fss/system/establish"
import { loadCurrentFoodSystem, type FoodSystemLoad } from "@/lib/fss/system/load"

/**
 * The walk: assessment → score → result → MY FOOD SYSTEM.
 *
 * ══ FOUR STATES ON ONE ROUTE ════════════════════════════════════════════════
 *
 *   loading          reading storage. Renders nothing, briefly.
 *   assessment       no current Food System. A first visit, or cleared storage.
 *   result           just established. The score, the priority, the plan.
 *   my-food-system   a Food System is current. This is where a RETURN lands.
 *   unavailable      a Food System is current and did not validate.
 *
 * A refresh at any point after establishment lands on My Food System with
 * everything intact, which is the gate's definition of done — and it costs
 * nothing in `lib/v1-surface.ts`, because no route was added. Keeping it on one
 * route also keeps every component inside `CANDIDATE_ROOTS`, the carve-out that
 * permits "Your Food System Score™" at all.
 *
 * ══ THE FIXTURE CONTEXT IS STILL CONSTRUCTED HERE ═══════════════════════════
 *
 * In a component that only ever renders behind `isFoodSystemV1PreviewEligible`.
 * That is the intended shape — the engine refuses to score without one, so the
 * only places that can produce a candidate score are places that have said, in
 * the type system, that they are not production.
 *
 * ══ ESTABLISHMENT HAPPENS ONCE, AT COMPLETION ═══════════════════════════════
 *
 * `complete()` computes the score and calls `establishFoodSystem`, which is the
 * only place `resolvePriorities` and `buildPlan` are called. The result page
 * then renders the priorities and plan READ BACK from what was recorded, rather
 * than selecting for itself — so the result page and the Food System it just
 * created cannot disagree, now or after the selection rule moves.
 *
 * If establishment fails, the result page is NOT shown. There would be nothing
 * behind it: a score in component state, no records, and a "continue" button
 * leading to an assessment. The failure is surfaced instead.
 */
export function CandidateWalk({ set }: { set: ResolvedQuestionSet }) {
  const [load, setLoad] = useState<FoodSystemLoad | null>(null)
  const [justEstablished, setJustEstablished] = useState<FoodSystemScore | null>(null)
  const [establishFailed, setEstablishFailed] = useState<string | null>(null)

  const reload = useCallback(() => {
    void (async () => {
      setLoad(await loadCurrentFoodSystem({ repo: foodSystemRepository(), set }))
    })()
  }, [set])

  useEffect(reload, [reload])

  const complete = useCallback(
    (given: Answers) => {
      void (async () => {
        const repo = foodSystemRepository()
        const score = computeFoodSystemScore({
          set,
          answers: given,
          weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
          fixtureContext: nonProductionFixture("FSS-v1 candidate preview"),
        })
        const now = new Date().toISOString()

        const established = await establishFoodSystem({
          repo,
          set,
          answers: given,
          score,
          assessment: {
            id: "candidate",
            assessmentVersion: set.assessmentVersion,
            questionSetVersion: set.questionSetVersion,
            answers: given,
            startedAt: (await repo.loadAssessment("candidate"))?.startedAt ?? now,
            completedAt: now,
          },
          now,
        })

        if (!established.ok) {
          /*
           * No result page on a failed establishment. The score exists only in
           * memory at this point, so a result page would be showing something
           * that is not saved, above a button leading to a Food System that was
           * never created.
           */
          setEstablishFailed(
            established.failure.reason === "validation-failed"
              ? established.failure.failed
              : "score-missing",
          )
          return
        }

        setJustEstablished(score)
        setLoad(await loadCurrentFoodSystem({ repo, set }))
        window.scrollTo({ top: 0 })
      })()
    },
    [set],
  )

  const restart = useCallback(() => {
    void (async () => {
      /*
       * Clearing the POINTER only. Every record stays exactly where it is —
       * `clearCurrentSystem` removes one key and touches nothing else, so a
       * person who starts again has not had their previous Food System deleted
       * out from under them. Gate 5's reassessment is what will give those
       * records a second home; until then they are simply no longer current.
       */
      await foodSystemRepository().clearCurrentSystem()
      setJustEstablished(null)
      setEstablishFailed(null)
      reload()
    })()
  }, [reload])

  if (establishFailed) {
    return (
      <SystemUnavailable
        failed={establishFailed as Parameters<typeof SystemUnavailable>[0]["failed"]}
        systemId="not created"
        onRestart={restart}
      />
    )
  }

  if (load === null) return null

  if (load.state === "unavailable") {
    return <SystemUnavailable failed={load.failed} systemId={load.systemId} onRestart={restart} />
  }

  if (load.state === "none") {
    return <CandidateAssessment set={set} onComplete={complete} />
  }

  /*
   * Just established: show the result, built from the RECORDED decisions.
   *
   * When either decision did not resolve there is no result page to show — the
   * person is taken straight to My Food System, which renders the refusal
   * properly rather than this page rendering a plan it does not have.
   */
  if (
    justEstablished &&
    load.system.priorities.state === "resolved" &&
    load.system.plan.state === "resolved"
  ) {
    return (
      <CandidateResult
        score={justEstablished}
        set={set}
        answers={load.system.assessment.answers}
        priorities={load.system.priorities.priorities}
        plan={load.system.plan.plan}
        onRestart={restart}
        onContinue={() => {
          setJustEstablished(null)
          window.scrollTo({ top: 0 })
        }}
      />
    )
  }

  return <MyFoodSystemView system={load.system} onReload={reload} />
}
