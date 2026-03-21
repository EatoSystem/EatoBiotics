"use client"

import { useState, useEffect } from "react"
import {
  loadAssessment,
  saveAssessment,
  emptyAssessmentState,
  loadPrivacyChoice,
  saveLeadData,
  loadLeadData,
  type AssessmentState,
  type LeadData,
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
  const [lead, setLead] = useState<LeadData | null>(null)

  // Load saved state from localStorage after hydration
  useEffect(() => {
    const saved = loadAssessment()
    // Don't restore terminal states — always show the intro on a fresh page visit.
    // Results are delivered via email; the page itself resets so new visitors
    // (or returning users) always see the lead capture form, not stale results.
    const initialState =
      saved.view === "results" || saved.view === "privacy"
        ? emptyAssessmentState()
        : saved
    setState(initialState)
    setLead(loadLeadData())
    setHydrated(true)
  }, [])

  // Persist on every state change, but only after hydration
  useEffect(() => {
    if (hydrated) saveAssessment(state)
  }, [state, hydrated])

  function startAssessment(leadData: LeadData) {
    // Persist lead
    saveLeadData(leadData)
    setLead(leadData)

    // Fire-and-forget: store lead in Supabase
    fetch("/api/submit-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData),
    }).catch(() => {/* ignore network errors */})

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
      const computed = computeResult(answers)
      const privacyAlreadyChosen = loadPrivacyChoice() !== null

      // Fire-and-forget: send results email
      const currentLead = lead ?? loadLeadData()
      if (currentLead) {
        fetch("/api/send-results-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead: currentLead, result: computed }),
        }).catch(() => {/* ignore network errors */})
      }

      setState((s) => ({
        ...s,
        answers,
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

  return <AssessmentResults result={state.result} onRetake={handleRetake} leadEmail={lead?.email} />
}
