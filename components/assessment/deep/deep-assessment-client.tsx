"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { DeepQuestion, DeepAnswer, DeepAnswers, DeepSection } from "@/lib/deep-assessment"
import { DeepQuestionView } from "./deep-question"

interface DeepAssessmentClientProps {
  sessionId: string
  tier: "starter" | "full" | "premium"
  freeScores: {
    overall: number
    subScores: { diversity: number; feeding: number; adding: number; consistency: number; feeling: number }
    profile: { type: string; tagline: string; description: string; color: string }
  }
  savedQuestions?: DeepQuestion[] | null
  savedAnswers?: DeepAnswers | null
}

type View = "loading" | "questions" | "submitting" | "error"

const PILLAR_GRADIENT: Record<string, string> = {
  diversity: "var(--icon-lime)",
  feeding: "var(--icon-green)",
  adding: "var(--icon-teal)",
  consistency: "var(--icon-yellow)",
  feeling: "var(--icon-orange)",
  lifestyle: "var(--icon-teal)",
}

const SECTION_META: Record<DeepSection, { icon: string; label: string; desc: string; color: string }> = {
  symptoms:  { icon: "🫁", label: "Your Symptoms",    desc: "How your gut is communicating with you right now",  color: "var(--icon-orange)" },
  history:   { icon: "📋", label: "Your Gut History",  desc: "Events and patterns that shaped your microbiome",   color: "var(--icon-teal)" },
  lifestyle: { icon: "🌙", label: "Your Lifestyle",    desc: "Daily habits that directly affect your gut",        color: "var(--icon-yellow)" },
  goals:     { icon: "🎯", label: "Your Goals",        desc: "What success looks like for you in 3 months",       color: "var(--icon-green)" },
}

const STAGES = [
  "Reviewing your responses…",
  "Building your personalised profile…",
  "Generating your PDF report…",
]

