"use client"

import { useState, useEffect } from "react"
import {
  emptyAssessmentState,
  loadPrivacyChoice,
  saveLeadData,
  loadLeadData,
  type AssessmentState,
  type LeadData,
} from "@/lib/assessment-storage"
import { MIND_QUESTIONS } from "@/lib/mind-assessment-data"
import { computeMindResult } from "@/lib/mind-assessment-scoring"
import { MindAssessmentIntro } from "./mind-assessment-intro"
import { MindAssessmentResults } from "./mind-assessment-results"
import { AssessmentProgress } from "@/components/assessment/assessment-progress"
import { AssessmentQuestionView } from "@/components/assessment/assessment-question"
import { PrivacyOptIn } from "@/components/assessment/privacy-opt-in"

const STORAGE_KEY = "eatobiotics-mind-assessment"

function loadMindAssessment(): AssessmentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyAssessmentState()
    return JSON.parse(raw) as AssessmentState
  } catch {
    return emptyAssessmentState()
  }
}

function saveMindAssessment(state: AssessmentState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

export function MindAssessmentClient() {
  const [state, setState] = useState<AssessmentState>(emptyAssessmentState)
  const [hydrated, setHydrated] = useState(false)
  const [lead, setLead] = useState<LeadData | null>(null)

  useEffect(() => {
    const saved = loadMindAssessment()
    const initialState =
      saved.view === "results" || saved.view === "privacy"
        ? emptyAssessmentState()
        : saved
    setState(initialState)
    setLead(loadLeadData())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveMindAssessment(state)
  }, [state, hydrated])

  function startAssessment(leadData: LeadData) {
    saveLeadData(leadData)
    setLead(leadData)

    fetch("/api/submit-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData),
    }).catch(() => {})

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
    if (currentIndex < MIND_QUESTIONS.length - 1) {
      setState((s) => ({ ...s, currentIndex: s.currentIndex + 1 }))
    } else {
      const computed = computeMindResult(answers)
      const privacyAlreadyChosen = loadPrivacyChoice() !== null

      const currentLead = lead ?? loadLeadData()
      if (currentLead) {
        fetch("/api/send-results-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead: currentLead, result: computed }),
        }).catch(() => {})

        fetch("/api/auth/send-magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: currentLead.email, name: currentLead.name }),
        }).catch(() => {})
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
    localStorage.removeItem(STORAGE_KEY)
    setState({
      ...emptyAssessmentState(),
      view: "questions",
      currentIndex: 0,
      answers: {},
      startedAt: Date.now(),
    })
  }

  if (!hydrated) return null

  if (state.view === "intro") {
    return <MindAssessmentIntro onStart={startAssessment} />
  }

  if (state.view === "questions") {
    const currentQuestion = MIND_QUESTIONS[state.currentIndex]
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
          total={MIND_QUESTIONS.length}
          sectionTitle={currentQuestion.sectionTitle}
        />
        <AssessmentQuestionView
          question={currentQuestion}
          selected={currentAnswer}
          onAnswer={handleAnswer}
          onBack={handleBack}
          onNext={handleNext}
          canNext={hasAnswered}
          isLast={state.currentIndex === MIND_QUESTIONS.length - 1}
        />
      </div>
    )
  }

  if (state.view === "privacy" && state.result) {
    return (
      <PrivacyOptIn
        result={state.result}
        onChoice={() => setState((s) => ({ ...s, view: "results" }))}
      />
    )
  }

  if (!state.result) return null

  return (
    <MindAssessmentResults
      result={state.result}
      onRetake={handleRetake}
      leadEmail={lead?.email}
    />
  )
}
