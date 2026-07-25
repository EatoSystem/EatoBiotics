"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, RotateCcw } from "lucide-react"
import {
  QUIZ_QUESTIONS,
  scoreQuiz,
  type QuizBiotic,
  type QuizResult,
} from "@/lib/food-education"
import { BIOTIC_META } from "@/lib/biotic-meta"

/**
 * "Which biotic are you missing?" — a three-question, client-scored self-check.
 *
 * Follows the step/progress-ring pattern proven in
 * `components/eatobetics/glp1-check.tsx`. No backend, no auth, no storage.
 */
export function BioticQuiz() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<{ biotic: QuizBiotic; score: number }[]>([])
  const [result, setResult] = useState<QuizResult | null>(null)

  function choose(score: number) {
    const question = QUIZ_QUESTIONS[step]
    const next = [...answers, { biotic: question.biotic, score }]
    setAnswers(next)

    if (next.length === QUIZ_QUESTIONS.length) {
      setResult(scoreQuiz(next))
      return
    }
    setStep(step + 1)
  }

  function reset() {
    setStep(0)
    setAnswers([])
    setResult(null)
  }

  const progress = result ? 100 : ((step + 1) / QUIZ_QUESTIONS.length) * 100
  const question = QUIZ_QUESTIONS[step]
  const accent = result
    ? result.balanced
      ? "var(--icon-green)"
      : BIOTIC_META[result.biotic].color
    : "var(--icon-green)"

  const circumference = 2 * Math.PI * 54

  return (
    <div className="grid overflow-hidden rounded-3xl bg-secondary md:grid-cols-2">
      {/* Question side */}
      <div className="p-8 md:p-10">
        <div className="h-1 w-full overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, background: "var(--icon-green)" }}
          />
        </div>

        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {result ? "Complete" : `Question ${step + 1} of ${QUIZ_QUESTIONS.length}`}
        </p>

        {result ? (
          <>
            <p className="mt-3 font-serif text-2xl font-semibold text-foreground">
              {result.balanced
                ? "No obvious gap — nicely balanced."
                : `Your weakest stage is ${BIOTIC_META[result.biotic].label}.`}
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw size={14} />
              Retake the check
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 font-serif text-2xl font-semibold text-foreground">
              {question.question}
            </p>
            <div className="mt-6 grid gap-2">
              {question.options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => choose(option.score)}
                  className="rounded-xl bg-background px-4 py-3.5 text-left text-base text-foreground transition-colors hover:bg-icon-green/10"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Result side */}
      <div className="flex flex-col items-center justify-center bg-foreground p-8 text-center md:p-10">
        <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">
          <circle cx="66" cy="66" r="54" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="9" />
          <circle
            cx="66"
            cy="66"
            r="54"
            fill="none"
            stroke={accent}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={
              result ? circumference - (circumference * result.coverage) / 100 : circumference
            }
            transform="rotate(-90 66 66)"
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.2,0.7,0.3,1)" }}
          />
          <text
            x="66"
            y="74"
            textAnchor="middle"
            fill="#FFFFFF"
            className="font-serif"
            style={{ fontSize: 28, fontWeight: 600 }}
          >
            {result ? `${result.coverage}%` : "—"}
          </text>
        </svg>

        <h3 className="mt-5 font-serif text-2xl font-semibold text-background">
          {result ? result.title : "Your result appears here"}
        </h3>
        <p className="mx-auto mt-3 max-w-[32ch] text-sm leading-relaxed text-background/70">
          {result
            ? result.body
            : "Answer the three questions and we'll name the stage you're weakest on — then point you at the foods that close it."}
        </p>

        {result && (
          <Link
            href={result.balanced ? "/food#library" : `/food/for/${gapGoal(result.biotic)}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
          >
            {result.balanced
              ? "Browse the library"
              : `Show me ${BIOTIC_META[result.biotic].label.toLowerCase()} foods`}
            <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
    </div>
  )
}

/** Map a weak stage onto an existing goal page in `lib/food-goals.ts`. */
function gapGoal(biotic: QuizBiotic): string {
  if (biotic === "prebiotic") return "gut-health"
  if (biotic === "probiotic") return "digestion"
  return "inflammation"
}
