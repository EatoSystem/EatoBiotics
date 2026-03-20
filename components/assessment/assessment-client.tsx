"use client"

import { useState, useEffect } from "react"
import {
  loadAssessment,
  saveAssessment,
  emptyAssessmentState,
  loadPrivacyChoice,
  type AssessmentState,
} from "@/lib/assessment-storage"
import { QUESTIONS } from "@/lib/assessment-data"
import { computeResult } from "@/lib/assessment-scoring"
import { AssessmentIntro } from "./assessment-intro"
import { AssessmentProgress } from "./assessment-progress"
import { AssessmentQuestionView } from "./assessment-question"
import { AssessmentResults } from "./assessment-results"
import { PrivacyOptIn } from "./privacy-opt-in"

export function AssessmentClient() {
  const [state, setState] = useState<AssessmentState>(emptyAssessmentState)
  const [hydrated, setHydrated] = useState(false)

  // Load saved state from localStorage after hydration
  useEffect(() => {
    setState(loadAssessment())
    setHydrated(true)
  }, [])

  // Persist on every state change, but only after hydration
  useEffect(() => {
    if (hydrated) saveAssessment(state)
  }, [state, hydrated])

  function startAssessment() {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
    setState((s) => ({
      ...s,
      view: "questions",
      currentIndex: 0,
      startedAt: s.startedAt ?? Date.now(),
    }))
  }

  function handleAnswer(questionId: string, value: number | string[]) {
    setState((s) => ({
      ...s,
      answers: { ...s.answers, [questionId]: value },
    }))
  }

  function handleNext() {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
    const { currentIndex, answers } = state
    if (currentIndex < QUESTIONS.length - 1) {
      setState((s) => ({ ...s, currentIndex: s.currentIndex + 1 }))
    } else {
      // Last question — compute results
      const newAnswers = answers
      const computed = computeResult(newAnswers)
      const privacyAlreadyChosen = loadPrivacyChoice() !== null
      setState((s) => ({
        ...s,
        answers: newAnswers,
        result: computed,
        view: privacyAlreadyChosen ? "results" : "privacy",
      }))
    }
  }

  function handleBack() {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
    if (state.currentIndex === 0) {
      setState((s) => ({ ...s, view: "intro" }))
    } else {
      setState((s) => ({ ...s, currentIndex: s.currentIndex - 1 }))
    }
  }

  function handleRetake() {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
    setState({
      ...emptyAssessmentState(),
      view: "questions",
      currentIndex: 0,
      answers: {},
      startedAt: Date.now(),
    })
  }

  /* ── Render ──────────────────────────────────────────────────────── */

  if (!hydrated) return null

  if (state.view === "intro") {
    return <AssessmentIntro onStart={startAssessment} />
  }

  if (state.view === "questions") {
    const currentQuestion = QUESTIONS[state.currentIndex]
    if (!currentQuestion) return null

    const currentAnswer = state.answers[currentQuestion.id]
    const hasAnswered =
      currentAnswer !== undefined &&
      currentAnswer !== null &&
      (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true)

    return (
      <div className="min-h-screen bg-background pt-[57px]">
        <AssessmentProgress
          currentIndex={state.currentIndex}
          total={QUESTIONS.length}
          sectionTitle={currentQuestion.sectionTitle}
        />
        <AssessmentQuestionView
          question={currentQuestion}
          selected={currentAnswer}
          onAnswer={handleAnswer}
          onBack={handleBack}
          onNext={handleNext}
          canNext={hasAnswered}
          isLast={state.currentIndex === QUESTIONS.length - 1}
        />
      </div>
    )
  }

  if (state.view === "privacy" && state.result) {
    return (
      <PrivacyOptIn
        result={state.result}
        onChoice={() => setState(s => ({ ...s, view: "results" }))}
      />
    )
  }

  // view === "results"
  if (!state.result) return null

  return <AssessmentResults result={state.result} onRetake={handleRetake} />
}
