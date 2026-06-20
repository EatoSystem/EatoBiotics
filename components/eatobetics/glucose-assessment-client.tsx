"use client"

/**
 * components/eatobetics/glucose-assessment-client.tsx
 *
 * Self-contained EatoBetics (glucose) assessment flow, modelled on the
 * EatoBiotics assessment framework but built for the Glucose Intelligence
 * Lens. Three views: intro → questions → results. Scoring runs client-side
 * (lib/glucose-assessment-scoring); progress persists to localStorage.
 * Educational only — not a medical assessment.
 */

import { useEffect, useRef, useState } from "react"
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Salad,
  Clock,
  Dumbbell,
  HeartPulse,
  ShieldCheck,
  Info,
  type LucideIcon,
} from "lucide-react"
import {
  GLUCOSE_QUESTIONS,
  GLUCOSE_PILLARS,
  GLUCOSE_SECTION_COLORS,
} from "@/lib/glucose-assessment-data"
import {
  computeGlucoseResult,
  type GlucoseResult,
} from "@/lib/glucose-assessment-scoring"
import { GlucoseReport } from "@/components/eatobetics/glucose-report"
import { GLUCOSE_DISCLAIMER } from "@/lib/assessment-disclaimers"

const ICONS: Record<string, LucideIcon> = { Salad, Clock, Dumbbell, HeartPulse }
const STORAGE_KEY = "eatobetics-glucose-assessment"

type View = "intro" | "questions" | "results"

interface SavedState {
  view: View
  currentIndex: number
  answers: Record<string, number>
}

function load(): SavedState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedState) : null
  } catch {
    return null
  }
}

function save(state: SavedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

export function GlucoseAssessmentClient() {
  const [view, setView] = useState<View>("intro")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<GlucoseResult | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const advancing = useRef(false)

  // Restore in-progress answers (not the result — recompute on demand)
  useEffect(() => {
    const saved = load()
    if (saved && Object.keys(saved.answers).length > 0) {
      setAnswers(saved.answers)
      if (saved.view === "questions") {
        setView("questions")
        setCurrentIndex(Math.min(saved.currentIndex, GLUCOSE_QUESTIONS.length - 1))
      }
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) save({ view, currentIndex, answers })
  }, [hydrated, view, currentIndex, answers])

  const total = GLUCOSE_QUESTIONS.length
  const safeIndex = Math.min(currentIndex, total - 1)
  const question = GLUCOSE_QUESTIONS[safeIndex]

  function start() {
    advancing.current = false
    setView("questions")
    setCurrentIndex(0)
  }

  function answer(value: number) {
    // Lock during the auto-advance so a fast double-tap can't stack timers
    // and overshoot the last question.
    if (advancing.current || !question) return
    advancing.current = true
    const isLast = safeIndex >= total - 1
    const next = { ...answers, [question.id]: value }
    setAnswers(next)
    window.setTimeout(() => {
      advancing.current = false
      if (isLast) finish(next)
      else setCurrentIndex((i) => Math.min(i + 1, total - 1))
    }, 320)
  }

  function finish(finalAnswers: Record<string, number>) {
    setResult(computeGlucoseResult(finalAnswers))
    setView("results")
  }

  function back() {
    advancing.current = false
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
    else setView("intro")
  }

  function retake() {
    advancing.current = false
    setAnswers({})
    setResult(null)
    setCurrentIndex(0)
    setView("intro")
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }

  if (view === "intro") return <Intro onStart={start} />
  if (view === "results" && result)
    return (
      <>
        <GlucoseDisclaimer />
        <GlucoseReport result={result} onRetake={retake} />
      </>
    )
  return (
    <Questions
      index={safeIndex}
      total={total}
      selected={answers[question.id]}
      onAnswer={answer}
      onBack={back}
    />
  )
}

/* ── Results disclaimer ─────────────────────────────────────────── */

function GlucoseDisclaimer() {
  return (
    <div className="bg-white px-6 pt-24">
      <div className="mx-auto max-w-2xl">
        <div
          className="flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm leading-relaxed"
          style={{
            borderColor: "color-mix(in srgb, var(--icon-orange) 30%, transparent)",
            background: "color-mix(in srgb, var(--icon-orange) 6%, white)",
            color: "var(--foreground)",
          }}
        >
          <Info size={16} className="mt-0.5 shrink-0" style={{ color: "var(--icon-orange)" }} />
          <p>
            {GLUCOSE_DISCLAIMER}{" "}
            <span style={{ color: "var(--muted-foreground)" }}>
              It reflects how strongly your habits may support steadier glucose — measuring your
              actual glucose needs a continuous glucose monitor (CGM) or blood testing.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Intro ──────────────────────────────────────────────────────── */

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <main className="bg-white px-6 pb-24 pt-28 md:pt-32">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          <Sparkles size={14} style={{ color: "var(--icon-yellow)" }} /> EatoBetics Assessment
        </span>
        <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.1] text-balance sm:text-5xl">
          <span style={{ color: "var(--foreground)" }}>What&apos;s your </span>
          <span style={{ color: "var(--icon-orange)" }}>Glucose</span>
          <span style={{ color: "var(--foreground)" }}> Intelligence Score?</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          A quick, structured check-in on how your meals, rhythm, strength habits, and
          daily routine support steady energy and glucose. Free, about 4 minutes, no
          account needed.
        </p>

        {/* Pillars */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(GLUCOSE_PILLARS).map((p) => {
            const Icon = ICONS[p.icon] ?? Salad
            return (
              <div key={p.key} className="rounded-2xl border border-[#e8efe2] bg-white p-6 text-left shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: p.gradient }}>
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{p.label}</h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{p.blurb}</p>
              </div>
            )
          })}
        </div>

        <button
          onClick={onStart}
          className="brand-gradient mt-12 inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-xl"
        >
          Start the assessment <ArrowRight size={16} />
        </button>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <ShieldCheck size={13} /> Educational only — not a medical assessment.
        </p>
      </div>
    </main>
  )
}

