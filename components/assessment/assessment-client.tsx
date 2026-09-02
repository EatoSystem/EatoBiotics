"use client"

import { useState, useEffect, useRef } from "react"
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
import { bioticOf, startsBiotic } from "@/lib/assessment/biotics"
import { computeResult } from "@/lib/assessment-scoring"
import { AssessmentIntro } from "./assessment-intro"
import { AssessmentProgress } from "./assessment-progress"
import { AssessmentQuestionView } from "./assessment-question"
import { AssessmentResults } from "./assessment-results"
import { PrivacyOptIn } from "./privacy-opt-in"
import { patchJourney } from "@/lib/assessment/journey"
import posthog from "posthog-js"
import { logEvent } from "@/lib/statsig-client"

export function AssessmentClient() {
  const [state, setState] = useState<AssessmentState>(emptyAssessmentState)
  const [hydrated, setHydrated] = useState(false)
  const [lead, setLead] = useState<LeadData | null>(null)
  const [winnerCode, setWinnerCode] = useState<string | null>(null)
  const resultsViewedFired = useRef(false)

  // This route now has its own front door.
  //
  // FoundationChooser sets `foundationType` BEFORE it navigates here, so
  // until Phase 2A every arrival had been through it. The default You CTAs
  // now link straight to /assessment/you, and without this the journey would
  // keep whatever foundation was last chosen: resolvedFoundation() reads the
  // stored intent first, so someone who once completed Family and then takes
  // You directly would still resolve to `family` — a value that reaches
  // personal-report-cta.tsx and /api/checkout.
  //
  // Declaring it here mirrors exactly what the chooser does, which makes the
  // two entry paths equivalent rather than making one of them a special
  // case. Idempotent, and it does not touch pendingAddon or selectedAddon.
  useEffect(() => {
    patchJourney({ foundationType: "you" })
  }, [])

  // Load saved state from localStorage after hydration
  useEffect(() => {
    const saved = loadAssessment()
    // Restore results if the user has completed the assessment — they should
    // always be able to see their score on return without retaking.
    // Privacy state also restores so they can confirm and land on results.
    const initialState = saved
    setState(initialState)
    setLead(loadLeadData())
    setHydrated(true)
  }, [])

  // Persist on every state change, but only after hydration
  useEffect(() => {
    if (hydrated) saveAssessment(state)
  }, [state, hydrated])

  /* Where the customer is in the journey, and nothing about their answers.
   *
   * Deliberately only the question index and the Biotic: no answer values,
   * no scores, no free text. Which option someone picked about their
   * digestion is health-derived data, and an analytics provider is not
   * where it belongs.
   *
   * Uses the posthog.capture already in this file, so it inherits the same
   * consent gating as assessment_started rather than opening a second path.
   * No beforeunload / pagehide abandonment event — those fire unreliably and
   * would be a worse signal than none. */
  useEffect(() => {
    if (!hydrated || state.view !== "questions") return
    const question = QUESTIONS[state.currentIndex]
    if (!question) return
    const biotic = bioticOf(question.sectionTitle)
    const opens = startsBiotic(QUESTIONS, state.currentIndex)

    if (opens) {
      posthog.capture("assessment_section_entered", { biotic: opens })
    }
    posthog.capture("assessment_question_viewed", {
      question_index: state.currentIndex + 1,
      question_total: QUESTIONS.length,
      biotic,
    })
  }, [hydrated, state.view, state.currentIndex])

  // Fire results_viewed once when the results screen becomes visible
  useEffect(() => {
    if (state.view === "results" && state.result && !resultsViewedFired.current) {
      resultsViewedFired.current = true
      posthog.capture("results_viewed", {
        overall_score: state.result.overall,
        profile_type: state.result.profile.type,
      })
    }
  }, [state.view, state.result])

  function startAssessment(leadData: LeadData) {
    // PostHog: assessment started
    posthog.capture("assessment_started", {
      name: leadData.name,
      has_email: !!leadData.email,
    })

    // Persist lead
    saveLeadData(leadData)
    setLead(leadData)

    // Store lead in Supabase — capture winner response for lottery
    fetch("/api/submit-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData),
    })
      .then((r) => r.json())
      .then((d: { ok?: boolean; winner?: boolean; promoCode?: string }) => {
        if (d.winner && d.promoCode) setWinnerCode(d.promoCode)
      })
      .catch(() => {/* ignore network errors */})

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

      // PostHog: assessment completed + identify user by email
      posthog.capture("assessment_completed", {
        overall_score: computed.overall,
        profile_type: computed.profile.type,
        sub_scores: computed.subScores,
      })
      // Statsig: assessment_completed
      logEvent("assessment_completed", computed.overall, {
        profile_type: computed.profile.type,
      })
      const currentLead0 = lead ?? loadLeadData()
      if (currentLead0?.email) {
        posthog.identify(currentLead0.email, {
          email: currentLead0.email,
          name: currentLead0.name,
          profile_type: computed.profile.type,
        })
      }

      // Fire-and-forget: email the score report now (like Family/Mind). The
      // sign-in (magic) link is sent + status-tracked by SaveResultsCard.
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
          sectionOpens={startsBiotic(QUESTIONS, state.currentIndex)}
          position={state.currentIndex + 1}
          total={QUESTIONS.length}
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

  return <AssessmentResults result={state.result} onRetake={handleRetake} leadEmail={lead?.email} winnerCode={winnerCode ?? undefined} />
}
