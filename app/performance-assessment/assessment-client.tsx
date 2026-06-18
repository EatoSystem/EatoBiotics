"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Zap,
  Dumbbell,
  RefreshCw,
  Shield,
  ArrowUpRight,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  Activity,
  Heart,
  Target,
  RotateCcw,
} from "lucide-react"
import { ScoreRing } from "@/components/assessment/score-ring"
import { PERFORMANCE_DISCLAIMER } from "@/lib/assessment-disclaimers"
import {
  PERFORMANCE_QUESTIONS as QUESTIONS,
  PERFORMANCE_PILLARS,
  PERFORMANCE_CONTEXT_QUESTIONS,
  type PerformancePillarKey as PillarKey,
  type PerformanceContext,
} from "@/lib/performance-assessment-data"
import {
  computePerformanceResult,
  type PerformanceResult,
} from "@/lib/performance-assessment-scoring"

/* ─────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────── */
const SPORTS_GRADIENT = "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))"
const LS_KEY = "performance-assessment"

/* Icons per pillar (UI-only; data lives in PERFORMANCE_PILLARS). */
const PILLAR_ICON: Record<PillarKey, React.ElementType> = {
  energy: Zap,
  build: Dumbbell,
  recovery: RefreshCw,
  protection: Shield,
}

/* ─────────────────────────────────────────────────
   SPORTS & LEVELS DATA (intro selectors)
───────────────────────────────────────────────── */
const SPORTS = [
  { label: "Football / Soccer", value: "football", icon: Zap },
  { label: "Rugby", value: "rugby", icon: Shield },
  { label: "Running / Endurance", value: "endurance", icon: Activity },
  { label: "Cycling", value: "cycling", icon: RefreshCw },
  { label: "Swimming", value: "swimming", icon: Activity },
  { label: "CrossFit / Strength", value: "strength", icon: Dumbbell },
  { label: "GAA / Gaelic Games", value: "gaa", icon: Shield },
  { label: "Basketball", value: "basketball", icon: Zap },
  { label: "Tennis / Racket Sports", value: "racket", icon: Target },
  { label: "General Fitness", value: "general", icon: Heart },
]

const LEVELS = [
  { label: "Elite", value: "elite", description: "Full-time athlete, competing at the highest level" },
  { label: "Competitive", value: "competitive", description: "Train 4–6×/week, compete regularly" },
  { label: "Recreational", value: "recreational", description: "Train 3–4×/week, occasional competition" },
  { label: "Beginner", value: "beginner", description: "New to structured training" },
]

const PILLAR_META = PERFORMANCE_PILLARS

type SportsResult = PerformanceResult

/* ─────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────── */
interface AssessmentState {
  view: "intro" | "questions" | "context" | "results"
  /** sport machine value (context) */
  sport: string
  /** human label for the chosen sport (display) */
  sportLabel: string
  /** level machine value (context) */
  level: string
  /** human label for the chosen level (display) */
  levelLabel: string
  name: string
  email: string
  currentIndex: number
  answers: Record<string, number>
  /** remaining non-scored context answers (training freq, duration, goal) */
  context: PerformanceContext
  result: SportsResult | null
}

function emptyState(): AssessmentState {
  return {
    view: "intro",
    sport: "",
    sportLabel: "",
    level: "",
    levelLabel: "",
    name: "",
    email: "",
    currentIndex: 0,
    answers: {},
    context: {},
    result: null,
  }
}

function loadState(): AssessmentState {
  if (typeof window === "undefined") return emptyState()
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<AssessmentState>
    const merged = { ...emptyState(), ...parsed }
    // Reset terminal states on fresh load
    if (merged.view === "results") {
      return { ...merged, view: "intro", result: null, answers: {}, currentIndex: 0, context: {} }
    }
    return merged
  } catch {
    return emptyState()
  }
}

