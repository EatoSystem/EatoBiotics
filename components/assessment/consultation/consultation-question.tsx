"use client"

import { useEffect, useId, useRef } from "react"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  ConsultationAnswer,
  ConsultationFoundation,
  ConsultationQuestion,
} from "@/lib/consultation/types"
import { optionLabelFor, questionTextFor, supportTextFor } from "@/lib/consultation/question-bank"
import { toggleMultiValue } from "@/lib/consultation/session"

/**
 * One deterministic Consultation question.
 *
 * ══ WHAT THIS COMPONENT DOES NOT DECIDE ═════════════════════════════════════
 *
 * Whether Continue is allowed, what the next question is, whether an answer is
 * valid, whether a branch opens. All of that is `lib/consultation/session.ts`,
 * and this file only renders what it is handed. The legacy question view does
 * the opposite — each option schedules its own delayed advance — which is the
 * behaviour §10 freezes out, and which a guard here forbids by rule.
 *
 * ══ CUSTOMER WORDING COMES FROM THE BANK ════════════════════════════════════
 *
 * `questionTextFor`, `supportTextFor` and `optionLabelFor` resolve the You vs
 * household phrasing. This component never carries question text, option
 * labels or values of its own: a copy here would be a second bank, and the one
 * that got reviewed would not be the one the customer read.
 *
 * The question's internal governance fields are never rendered (§20). They
 * exist to record how the question was built and what may be inferred from its
 * answer, not to explain anything to the person answering — and a guard asserts
 * that none of them appears in this directory at all.
 */

