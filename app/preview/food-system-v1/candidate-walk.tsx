"use client"

import { useState } from "react"
import { CandidateAssessment } from "@/components/fss/candidate-assessment"
import { CandidateResult } from "@/components/fss/candidate-result"
import { computeFoodSystemScore, type Answers, type FoodSystemScore } from "@/lib/fss/engine/score"
import {
  DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
  nonProductionFixture,
} from "@/lib/fss/engine/weights"
import type { ResolvedQuestionSet } from "@/lib/fss/questions/types"

/**
 * The walk: assessment → score → result.
 *
 * The fixture context is constructed HERE, in a component that only ever
 * renders behind `isFoodSystemV1PreviewEligible`. That is the intended shape —
 * the engine refuses to score without one, so the only places that can produce
 * a candidate score are places that have said, in the type system, that they
 * are not production.
 */
export function CandidateWalk({ set }: { set: ResolvedQuestionSet }) {
  const [score, setScore] = useState<FoodSystemScore | null>(null)
  const [answers, setAnswers] = useState<Answers>({})

  function complete(given: Answers) {
    setAnswers(given)
    setScore(
      computeFoodSystemScore({
        set,
        answers: given,
        weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
        fixtureContext: nonProductionFixture("FSS-v1 candidate preview"),
      }),
    )
    window.scrollTo({ top: 0 })
  }

  if (!score) return <CandidateAssessment set={set} onComplete={complete} />

  return (
    <CandidateResult
      score={score}
      set={set}
      answers={answers}
      onRestart={() => {
        setScore(null)
        setAnswers({})
      }}
    />
  )
}
