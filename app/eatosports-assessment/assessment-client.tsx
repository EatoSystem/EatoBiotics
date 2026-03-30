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

/* ─────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────── */
const SPORTS_GRADIENT = "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))"
const LS_KEY = "eatosports-assessment"

/* ─────────────────────────────────────────────────
   SPORTS & LEVELS DATA
───────────────────────────────────────────────── */
const SPORTS = [
  { label: "Football / Soccer", icon: Zap },
  { label: "Rugby", icon: Shield },
  { label: "Running / Endurance", icon: Activity },
  { label: "Cycling", icon: RefreshCw },
  { label: "Swimming", icon: Activity },
  { label: "CrossFit / Strength", icon: Dumbbell },
  { label: "GAA / Gaelic Games", icon: Shield },
  { label: "Basketball", icon: Zap },
  { label: "Tennis / Racket Sports", icon: Target },
  { label: "General Fitness", icon: Heart },
]

const LEVELS = [
  { label: "Professional / Elite", description: "Full-time athlete, competing at the highest level" },
  { label: "Competitive Amateur", description: "Train 4–6×/week, compete regularly" },
  { label: "Active Amateur", description: "Train 3–4×/week, occasional competition" },
  { label: "Recreational", description: "Fitness-focused, train when you can" },
]

/* ─────────────────────────────────────────────────
   PILLAR METADATA
───────────────────────────────────────────────── */
type PillarKey = "energy" | "build" | "recovery" | "protection"

const PILLAR_META: Record<PillarKey, {
  label: string
  system: string
  icon: React.ElementType
  color: string
  gradient: string
  strengthCopy: string
  opportunityCopy: string
  actionLow: string
  actionHigh: string
}> = {
  energy: {
    label: "Energy",
    system: "FUEL",
    icon: Zap,
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    strengthCopy: "Your pre-training fuelling and carbohydrate strategy is working.",
    opportunityCopy: "Gaps in your fuelling strategy are limiting output and consistency.",
    actionLow: "Start with a planned pre-training meal — oats, banana, or rice 1–2 hours before. Track your energy levels for one week.",
    actionHigh: "Maintain your fuelling rhythm. Experiment with intra-session fuel (banana, rice cakes) for sessions over 90 minutes.",
  },
  build: {
    label: "Build",
    system: "DEVELOP",
    icon: Dumbbell,
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    strengthCopy: "Your protein timing and variety are supporting muscle repair and development.",
    opportunityCopy: "Post-training protein gaps are slowing your adaptation and recovery.",
    actionLow: "Prioritise protein within 30–60 minutes of training. Eggs, Greek yogurt, salmon, or legumes — any quality source counts.",
    actionHigh: "Add a second protein-rich meal mid-day. Diversify your sources to include plant proteins (lentils, tofu) alongside animal proteins.",
  },
  recovery: {
    label: "Recovery",
    system: "RESET",
    icon: RefreshCw,
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    strengthCopy: "Your recovery nutrition is helping you bounce back quickly and stay consistent.",
    opportunityCopy: "Slow recovery between sessions suggests your reset nutrition needs attention.",
    actionLow: "Add anti-inflammatory foods this week — berries with breakfast, oily fish twice, and greens at dinner. Notice any change in how you feel between sessions.",
    actionHigh: "Plan your rest-day nutrition deliberately. Prioritise colour, omega-3s, and hydration even when training load is low.",
  },
  protection: {
    label: "Protection",
    system: "PROTECT",
    icon: Shield,
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    strengthCopy: "Your food system health and immune resilience are keeping you available and consistent.",
    opportunityCopy: "Gaps in gut support are increasing your vulnerability to illness, fatigue, and GI discomfort.",
    actionLow: "Add one fermented food daily — Greek yogurt at breakfast is the easiest start. Your gut microbiome responds quickly to consistent input.",
    actionHigh: "Build variety into your probiotic sources — rotate between yogurt, kefir, kimchi, and sauerkraut across the week.",
  },
}

/* ─────────────────────────────────────────────────
   QUESTIONS
───────────────────────────────────────────────── */
interface AnswerOption {
  label: string
  description: string
  value: number
}

interface Question {
  id: string
  pillar: PillarKey
  text: string
  options: AnswerOption[]
}