/* ── Questions ──────────────────────────────────────────────────── */

function Questions({
  index,
  total,
  selected,
  onAnswer,
  onBack,
}: {
  index: number
  total: number
  selected: number | undefined
  onAnswer: (v: number) => void
  onBack: () => void
}) {
  const q = GLUCOSE_QUESTIONS[index]
  const pct = Math.round(((index + 1) / total) * 100)
  const sectionColor = GLUCOSE_SECTION_COLORS[q.sectionTitle] ?? "var(--icon-green)"

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-24">
      <div className="mx-auto max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold">
            <span style={{ color: "var(--muted-foreground)" }}>
              {index + 1} of {total}
            </span>
            <span className="inline-flex items-center gap-1.5" style={{ color: sectionColor }}>
              <span className="h-2 w-2 rounded-full" style={{ background: sectionColor }} />
              {q.sectionTitle}
            </span>
            <span style={{ color: "var(--muted-foreground)" }}>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full brand-gradient transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <h2 className="font-serif text-2xl font-bold leading-snug text-balance sm:text-3xl" style={{ color: "var(--foreground)" }}>
          {q.text}
        </h2>

        <div className="mt-7 space-y-3">
          {q.options.map((opt, i) => {
            const isSelected = selected === opt.value && selected !== undefined
            return (
              <button
                key={i}
                onClick={() => onAnswer(opt.value)}
                className="group flex w-full items-center justify-between gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all"
                style={{
                  borderColor: isSelected ? "var(--icon-green)" : "var(--border)",
                  background: isSelected ? "color-mix(in srgb, var(--icon-green) 8%, white)" : "white",
                }}
              >
                <div>
                  <p className="font-semibold" style={{ color: "var(--foreground)" }}>{opt.label}</p>
                  <p className="mt-0.5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{opt.description}</p>
                </div>
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                  style={{
                    borderColor: isSelected ? "var(--icon-green)" : "var(--border)",
                    background: isSelected ? "var(--icon-green)" : "transparent",
                  }}
                >
                  {isSelected && <Check size={14} className="text-white" />}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft size={15} /> Back
          </button>
        </div>
      </div>
    </main>
  )
}