function saveState(state: AssessmentState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

/* ─────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────── */
export function SportsAssessmentClient() {
  const [state, setState] = useState<AssessmentState>(emptyState)
  const [hydrated, setHydrated] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  useEffect(() => {
    setState(loadState())
    setHydrated(true)
  }, [])

  const update = useCallback((patch: Partial<AssessmentState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      saveState(next)
      return next
    })
  }, [])

  // Auto-advance on single select
  const handleAnswer = useCallback((questionId: string, value: number) => {
    setSelectedOption(value)
    setTimeout(() => {
      const nextAnswers = { ...state.answers, [questionId]: value }
      const nextIndex = state.currentIndex + 1
      if (nextIndex >= QUESTIONS.length) {
        // After the scored questions, capture context before scoring.
        update({ answers: nextAnswers, view: "context", currentIndex: nextIndex })
      } else {
        update({ answers: nextAnswers, currentIndex: nextIndex })
      }
      setSelectedOption(null)
    }, 350)
  }, [state.answers, state.currentIndex, update])

  // Context answers shape recommendations only — never the scores.
  const handleContextComplete = useCallback(
    (extraContext: PerformanceContext) => {
      const context: PerformanceContext = {
        ...state.context,
        ...extraContext,
        sport: state.sport || extraContext.sport,
        level: state.level || extraContext.level,
      }
      const result = computePerformanceResult(state.answers, context)
      update({ context, result, view: "results" })
    },
    [state.answers, state.context, state.sport, state.level, update],
  )

  const handleBack = useCallback(() => {
    if (state.currentIndex === 0) {
      update({ view: "intro" })
    } else {
      update({ currentIndex: state.currentIndex - 1 })
    }
  }, [state.currentIndex, update])

  const handleReset = useCallback(() => {
    const fresh = emptyState()
    saveState(fresh)
    setState(fresh)
    setSelectedOption(null)
  }, [])

  if (!hydrated) return null

  if (state.view === "intro") {
    return <SportsIntro state={state} update={update} />
  }

  if (state.view === "questions") {
    const q = QUESTIONS[state.currentIndex]
    const meta = PILLAR_META[q.pillar]
    return (
      <div className="min-h-screen bg-background">
        {/* Progress bar */}
        <div className="sticky top-[57px] z-40 bg-background/95 backdrop-blur-sm">
          <div className="relative h-1 w-full bg-border/40">
            <div
              className="absolute inset-y-0 left-0 rounded-r-full transition-all duration-500 ease-out"
              style={{ width: `${((state.currentIndex + 1) / QUESTIONS.length) * 100}%`, background: SPORTS_GRADIENT }}
            />
          </div>
          <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
            <span className="text-xs text-muted-foreground">
              {state.currentIndex + 1} <span className="opacity-50">of {QUESTIONS.length}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
              <span className="text-xs font-medium text-muted-foreground">{meta.system} — {meta.label}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round(((state.currentIndex + 1) / QUESTIONS.length) * 100)}%
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="mx-auto max-w-2xl px-6 py-16">
          {/* Back */}
          <button
            onClick={handleBack}
            className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {/* Pillar label */}
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: meta.color }}>
            {meta.system} — {meta.label}
          </p>

          {/* Question text */}
          <h2 className="mt-3 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            {q.text}
          </h2>

          {/* Options */}
          <div className="mt-8 space-y-3">
            {q.options.map((opt) => {
              const isSelected = selectedOption === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(q.id, opt.value)}
                  disabled={selectedOption !== null}
                  className="group w-full rounded-2xl border-2 p-5 text-left transition-all duration-200 hover:shadow-md disabled:opacity-60"
                  style={{
                    borderColor: isSelected ? meta.color : "var(--border)",
                    background: isSelected ? `color-mix(in srgb, ${meta.color} 8%, var(--background))` : "var(--background)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{opt.label}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{opt.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={20} className="mt-0.5 shrink-0" style={{ color: meta.color }} />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (state.view === "context") {
    return <ContextStep onComplete={handleContextComplete} onBack={() => update({ view: "questions", currentIndex: QUESTIONS.length - 1 })} />
  }

  if (state.view === "results" && state.result) {
    return <SportsResults state={state} onReset={handleReset} />
  }

  return null
}

/* ─────────────────────────────────────────────────
   CONTEXT STEP (non-scored — shapes recommendations only)
───────────────────────────────────────────────── */
function ContextStep({
  onComplete,
  onBack,
}: {
  onComplete: (ctx: PerformanceContext) => void
  onBack: () => void
}) {
  // We capture the remaining context questions here (training freq, session
  // duration, main goal). Sport + level are already captured on the intro.
  const questions = PERFORMANCE_CONTEXT_QUESTIONS.filter(
    (q) => q.id === "trainingFrequency" || q.id === "sessionDuration" || q.id === "mainGoal",
  )
  const [answers, setAnswers] = useState<PerformanceContext>({})

  const allAnswered = questions.every((q) => answers[q.id])

  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto max-w-2xl px-6 py-16">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">
          A little context
        </p>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Tell us how you train
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          This tailors your recommendations — it does not change your scores.
        </p>

        <div className="mt-10 space-y-10">
          {questions.map((q) => (
            <div key={q.id}>
              <p className="font-medium text-foreground">{q.text}</p>
              {q.helper && <p className="mt-1 text-sm text-muted-foreground">{q.helper}</p>}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.value }))}
                      className="rounded-xl border-2 px-4 py-3 text-left text-sm transition-all"
                      style={{
                        borderColor: isSelected ? "var(--icon-orange)" : "var(--border)",
                        background: isSelected
                          ? "color-mix(in srgb, var(--icon-orange) 8%, var(--background))"
                          : "var(--background)",
                      }}
                    >
                      <p className="font-semibold text-foreground">{opt.label}</p>
                      {opt.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onComplete(answers)}
          disabled={!allAnswered}
          className="mt-12 flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: allAnswered ? SPORTS_GRADIENT : "var(--muted)" }}
        >
          See My Results
          <ChevronRight size={16} />
        </button>
      </section>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   INTRO COMPONENT
───────────────────────────────────────────────── */
function SportsIntro({ state, update }: { state: AssessmentState; update: (p: Partial<AssessmentState>) => void }) {
  const [form, setForm] = useState({ name: state.name, email: state.email })
  const [error, setError] = useState("")

  const canStart = form.name.trim() && form.email.trim() && state.sport && state.level

  function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!canStart) { setError("Please complete all fields above to continue."); return }
    update({
      name: form.name.trim(),
      email: form.email.trim(),
      view: "questions",
      currentIndex: 0,
      answers: {},
      context: { sport: state.sport, level: state.level },
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 md:py-32">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-10 blur-3xl"
            style={{ background: "var(--icon-orange)" }}
          />
          <div
            className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full opacity-8 blur-3xl"
            style={{ background: "var(--icon-yellow)" }}
          />
        </div>

        <div className="relative mx-auto max-w-[780px] text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">
            EatoBiotics Performance
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl text-balance">
            Build a food system
            <br />
            <span className="brand-gradient-text">that performs.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            12 questions. Your sport, your level. A personalised performance food profile built
            around the 4 Systems of Performance — Energy, Build, Recovery, and Protection.
          </p>

          {/* System pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              { label: "Energy", color: "var(--icon-lime)" },
              { label: "Build", color: "var(--icon-teal)" },
              { label: "Recovery", color: "var(--icon-yellow)" },
              { label: "Protection", color: "var(--icon-orange)" },
            ].map((s) => (
              <span
                key={s.label}
                className="rounded-full border px-3 py-1 text-xs font-semibold"
                style={{ borderColor: s.color, color: s.color }}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Form section */}
      <section className="px-6 pb-24">
        <form onSubmit={handleStart} className="mx-auto max-w-[680px] space-y-10">

          {/* Name + Email */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">Your Details</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your first name"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-icon-orange focus:outline-none focus:ring-2 focus:ring-icon-orange/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-icon-orange focus:outline-none focus:ring-2 focus:ring-icon-orange/20"
                />
              </div>
            </div>
          </div>

          {/* Sport selector */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">Your Sport</p>
            <p className="mt-1 text-sm text-muted-foreground">Select the sport you&apos;re building your food system for.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SPORTS.map((s) => {
                const isSelected = state.sport === s.value
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => update({ sport: s.value, sportLabel: s.label })}
                    className="flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all"
                    style={{
                      borderColor: isSelected ? "var(--icon-orange)" : "var(--border)",
                      background: isSelected ? "color-mix(in srgb, var(--icon-orange) 8%, var(--background))" : "var(--background)",
                      color: isSelected ? "var(--icon-orange)" : "var(--foreground)",
                    }}
                  >
                    <s.icon size={15} style={{ color: isSelected ? "var(--icon-orange)" : "var(--muted-foreground)", flexShrink: 0 }} />
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Level selector */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">Your Level</p>
            <p className="mt-1 text-sm text-muted-foreground">How would you describe your training and competition commitment?</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {LEVELS.map((l) => {
                const isSelected = state.level === l.value
                return (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => update({ level: l.value, levelLabel: l.label })}
                    className="rounded-xl border-2 px-5 py-4 text-left transition-all"
                    style={{
                      borderColor: isSelected ? "var(--icon-orange)" : "var(--border)",
                      background: isSelected ? "color-mix(in srgb, var(--icon-orange) 8%, var(--background))" : "var(--background)",
                    }}
                  >
                    <p className="font-semibold text-foreground">{l.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{l.description}</p>
                    {isSelected && (
                      <div className="mt-2 flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--icon-orange)" }}>
                        <CheckCircle2 size={12} />
                        Selected
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canStart}
            className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: canStart ? SPORTS_GRADIENT : "var(--muted)" }}
          >
            Start My Assessment
            <ChevronRight size={16} />
          </button>

          <p className="text-center text-xs text-muted-foreground">
            12 questions · Takes about 3 minutes · Your data is private
          </p>
        </form>
      </section>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   RESULTS COMPONENT
───────────────────────────────────────────────── */
function SportsResults({ state, onReset }: { state: AssessmentState; result?: SportsResult; onReset: () => void }) {
  const result = state.result!
  const pillars: PillarKey[] = ["energy", "build", "recovery", "protection"]

  // Top 3 actions from weakest pillars (context-tailored text via nextActions)
  const actions = result.nextActions.map((a) => ({
    pillar: a.pillar,
    action: a.text,
    meta: PILLAR_META[a.pillar],
    icon: PILLAR_ICON[a.pillar],
  }))

  // Performance foods (one per system)
  const performanceFoods = [
    { system: "Energy", foods: ["Oats", "Brown rice", "Sweet potato", "Bananas"], color: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" },
    { system: "Build", foods: ["Eggs", "Salmon", "Greek yogurt", "Lentils"], color: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" },
    { system: "Recovery", foods: ["Berries", "Broccoli", "Tart cherries", "Oily fish"], color: "var(--icon-yellow)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" },
    { system: "Protection", foods: ["Kefir", "Kimchi", "Almonds", "Dark chocolate"], color: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-foreground px-6 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-20 h-96 w-96 rounded-full opacity-15 blur-3xl" style={{ background: "var(--icon-orange)" }} />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-10 blur-3xl" style={{ background: "var(--icon-yellow)" }} />
        </div>

        <div className="relative mx-auto max-w-[1100px]">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">

            {/* Score ring */}
            <div className="shrink-0">
              <ScoreRing
                score={result.overall}
                color={result.profileColor}
                gradientId="sports-score-ring"
                profileType={result.profile}
                textColor="white"
              />
            </div>

            {/* Profile info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
                  style={{ background: SPORTS_GRADIENT }}
                >
                  {state.sportLabel || state.sport}
                </span>
                <span className="rounded-full border border-background/20 px-3 py-1 text-xs font-semibold text-background/70">
                  {state.levelLabel || state.level}
                </span>
              </div>
              <h1 className="mt-4 font-serif text-3xl font-semibold text-background sm:text-4xl md:text-5xl">
                {result.profile}
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-background/70">
                {result.overall >= 75
                  ? "Your food system is performing. These results show a disciplined, intentional approach to fuelling your sport."
                  : result.overall >= 58
                  ? "Strong foundations are in place. Targeted refinements across your weakest systems will unlock a meaningful performance advantage."
                  : result.overall >= 42
                  ? "Good intent, but gaps in key performance areas are likely limiting your output, recovery, or availability."
                  : "Your food system is not yet keeping pace with your training demands. The good news — the gains from improvement are significant and fast."}
              </p>

              {/* 4 mini pillar bars */}
              <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3">
                {pillars.map((k) => {
                  const meta = PILLAR_META[k]
                  const score = result.subScores[k]
                  return (
                    <div key={k}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-background/60">{meta.label}</span>
                        <span className="text-xs font-bold" style={{ color: meta.color }}>{score}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/10">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${score}%`, background: meta.gradient }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 Systems Breakdown ── */}
      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">Your Performance Profile</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            The 4 Systems — <span className="brand-gradient-text">your breakdown</span>
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {result.insights.map((insight) => {
              const meta = PILLAR_META[insight.key]
              const Icon = PILLAR_ICON[insight.key]
              return (
                <div
                  key={insight.key}
                  className="relative overflow-hidden rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-md"
                >
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: meta.gradient }} />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `color-mix(in srgb, ${meta.color} 12%, transparent)` }}
                      >
                        <Icon size={18} style={{ color: meta.color }} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: meta.color }}>{meta.system}</p>
                        <p className="font-serif font-semibold text-foreground">{meta.label}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-serif text-3xl font-bold" style={{ color: meta.color }}>{insight.score}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${insight.score}%`, background: meta.gradient }}
                    />
                  </div>

                  {/* Strength/opportunity tag */}
                  <div className="mt-4 flex items-start gap-2">
                    {insight.isStrength ? (
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-icon-lime" />
                    ) : (
                      <TrendingUp size={14} className="mt-0.5 shrink-0 text-icon-orange" />
                    )}
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {insight.isStrength ? meta.strengthCopy : meta.opportunityCopy}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Top 3 Actions ── */}
      <section className="bg-secondary/40 px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[780px]">
          <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">Your Next Steps</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            3 actions to move the needle
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Based on your weakest systems — small, consistent changes that compound over a season.
          </p>

          <div className="mt-10 space-y-5">
            {actions.map((a, i) => {
              const Icon = a.icon
              return (
                <div key={a.pillar} className="flex gap-5 rounded-2xl border border-border bg-background p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif text-lg font-bold text-white" style={{ background: a.meta.gradient }}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon size={14} style={{ color: a.meta.color }} />
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: a.meta.color }}>
                        {a.meta.system} — {a.meta.label}
                      </p>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">{a.action}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Performance Plate Foods ── */}
      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">Your Performance Plate</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            Foods to start with this week
          </h2>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            One priority food per system. Build your plate around these and you&apos;re already ahead of most athletes.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {performanceFoods.map((f) => (
              <div
                key={f.system}
                className="relative overflow-hidden rounded-2xl border border-border bg-background p-6"
              >
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: f.gradient }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: f.color }}>{f.system}</p>
                <div className="mt-4 space-y-2">
                  {f.foods.map((food) => (
                    <div key={food} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="h-1 w-1 rounded-full" style={{ background: f.color }} />
                      {food}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTAs ── */}
      <section className="bg-secondary/40 px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[780px] text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">EatoBiotics Performance</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            Now understand <span className="brand-gradient-text">the full framework</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
            Your results map to the 4 Systems of Performance. Explore the EatoBiotics Performance framework to understand the science behind every score.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/performance"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: SPORTS_GRADIENT }}
            >
              Explore Performance
              <ArrowUpRight size={14} />
            </Link>
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-full border-2 border-border px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-foreground"
            >
              <RotateCcw size={14} />
              Retake Assessment
            </button>
          </div>

          {/* Mandatory non-diagnostic disclaimer */}
          <p className="mx-auto mt-10 max-w-lg text-xs leading-relaxed text-muted-foreground">
            {PERFORMANCE_DISCLAIMER}
          </p>
        </div>
      </section>
    </div>
  )
}