const QUESTIONS: Question[] = [
  // ── Energy ──────────────────────────────────
  {
    id: "e1",
    pillar: "energy",
    text: "Before a training session or competition, how consistently do you fuel your body?",
    options: [
      { label: "Always", description: "I eat a planned meal or snack 1–3 hours before", value: 3 },
      { label: "Usually", description: "Most of the time, but not always structured", value: 2 },
      { label: "Sometimes", description: "I eat when I remember or have time", value: 1 },
      { label: "Rarely", description: "I often train fasted or with no plan", value: 0 },
    ],
  },
  {
    id: "e2",
    pillar: "energy",
    text: "How often do complex carbohydrates (oats, rice, sweet potato, pasta) feature in your daily meals?",
    options: [
      { label: "Every day", description: "Deliberately — carbs are a foundation of my diet", value: 3 },
      { label: "Most days", description: "I eat them regularly but not every meal", value: 2 },
      { label: "A few times a week", description: "Inconsistent — depends on the day", value: 1 },
      { label: "Rarely", description: "I avoid carbs or don't think about them", value: 0 },
    ],
  },
  {
    id: "e3",
    pillar: "energy",
    text: "How does your energy hold up through a full training session, game, or competition?",
    options: [
      { label: "Strong throughout", description: "I rarely fade — energy is consistent", value: 3 },
      { label: "Mostly good", description: "Sometimes dips in the final third", value: 2 },
      { label: "Noticeable fatigue", description: "I struggle during longer or harder sessions", value: 1 },
      { label: "Crashes regularly", description: "My energy drops significantly during effort", value: 0 },
    ],
  },
  // ── Build ────────────────────────────────────
  {
    id: "b1",
    pillar: "build",
    text: "After training or competition, how consistently do you consume protein within 2 hours?",
    options: [
      { label: "Always", description: "It's a non-negotiable part of my routine", value: 3 },
      { label: "Usually", description: "I try, but don't always manage it", value: 2 },
      { label: "Sometimes", description: "Only if I'm hungry or it's convenient", value: 1 },
      { label: "Rarely", description: "I don't think about post-training nutrition", value: 0 },
    ],
  },
  {
    id: "b2",
    pillar: "build",
    text: "How varied are your protein sources across a typical week?",
    options: [
      { label: "Very varied", description: "Eggs, fish, meat, legumes, and dairy all feature", value: 3 },
      { label: "Reasonably varied", description: "3–4 different sources across the week", value: 2 },
      { label: "Limited", description: "I rely on 1–2 sources most of the time", value: 1 },
      { label: "Very limited", description: "I don't focus on protein diversity", value: 0 },
    ],
  },
  {
    id: "b3",
    pillar: "build",
    text: "Between training sessions, how intentional are you about supporting muscle repair through food?",
    options: [
      { label: "Very intentional", description: "I plan meals around recovery and rebuild", value: 3 },
      { label: "Somewhat", description: "I try when I remember to", value: 2 },
      { label: "Not very", description: "I eat normally without thinking about muscle repair", value: 1 },
      { label: "Not at all", description: "I hadn't considered this aspect", value: 0 },
    ],
  },
  // ── Recovery ─────────────────────────────────
  {
    id: "r1",
    pillar: "recovery",
    text: "How often do you include anti-inflammatory foods (berries, oily fish, leafy greens, turmeric) in your weekly meals?",
    options: [
      { label: "Daily", description: "They're a regular, intentional part of my plate", value: 3 },
      { label: "Several times a week", description: "I include them consistently but not daily", value: 2 },
      { label: "Occasionally", description: "Once or twice a week at most", value: 1 },
      { label: "Rarely or never", description: "I don't focus on these foods", value: 0 },
    ],
  },
  {
    id: "r2",
    pillar: "recovery",
    text: "After a hard training session or competition, how long before you feel fully ready to go again?",
    options: [
      { label: "24 hours or less", description: "I recover quickly and feel ready fast", value: 3 },
      { label: "24–48 hours", description: "Standard recovery — I'm ready by the next day", value: 2 },
      { label: "48–72 hours", description: "Recovery takes longer than I'd like", value: 1 },
      { label: "More than 72 hours", description: "Recovery is a persistent challenge for me", value: 0 },
    ],
  },
  {
    id: "r3",
    pillar: "recovery",
    text: "On rest days, how intentional are you about your nutrition?",
    options: [
      { label: "Very intentional", description: "I eat for recovery, not just convenience", value: 3 },
      { label: "Somewhat", description: "More relaxed, but I still eat reasonably well", value: 2 },
      { label: "Not really", description: "Rest days are when I eat whatever I want", value: 1 },
      { label: "Never considered it", description: "I hadn't thought about rest day nutrition", value: 0 },
    ],
  },
  // ── Protection ───────────────────────────────
  {
    id: "p1",
    pillar: "protection",
    text: "How often does illness, persistent fatigue, or injury interrupt your training?",
    options: [
      { label: "Rarely", description: "I stay available and consistent across seasons", value: 3 },
      { label: "Occasionally", description: "A few times per season", value: 2 },
      { label: "Regularly", description: "It's a pattern I've noticed over time", value: 1 },
      { label: "Frequently", description: "I struggle to string together consistent blocks", value: 0 },
    ],
  },
  {
    id: "p2",
    pillar: "protection",
    text: "How often do you include fermented or probiotic-rich foods (yogurt, kefir, kimchi, sauerkraut) in your diet?",
    options: [
      { label: "Daily", description: "A fermented food is part of my daily routine", value: 3 },
      { label: "Several times a week", description: "I include them regularly but not every day", value: 2 },
      { label: "Occasionally", description: "Now and then, without much intention", value: 1 },
      { label: "Rarely or never", description: "I don't typically eat fermented foods", value: 0 },
    ],
  },
  {
    id: "p3",
    pillar: "protection",
    text: "How does your gut feel during and after high-intensity training or competition?",
    options: [
      { label: "Great", description: "No GI issues at all — my gut is solid under pressure", value: 3 },
      { label: "Mostly fine", description: "Occasional discomfort but nothing major", value: 2 },
      { label: "Regular discomfort", description: "Bloating, cramps, or discomfort is common", value: 1 },
      { label: "Persistent problem", description: "GI issues are a significant challenge for me", value: 0 },
    ],
  },
]