export function DeepAssessmentClient({
  sessionId,
  tier,
  freeScores,
  savedQuestions,
  savedAnswers,
}: DeepAssessmentClientProps) {
  const router = useRouter()
  const [view, setView] = useState<View>("loading")
  const [questions, setQuestions] = useState<DeepQuestion[]>([])
  const [answers, setAnswers] = useState<DeepAnswers>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitStage, setSubmitStage] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")

  const loadQuestions = useCallback(async () => {
    // If we have saved questions, resume from where we left off
    if (savedQuestions && savedQuestions.length > 0) {
      const restoredAnswers = savedAnswers ?? {}
      setQuestions(savedQuestions)
      setAnswers(restoredAnswers)
      const firstUnanswered = savedQuestions.findIndex((q) => !(restoredAnswers)[q.id])
      setCurrentIndex(Math.max(0, firstUnanswered === -1 ? savedQuestions.length - 1 : firstUnanswered))
      setView("questions")
      return
    }

    // Otherwise generate fresh questions
    try {
      const res = await fetch("/api/generate-deep-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          tier,
          overall: freeScores.overall,
          subScores: freeScores.subScores,
          profile: freeScores.profile,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.questions) throw new Error("Failed to generate questions")
      setQuestions(data.questions)
      setView("questions")
    } catch {
      setErrorMessage("We couldn't generate your questions. Please try again.")
      setView("error")
    }
  }, [sessionId, tier, freeScores, savedQuestions, savedAnswers])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const isDemoMode = sessionId.startsWith("demo-")

  function handleAnswer(id: string, value: DeepAnswer) {
    const updated = { ...answers, [id]: value }
    setAnswers(updated)
    // Auto-save fire and forget — skip in demo mode to avoid noisy Supabase errors
    if (!isDemoMode) {
      fetch("/api/save-deep-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers: updated }),
      }).catch(() => {/* ignore */})
    }
  }

  async function handleSubmit() {
    setView("submitting")
    setSubmitStage(0)
    setTimeout(() => setSubmitStage(1), 3000)
    setTimeout(() => setSubmitStage(2), 8000)

    // Demo mode: skip real submission, redirect to static demo report
    if (isDemoMode) {
      const demoTier = sessionId.replace("demo-", "") as "starter" | "full" | "premium"
      // Still generate real Claude questions/analysis for the demo — just skip Stripe/PDF/email
      try {
        const res = await fetch("/api/submit-deep-assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, questions, answers }),
        })
        if (!res.ok) throw new Error("failed")
        router.push(`/assessment/report?session_id=${sessionId}`)
      } catch {
        // Fallback: redirect to static demo report
        router.push(`/assessment/demo?tier=${demoTier}`)
      }
      return
    }

    try {
      const res = await fetch("/api/submit-deep-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questions, answers }),
      })
      if (!res.ok) throw new Error("Report generation failed")
      router.push(`/assessment/report?session_id=${sessionId}`)
    } catch {
      setErrorMessage("Report generation failed. Please try again.")
      setView("error")
    }
  }

  function handleNext() {
    const q = questions[currentIndex]
    const currentAnswer = answers[q?.id]

    // Inject follow-up question if condition matches
    if (q?.followUp && currentAnswer === q.followUp.condition) {
      const newQuestions = [...questions]
      newQuestions.splice(currentIndex + 1, 0, q.followUp.question)
      setQuestions(newQuestions)
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  function handleRetry() {
    setView("loading")
    loadQuestions()
  }

  /* ── Loading ────────────────────────────────────────────────────── */
  if (view === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--icon-green)] border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground">Personalising your assessment…</p>
        </div>
      </div>
    )
  }

  /* ── Error ──────────────────────────────────────────────────────── */
  if (view === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm space-y-4 px-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground text-sm">{errorMessage}</p>
          <button
            onClick={handleRetry}
            className="brand-gradient text-white font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  /* ── Submitting ─────────────────────────────────────────────────── */
  if (view === "submitting") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm space-y-6 px-4">
          <div className="relative mx-auto w-20 h-20">
            <div className="w-20 h-20 rounded-full border-4 border-[var(--icon-green)]/20" />
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-[var(--icon-green)] border-t-transparent animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Analysing your food system…</h2>
            <p className="text-muted-foreground text-sm transition-all duration-500">
              {STAGES[submitStage]}
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            {STAGES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
                  i <= submitStage ? "bg-[var(--icon-green)]" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Questions ──────────────────────────────────────────────────── */
  const currentQuestion = questions[currentIndex]
  if (!currentQuestion) return null

  // Section progress
  const uniqueSections = Array.from(
    new Set(questions.map((q) => q.section).filter((s): s is DeepSection => !!s))
  )
  const currentSection = currentQuestion.section
  const sectionMeta = currentSection ? SECTION_META[currentSection] : null
  const sectionIndex = currentSection ? uniqueSections.indexOf(currentSection) : -1
  const totalSections = uniqueSections.length || 1

  // Show section banner on first question of each new section
  const prevSection = currentIndex > 0 ? questions[currentIndex - 1]?.section : undefined
  const isNewSection = currentSection && currentSection !== prevSection

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          {sectionMeta ? (
            <span className="text-xs font-bold uppercase tracking-widest shrink-0" style={{ color: sectionMeta.color }}>
              {sectionMeta.label}
            </span>
          ) : (
            <span className="text-sm font-medium text-muted-foreground shrink-0">Your Consultation</span>
          )}
          <div className="flex-1 bg-border/40 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
                background: sectionMeta?.color ?? PILLAR_GRADIENT[currentQuestion.pillar ?? "lifestyle"],
              }}
            />
          </div>
          <span className="text-sm text-muted-foreground shrink-0">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Section step dots */}
        {totalSections > 1 && (
          <div className="max-w-2xl mx-auto px-4 pb-2.5 flex items-center gap-1.5 overflow-x-auto">
            {uniqueSections.map((s, i) => {
              const meta = SECTION_META[s]
              const done = i < sectionIndex
              const active = i === sectionIndex
              return (
                <div key={s} className="flex items-center gap-1.5 shrink-0">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-all duration-300"
                    style={{
                      background: active
                        ? meta.color
                        : done
                        ? `color-mix(in srgb, ${meta.color} 30%, transparent)`
                        : "var(--border)",
                      color: active ? "white" : done ? meta.color : "var(--muted-foreground)",
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span
                    className="text-[10px] font-medium hidden sm:inline"
                    style={{ color: active ? meta.color : "var(--muted-foreground)", opacity: active ? 1 : 0.6 }}
                  >
                    {meta.label}
                  </span>
                  {i < uniqueSections.length - 1 && (
                    <div className="h-px w-4 bg-border/60 mx-0.5" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Section transition banner */}
      {isNewSection && sectionMeta && (
        <div
          className="border-b py-4"
          style={{ background: `color-mix(in srgb, ${sectionMeta.color} 6%, transparent)` }}
        >
          <div className="max-w-2xl mx-auto px-4 flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
              style={{ background: `color-mix(in srgb, ${sectionMeta.color} 15%, transparent)` }}
            >
              {sectionMeta.icon}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: sectionMeta.color }}>
                Section {sectionIndex + 1} of {totalSections}
              </p>
              <p className="text-sm font-semibold text-foreground">{sectionMeta.label}</p>
              <p className="text-xs text-muted-foreground">{sectionMeta.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile context strip */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
          <span>Based on your</span>
          <span className="font-medium" style={{ color: freeScores.profile.color }}>
            {freeScores.profile.type}
          </span>
          <span>score of</span>
          <span className="font-semibold">{freeScores.overall}/100</span>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <DeepQuestionView
          key={currentQuestion.id}
          question={currentQuestion}
          answer={answers[currentQuestion.id]}
          onAnswer={handleAnswer}
          onNext={handleNext}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
        />
      </div>
    </div>
  )
}
