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
import { FAMILY_QUESTIONS } from "@/lib/family-assessment-data"
import { computeResult } from "@/lib/family-assessment-scoring"
import { FamilyAssessmentIntro } from "./family-assessment-intro"
import { AssessmentProgress } from "@/components/assessment/assessment-progress"
import { AssessmentQuestionView } from "@/components/assessment/assessment-question"
import { FamilyAssessmentResults } from "./family-assessment-results"
import { PrivacyOptIn } from "@/components/assessment/privacy-opt-in"

/* ── Family-specific localStorage helpers ───────────────────────────── */

const FAMILY_KEY = "eatobiotics-family-assessment"

function loadFamilyAssessment(): AssessmentState {
  if (typeof window === "undefined") return emptyAssessmentState()
  try {
    const raw = localStorage.getItem(FAMILY_KEY)
    if (!raw) return emptyAssessmentState()
    const parsed = JSON.parse(raw) as AssessmentState
    if (
      typeof parsed.view === "string" &&
      typeof parsed.currentIndex === "number" &&
      typeof parsed.answers === "object" &&
      parsed.answers !== null
    ) {
      return parsed
    }
    return emptyAssessmentState()
  } catch {
    return emptyAssessmentState()
  }
}

function saveFamilyAssessment(state: AssessmentState): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(FAMILY_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable — fail silently
  }
}

/* ── Component ──────────────────────────────────────────────────────── */

export function FamilyAssessmentClient() {
  const [state, setState] = useState<AssessmentState>(emptyAssessmentState)
  const [hydrated, setHydrated] = useState(false)
  const [lead, setLead] = useState<LeadData | null>(null)

  useEffect(() => {
    const saved = loadFamilyAssessment()
    const initialState =
      saved.view === "results" || saved.view === "privacy"
        ? emptyAssessmentState()
        : saved
    setState(initialState)
    setLead(loadLeadData())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveFamilyAssessment(state)
  }, [state, hydrated])

  function startAssessment(leadData: LeadData) {
    saveLeadData(leadData)
    setLead(leadData)

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
    if (currentIndex < FAMILY_QUESTIONS.length - 1) {
      setState((s) => ({ ...s, currentIndex: s.currentIndex + 1 }))
    } else {
      const computed = computeResult(answers)
      const privacyAlreadyChosen = loadPrivacyChoice() !== null

      const currentLead = lead ?? loadLeadData()
      if (currentLead) {
        fetch("/api/send-results-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead: currentLead, result: computed }),
        }).catch(() => {/* ignore network errors */})

        fetch("/api/auth/send-magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: currentLead.email, name: currentLead.name }),
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
    return <FamilyAssessmentIntro onStart={startAssessment} />
  }

  if (state.view === "questions") {
    const currentQuestion = FAMILY_QUESTIONS[state.currentIndex]
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
          total={FAMILY_QUESTIONS.length}
          sectionTitle={currentQuestion.sectionTitle}
        />
        <AssessmentQuestionView
          question={currentQuestion}
          selected={currentAnswer}
          onAnswer={handleAnswer}
          onBack={handleBack}
          onNext={handleNext}
          canNext={hasAnswered}
          isLast={state.currentIndex === FAMILY_QUESTIONS.length - 1}
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
    <FamilyAssessmentResults
      result={state.result}
      onRetake={handleRetake}
      leadEmail={lead?.email}
    />
  )
}
