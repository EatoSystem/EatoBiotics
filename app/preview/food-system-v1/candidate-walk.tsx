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
import {
  abandonDraft,
  loadCurrentDraft,
  startDraft,
  type DraftState,
} from "@/lib/fss/system/draft"
import { WALK_COPY } from "@/lib/fss/presentation/system"

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
  const [draft, setDraft] = useState<DraftState | null>(null)
  const [justEstablished, setJustEstablished] = useState<FoodSystemScore | null>(null)
  const [establishFailed, setEstablishFailed] = useState<string | null>(null)

  /*
   * Both pointers are read on every reload, and they are INDEPENDENT.
   *
   * `system.current` says what is established. `assessment.draft.current` says
   * whether an attempt is in progress. Neither affects the other: starting or
   * abandoning a reassessment leaves the established Food System exactly where
   * it is, which is the property that makes reassessing safe to begin.
   */
  const reload = useCallback(() => {
    void (async () => {
      const repo = foodSystemRepository()
      setLoad(await loadCurrentFoodSystem({ repo, set }))
      setDraft(await loadCurrentDraft({ repo, set }))
    })()
  }, [set])

  useEffect(reload, [reload])

  /** Begin an attempt, against whatever is current right now. */
  const beginDraft = useCallback(() => {
    void (async () => {
      const repo = foodSystemRepository()
      await startDraft({
        repo,
        set,
        previousSystemId: await repo.loadCurrentSystemId(),
        now: new Date().toISOString(),
      })
      setJustEstablished(null)
      reload()
      window.scrollTo({ top: 0 })
    })()
  }, [set, reload])

  /** Abandon an attempt. Touches the draft and nothing else. */
  const discardDraft = useCallback(
    (draftId: string) => {
      void (async () => {
        await abandonDraft({ repo: foodSystemRepository(), draftId })
        reload()
      })()
    },
    [reload],
  )

  const complete = useCallback(
    (given: Answers) => {
      if (!draft || draft.state !== "open") return
      void (async () => {
        const repo = foodSystemRepository()
        const score = computeFoodSystemScore({
          set,
          answers: given,
          weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
          fixtureContext: nonProductionFixture("FSS-v1 candidate preview"),
        })

        /*
         * Establishment mints the immutable assessment out of the draft and
         * chains the new system to the one the attempt was started against.
         * Nothing belonging to that earlier system is read, rewritten or
         * cleared — the new record points back, and that is the whole of it.
         */
        const established = await establishFoodSystem({
          repo,
          set,
          answers: given,
          score,
          draft: draft.draft,
          now: new Date().toISOString(),
        })

        if (!established.ok) {
          /*
           * No result page, and — just as important — NO CLEANUP. The draft is
           * still there and the previous system is still current, so the
           * person can try again or discard the attempt themselves.
           */
          setEstablishFailed(
            established.failure.reason === "validation-failed"
              ? established.failure.failed
              : "score-missing",
          )
          return
        }

        setJustEstablished(score)
        reload()
        window.scrollTo({ top: 0 })
      })()
    },
    [set, draft, reload],
  )

  const restart = useCallback(() => {
    void (async () => {
      /*
       * Clearing the POINTER only. Every record stays exactly where it is, so
       * a person who starts again has not had their previous Food System
       * deleted out from under them.
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

  if (load === null || draft === null) return null

  if (load.state === "unavailable") {
    return <SystemUnavailable failed={load.failed} systemId={load.systemId} onRestart={restart} />
  }

  /*
   * An attempt in progress is answered, whatever else exists.
   *
   * When a system is already current it stays current throughout — it is not
   * unmounted, not modified, and immediately rendered again if the attempt is
   * abandoned.
   */
  if (draft.state === "open") {
    return <CandidateAssessment set={set} draft={draft.draft} onComplete={complete} />
  }

  /*
   * A draft from a different question set is NOT resumed and NOT deleted.
   *
   * Its answers describe questions that may no longer exist or may no longer
   * mean the same thing, so continuing would mix two instruments inside one
   * assessment. The person decides; their answers stay until they do.
   */
  if (draft.state === "stale") {
    return (
      <StaleDraft
        onDiscard={() => discardDraft(draft.draft.id)}
        hasSystem={load.state === "ready"}
      />
    )
  }

  if (load.state === "none") {
    /*
     * Nothing established and no attempt open. Start one — this is a person's
     * first visit, and the baseline begins with `previousSystemId: null`.
     */
    return <StartFirst onStart={beginDraft} />
  }

  /*
   * Just established: the result, built from the RECORDED decisions.
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

  return <MyFoodSystemView system={load.system} onReload={reload} onReassess={beginDraft} />
}

/** The first visit: nothing established, nothing in progress. */
function StartFirst({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto w-full max-w-[640px] px-6 py-16 text-center">
      <h1 className="font-serif text-3xl font-bold">{WALK_COPY.startTitle}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{WALK_COPY.startIntro}</p>
      <button
        type="button"
        onClick={onStart}
        className="mt-8 inline-flex min-h-[52px] items-center rounded-full px-8 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ background: "var(--icon-green)" }}
      >
        {WALK_COPY.startCta}
      </button>
    </div>
  )
}

/** An attempt begun under a question set that has since moved. */
function StaleDraft({ onDiscard, hasSystem }: { onDiscard: () => void; hasSystem: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[640px] px-6 py-16">
      <h1 className="font-serif text-3xl font-bold">{WALK_COPY.staleTitle}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{WALK_COPY.staleIntro}</p>
      {hasSystem && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {WALK_COPY.staleSystemIntact}
        </p>
      )}
      <button
        type="button"
        onClick={onDiscard}
        className="mt-8 inline-flex min-h-[48px] items-center rounded-full border px-6 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ borderColor: "var(--border)" }}
      >
        {WALK_COPY.staleDiscard}
      </button>
    </div>
  )
}