/* ─────────────────────────────────────────────────
   SCORING
───────────────────────────────────────────────── */
interface SubScores {
  energy: number
  build: number
  recovery: number
  protection: number
}

interface PillarInsight {
  key: PillarKey
  score: number
  isStrength: boolean
}

interface SportsResult {
  subScores: SubScores
  overall: number
  profile: string
  profileColor: string
  insights: PillarInsight[]
  completedAt: number
}

function computeSubScores(answers: Record<string, number>): SubScores {
  const avg = (ids: string[]) => {
    const sum = ids.reduce((acc, id) => acc + (answers[id] ?? 0), 0)
    return Math.round((sum / (ids.length * 3)) * 100)
  }
  return {
    energy: avg(["e1", "e2", "e3"]),
    build: avg(["b1", "b2", "b3"]),
    recovery: avg(["r1", "r2", "r3"]),
    protection: avg(["p1", "p2", "p3"]),
  }
}

function getProfile(overall: number): { label: string; color: string } {
  if (overall >= 75) return { label: "Performance-Optimised", color: "var(--icon-lime)" }
  if (overall >= 58) return { label: "Strong Foundation", color: "var(--icon-teal)" }
  if (overall >= 42) return { label: "Developing System", color: "var(--icon-yellow)" }
  if (overall >= 28) return { label: "Inconsistent Fuelling", color: "var(--icon-orange)" }
  return { label: "Early Performance Builder", color: "var(--icon-orange)" }
}

function computeResult(answers: Record<string, number>): SportsResult {
  const subScores = computeSubScores(answers)
  const floored = Object.values(subScores).map((s) => Math.max(s, 25))
  const overall = Math.round(floored.reduce((a, b) => a + b, 0) / floored.length)
  const { label, color } = getProfile(overall)
  const pillars: PillarKey[] = ["energy", "build", "recovery", "protection"]
  const insights: PillarInsight[] = pillars
    .map((k) => ({ key: k, score: subScores[k], isStrength: subScores[k] >= 58 }))
    .sort((a, b) => a.score - b.score)
  return { subScores, overall, profile: label, profileColor: color, insights, completedAt: Date.now() }
}

/* ─────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────── */
interface AssessmentState {
  view: "intro" | "questions" | "results"
  sport: string
  level: string
  name: string
  email: string
  currentIndex: number
  answers: Record<string, number>
  result: SportsResult | null
}

function emptyState(): AssessmentState {
  return {
    view: "intro",
    sport: "",
    level: "",
    name: "",
    email: "",
    currentIndex: 0,
    answers: {},
    result: null,
  }
}

function loadState(): AssessmentState {
  if (typeof window === "undefined") return emptyState()
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as AssessmentState
    // Reset terminal states on fresh load
    if (parsed.view === "results") return { ...parsed, view: "intro", result: null, answers: {}, currentIndex: 0 }
    return parsed
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
        const result = computeResult(nextAnswers)
        update({ answers: nextAnswers, view: "results", result, currentIndex: nextIndex })
      } else {
        update({ answers: nextAnswers, currentIndex: nextIndex })
      }
      setSelectedOption(null)
    }, 350)
  }, [state.answers, state.currentIndex, update])

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

  if (state.view === "results" && state.result) {
    return <SportsResults state={state} onReset={handleReset} />
  }

  return null
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
    update({ name: form.name.trim(), email: form.email.trim(), view: "questions", currentIndex: 0, answers: {} })
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
            EatoSports Assessment
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
                const isSelected = state.sport === s.label
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => update({ sport: s.label })}
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
                const isSelected = state.level === l.label
                return (
                  <button
                    key={l.label}
                    type="button"
                    onClick={() => update({ level: l.label })}
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

  // Top 3 actions from weakest pillars
  const actions = result.insights
    .slice(0, 3)
    .map((i) => ({
      pillar: i.key,
      action: i.isStrength ? PILLAR_META[i.key].actionHigh : PILLAR_META[i.key].actionLow,
      meta: PILLAR_META[i.key],
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
                  {state.sport}
                </span>
                <span className="rounded-full border border-background/20 px-3 py-1 text-xs font-semibold text-background/70">
                  {state.level}
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
              const Icon = meta.icon
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
              const Icon = a.meta.icon
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
          <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">EatoSports</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            Now understand <span className="brand-gradient-text">the full framework</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
            Your results map to the 4 Systems of Performance. Explore the EatoSports framework to understand the science behind every score.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/eatosports"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: SPORTS_GRADIENT }}
            >
              Explore EatoSports
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
        </div>
      </section>
    </div>
  )
}