interface Props {
  question: ConsultationQuestion
  foundation: ConsultationFoundation
  answer: ConsultationAnswer | undefined
  touched: boolean
  onAnswer: (id: string, value: ConsultationAnswer) => void
  onBack: () => void
  onNext: () => void
  canGoBack: boolean
  isLast: boolean
  validationError: string | null
  /** 1-based position within the current section, for the announcement. */
  sectionTitle: string
  questionNumber: number
  questionCount: number
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function ConsultationQuestionView({
  question,
  foundation,
  answer,
  touched,
  onAnswer,
  onBack,
  onNext,
  canGoBack,
  isLast,
  validationError,
  sectionTitle,
  questionNumber,
  questionCount,
}: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const groupName = useId()
  const errorId = `${groupName}-error`
  const supportId = `${groupName}-support`

  /* Focus the question when it changes, so advancing announces the new content
   * instead of leaving focus on a Continue button that has just re-rendered.
   * Same approach the free Assessment already uses in its own question view —
   * one focus target carrying section, position and question text as a single
   * announcement. */
  useEffect(() => {
    headingRef.current?.focus()
  }, [question.id])

  /* A refused Continue has to reach a screen reader. The message is rendered in
   * a live region AND focused, because the customer who pressed Continue is on
   * the button and needs to be told why they are still on this question. */
  useEffect(() => {
    if (validationError) errorRef.current?.focus()
  }, [validationError])

  const animate = !prefersReducedMotion()
  const text = questionTextFor(question, foundation)
  const support = supportTextFor(question, foundation)
  const options = question.options ?? []
  const isMulti = question.type === "multi"
  const selectedValues = isMulti && Array.isArray(answer) ? answer : []

  function handleSingle(value: string) {
    // Records the answer and nothing else. No timer, no advance (§10): with
    // native radios the arrow keys select as they move, so advancing on
    // selection would fire once per option for a keyboard user.
    onAnswer(question.id, value)
  }

  function handleMulti(value: string) {
    // Exclusivity comes from the bank's own `exclusive` flag via the session
    // helper, so "Nothing in particular" cannot sit beside three things.
    onAnswer(question.id, toggleMultiValue(options, selectedValues, value))
  }

  const describedBy = [support ? supportId : null, validationError ? errorId : null]
    .filter(Boolean)
    .join(" ")

  return (
    <div
      className={cn(
        "mx-auto max-w-2xl px-6 pb-28 pt-6",
        animate && "animate-in fade-in duration-300",
      )}
    >
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-serif text-2xl font-semibold leading-snug text-foreground outline-none sm:text-3xl"
      >
        <span className="sr-only">
          {sectionTitle}. Question {questionNumber} of {questionCount}.{" "}
        </span>
        {text}
      </h2>

      {support && (
        <p id={supportId} className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {support}
        </p>
      )}

      {!question.required && (
        <p className="mt-3 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Optional
        </p>
      )}

      {/* ── single / multi ─────────────────────────────────────────────── */}
      {(question.type === "single" || isMulti) && (
        <fieldset className="mt-8 border-0 p-0">
          <legend className="sr-only">
            {text}
            {isMulti ? " — select all that apply" : ""}
          </legend>
          {isMulti && (
            <p className="mb-3 text-sm text-muted-foreground">Select all that apply.</p>
          )}

          <div className="space-y-3">
            {options.map((option) => {
              const label = optionLabelFor(option, foundation)
              const isSelected = isMulti
                ? selectedValues.includes(option.value)
                : answer === option.value
              const inputId = `${groupName}-${option.value}`

              return (
                <label
                  key={option.value}
                  htmlFor={inputId}
                  className={cn(
                    "relative block w-full cursor-pointer rounded-2xl border-2 p-4 text-left transition-all duration-150 sm:p-5",
                    "focus-within:ring-2 focus-within:ring-[var(--icon-green)]/40",
                    isSelected
                      ? "border-[var(--icon-green)] bg-[var(--icon-green)]/8"
                      : "border-border bg-background hover:border-[var(--icon-green)]/40 hover:bg-secondary/60",
                  )}
                >
                  <input
                    id={inputId}
                    type={isMulti ? "checkbox" : "radio"}
                    name={isMulti ? `${groupName}-${option.value}` : groupName}
                    className="sr-only"
                    checked={isSelected}
                    aria-describedby={describedBy || undefined}
                    onChange={() =>
                      isMulti ? handleMulti(option.value) : handleSingle(option.value)
                    }
                  />
                  <div className="flex items-start justify-between gap-3">
                    {/* The canonical OR label is rendered whole. Each bundled
                      * value is one selection (§17); offering its two halves as
                      * separate checkboxes would record a claim the customer
                      * never made. */}
                    <p className="text-sm font-semibold text-foreground sm:text-base">{label}</p>
                    <div
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-all duration-150",
                        isMulti ? "rounded-md" : "rounded-full",
                        isSelected
                          ? "border-[var(--icon-green)] bg-[var(--icon-green)]"
                          : "border-border",
                      )}
                      aria-hidden
                    >
                      {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </fieldset>
      )}

      {/* ── slider ─────────────────────────────────────────────────────── */}
      {question.type === "slider" && (
        <div className="mt-8 space-y-4">
          {/* Untouched, the control shows a dash rather than a number. The thumb
            * has to sit somewhere, and showing that position as a value would
            * present the control's default as the customer's answer (§18). */}
          <div className="text-center">
            <span className="text-4xl font-bold text-foreground">
              {touched && typeof answer === "number" ? answer : "—"}
            </span>
          </div>
          <input
            type="range"
            min={question.min ?? 0}
            max={question.max ?? 10}
            value={typeof answer === "number" ? answer : (question.min ?? 0)}
            aria-label={text}
            aria-describedby={describedBy || undefined}
            aria-valuetext={
              touched && typeof answer === "number" ? String(answer) : "No answer chosen yet"
            }
            onChange={(e) => onAnswer(question.id, Number(e.target.value))}
            className="w-full accent-[var(--icon-green)]"
          />
          {(question.minLabel || question.maxLabel) && (
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">{question.minLabel}</span>
              <span className="text-xs text-muted-foreground">{question.maxLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* ── textarea ───────────────────────────────────────────────────── */}
      {question.type === "textarea" && (
        <div className="mt-8 space-y-2">
          <label htmlFor={`${groupName}-text`} className="sr-only">
            {text}
          </label>
          <textarea
            id={`${groupName}-text`}
            value={typeof answer === "string" ? answer : ""}
            maxLength={question.maxLength}
            aria-describedby={describedBy || undefined}
            onChange={(e) => onAnswer(question.id, e.target.value)}
            className="min-h-[140px] w-full resize-none rounded-2xl border-2 border-border bg-background p-4 text-base leading-relaxed transition-colors focus:border-[var(--icon-green)] focus:outline-none"
          />
          {question.maxLength ? (
            <p className="text-right text-xs text-muted-foreground">
              {(typeof answer === "string" ? answer.length : 0)}/{question.maxLength}
            </p>
          ) : null}
        </div>
      )}

      {/* Validation. `alert` rather than `status`: the customer asked to move on
        * and was refused, which is worth interrupting for. */}
      {validationError && (
        <p
          id={errorId}
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mt-5 rounded-xl border border-[var(--icon-orange)]/40 bg-[var(--icon-orange)]/8 px-4 py-3 text-sm leading-relaxed text-foreground outline-none"
        >
          {validationError}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-[44px] items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <ArrowLeft size={15} />
            Back
          </button>
        ) : (
          <span />
        )}

        {/* Always enabled. A disabled Continue cannot be focused, so it cannot
          * explain itself — the customer is left pressing a dead control with
          * no announcement. Pressing it with no answer produces the message
          * above instead, which is both reachable and readable (§14/§31). */}
        <button
          type="button"
          onClick={onNext}
          className="brand-gradient flex min-h-[44px] items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {isLast ? "Finish" : "Continue"}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}
