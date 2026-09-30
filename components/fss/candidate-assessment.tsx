"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { AssessmentPart, ResolvedQuestion, ResolvedQuestionSet } from "@/lib/fss/questions/types"
import type { Answers } from "@/lib/fss/engine/score"
import { foodSystemRepository } from "@/lib/fss/persistence/local"

/**
 * "Tell us about your Food System" — the candidate canonical assessment.
 *
 * ══ FOUR PARTS, AND THE SEAM BETWEEN THEM IS THE POINT ══════════════════════
 *
 *   1 What You Eat        scored
 *   2 How You Eat         scored
 *   3 What You Notice     UNSCORED — observations, reported back
 *   4 Your Food Context   UNSCORED — circumstances, shape the Plan
 *
 * Parts 3 and 4 say so on screen, before the first question in each. Not as a
 * disclaimer — as an answer to the question a person actually has, which is
 * "why are you asking me this?". Someone told their digestion is being recorded
 * but not scored will answer it more honestly than someone who suspects it is
 * being marked.
 *
 * ══ WHAT THIS COMPONENT DOES NOT KNOW ═══════════════════════════════════════
 *
 * Which persistence backend is active — it calls `foodSystemRepository()` and
 * nothing more. That is the seam that makes the eventual move a substitution
 * rather than a rewrite.
 *
 * And it does not know what any answer is worth. It renders the resolved set
 * and records choices; the engine is the only thing that scores, and it can
 * only see items whose `contributes` is `fss`.
 *
 * ══ NO BIOTIC BEAT, BY DERIVATION ═══════════════════════════════════════════
 *
 * `lib/assessment/biotics.ts` derives a Biotic section beat by splitting a
 * section title on an em dash. These sections are named for DOMAINS, so that
 * derivation yields nothing and no suppression flag is needed. A domain is not
 * a Biotic, and now nothing has to remember it.
 */

const PART_ORDER: AssessmentPart[] = ["what-you-eat", "how-you-eat", "what-you-notice", "your-food-context"]

const PART_META: Record<AssessmentPart, { n: string; title: string; note?: string }> = {
  "what-you-eat": { n: "Part 1", title: "What You Eat" },
  "how-you-eat": { n: "Part 2", title: "How You Eat" },
  "what-you-notice": {
    n: "Part 3",
    title: "What You Notice",
    note: "These are not scored. What you notice is yours to tell us and ours to reflect back — it is an outcome, not a food-system input, and mixing the two would make the number impossible to read.",
  },
  "your-food-context": {
    n: "Part 4",
    title: "Your Food Context",
    note: "These are not scored either, and they never reduce anything. They ask about circumstances rather than choices, so that what we suggest fits the life you actually have.",
  },
}

export function CandidateAssessment({
  set,
  onComplete,
}: {
  set: ResolvedQuestionSet
  onComplete: (answers: Answers) => void
}) {
  const [answers, setAnswers] = useState<Answers>({})
  const [index, setIndex] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  const questions = set.questions
  const current = questions[index]

  /* Restore a walk in progress. A refresh mid-assessment losing twenty answers
   * is the kind of thing that makes a preview useless for review. */
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const stored = await foodSystemRepository().loadAssessment("candidate")
      if (!cancelled && stored && stored.questionSetVersion === set.questionSetVersion) {
        setAnswers(stored.answers)
      }
      if (!cancelled) setHydrated(true)
    })()
    return () => {
      cancelled = true
    }
  }, [set.questionSetVersion])

  const persist = useCallback(
    (next: Answers) => {
      void foodSystemRepository().saveAssessment({
        id: "candidate",
        assessmentVersion: set.assessmentVersion,
        questionSetVersion: set.questionSetVersion,
        answers: next,
        startedAt: new Date().toISOString(),
      })
    },
    [set.assessmentVersion, set.questionSetVersion],
  )

  const answer = useCallback(
    (value: number) => {
      const next = { ...answers, [current.id]: value }
      setAnswers(next)
      persist(next)
      if (index + 1 < questions.length) setIndex(index + 1)
      else onComplete(next)
    },
    [answers, current, index, questions.length, onComplete, persist],
  )

  const partStart = useMemo(
    () => index === 0 || questions[index - 1].part !== current?.part,
    [index, questions, current],
  )

  const answeredCount = questions.filter((q) => typeof answers[q.id] === "number").length

  if (!hydrated || !current) return null

  const meta = PART_META[current.part]
  const partQuestions = questions.filter((q) => q.part === current.part)
  const positionInPart = partQuestions.findIndex((q) => q.id === current.id) + 1

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 py-10">
      {/* One live region for the whole walk, so a screen-reader user is told
          which part they have entered rather than inferring it from a heading
          that scrolled past. */}
      <p aria-live="polite" className="sr-only">
        {meta.n}, {meta.title}. Question {positionInPart} of {partQuestions.length}.
      </p>

      <div className="mb-8">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {meta.n} · {meta.title}
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {answeredCount} of {questions.length}
          </p>
        </div>
        <div className="mt-3 h-[3px] w-full rounded-full bg-border">
          <div
            className="h-[3px] rounded-full transition-[width] duration-500"
            style={{
              width: `${(answeredCount / questions.length) * 100}%`,
              background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))",
            }}
          />
        </div>
      </div>

      {partStart && meta.note && (
        <div
          className="mb-8 rounded-2xl border p-5"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <p className="text-sm leading-relaxed text-muted-foreground">{meta.note}</p>
        </div>
      )}

      <QuestionCard question={current} selected={answers[current.id]} onAnswer={answer} />

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIndex(Math.max(0, index - 1))}
          disabled={index === 0}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        >
          <ArrowLeft size={16} aria-hidden /> Back
        </button>
        {typeof answers[current.id] === "number" && index + 1 < questions.length && (
          <button
            type="button"
            onClick={() => setIndex(index + 1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            Next <ArrowRight size={16} aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}

function QuestionCard({
  question,
  selected,
  onAnswer,
}: {
  question: ResolvedQuestion
  selected: number | undefined
  onAnswer: (value: number) => void
}) {
  return (
    <fieldset>
      <legend className="font-serif text-2xl font-bold leading-snug sm:text-3xl">{question.text}</legend>

      {question.status === "draft-pending-review" && (
        /* The draft marker is shown, not hidden. A reviewer walking this needs
           to know which questions have not been signed off, and a person in a
           preview environment is a reviewer by definition. */
        <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Draft question · pending review
        </p>
      )}

      <div role="radiogroup" aria-label={question.text} className="mt-7 space-y-3">
        {question.options.map((option) => {
          const isSelected = selected === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onAnswer(option.value)}
              className="flex w-full min-h-[56px] flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                borderColor: isSelected ? "var(--icon-green)" : "var(--border)",
                background: isSelected ? "color-mix(in srgb, var(--icon-green) 8%, var(--card))" : "var(--card)",
              }}
            >
              <span className="font-semibold text-foreground">{option.label}</span>
              {option.description && (
                <span className="text-sm leading-relaxed text-muted-foreground">{option.description}</span>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
