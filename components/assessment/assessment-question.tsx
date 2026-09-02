"use client"

import { useEffect, useId, useRef } from "react"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AssessmentQuestion } from "@/lib/assessment-data"
import { SECTION_COLORS } from "@/lib/assessment-data"
import { BIOTIC_INTRO, bioticOf, type Biotic } from "@/lib/assessment/biotics"

interface AssessmentQuestionProps {
  question: AssessmentQuestion
  selected: number | string[] | undefined
  onAnswer: (id: string, value: number | string[]) => void
  onBack: () => void
  onNext: () => void
  canNext: boolean
  isLast: boolean
  /** Set when this question opens a Biotic section — see lib/assessment/biotics.ts. */
  sectionOpens?: Biotic | null
  /** 1-based, for "Question X of Y". */
  position?: number
  total?: number
}

/** True when the visitor has asked for less motion. */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function AssessmentQuestionView({
  question,
  selected,
  onAnswer,
  onBack,
  onNext,
  canNext,
  isLast,
  sectionOpens = null,
  position,
  total,
}: AssessmentQuestionProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const groupName = useId()

  /* Move focus to the question when the question changes.
   *
   * Without this, advancing leaves focus on the Continue button that has just
   * been removed and re-rendered, so a screen reader announces nothing and a
   * keyboard user has no idea the content changed. One target rather than a
   * live region: the heading contains the section beat, the position and the
   * question text, so it is announced as one coherent unit instead of three
   * regions competing to describe the same transition. */
  useEffect(() => {
    headingRef.current?.focus()
  }, [question.id])

  /* Motion is decoration here. The transition exists to soften the swap, and
   * nothing about understanding the question depends on it. */
  const animate = !prefersReducedMotion()

  function handleSingleSelect(value: number) {
    onAnswer(question.id, value)
    /* No timed navigation.
     *
     * This used to be `setTimeout(() => onNext(), 350)` on every selection,
     * with no Continue rendered for single-choice questions at all — so a
     * keyboard or screen-reader user had the page move under them 350ms after
     * choosing, and had no other way forward.
     *
     * With native radios the timer becomes actively wrong: arrow keys MOVE and
     * SELECT in one action, so browsing options with the keyboard would fire
     * an advance per option. The fix is not to detect input modality and
     * suppress it — that heuristic is exactly the brittleness worth refusing —
     * it is to let the person say when they are ready. Continue below. */
  }

  function handleMultiSelect(value: number) {
    const strValue = String(value)
    const current = Array.isArray(selected) ? (selected as string[]) : []
    onAnswer(
      question.id,
      current.includes(strValue)
        ? current.filter((v) => v !== strValue)
        : [...current, strValue],
    )
  }

  const isMulti = question.type === "multi"
  const selectedValues = isMulti && Array.isArray(selected) ? (selected as string[]) : []
  const sectionColor = SECTION_COLORS[question.sectionTitle] ?? "var(--icon-green)"
  const biotic = bioticOf(question.sectionTitle)

  return (
    <div
      key={question.index}
      className={cn(
        "mx-auto max-w-2xl px-6 pb-24 pt-6",
        animate && "animate-in fade-in duration-300",
      )}
    >
      {/* The section overline.
        *
        * On a Biotic journey the section name already appears in the progress
        * row, so repeating it here on every question was the same words twice
        * in one viewport. It now appears once, as the section OPENS, carrying
        * the meaning with it. Questions inside a section show nothing here.
        *
        * Assessments whose sections are not Biotics — Mind, Family — have no
        * beat to show and no progress-row duplication to avoid, so they keep
        * the overline they have always had. */}
      {biotic ? (
        sectionOpens && (
          <div className="mb-5">
            <div className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: sectionColor }}
                aria-hidden
              />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: sectionColor }}
              >
                {sectionOpens}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {BIOTIC_INTRO[sectionOpens]}
            </p>
          </div>
        )
      ) : (
        <div className="mb-4 flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: sectionColor }}
            aria-hidden
          />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {question.sectionTitle}
          </span>
        </div>
      )}

      {/* The focus target. `tabIndex={-1}` makes it programmatically focusable
        * without adding a tab stop. The visually-hidden prefix means the
        * announcement carries the section and the position before the question
        * itself — "Probiotics. Question 7 of 15. <question>" — without
        * printing that twice on screen. */}
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-serif text-2xl font-semibold leading-snug text-foreground outline-none sm:text-3xl"
      >
        {position && total && (
          <span className="sr-only">
            {sectionOpens ? `${sectionOpens}. ` : ""}
            Question {position} of {total}.{" "}
          </span>
        )}
        {question.text}
      </h2>

      {/* Options — a real group, not a row of unrelated buttons.
        *
        * Native radio/checkbox inputs rather than a hand-built
        * role="radiogroup": the browser gives arrow-key navigation, the
        * checked state, and the group relationship for free, and each is a
        * thing that a custom implementation gets subtly wrong. The inputs are
        * visually hidden and the existing card IS the label, so the design is
        * unchanged while the semantics become real. */}
      <fieldset className="mt-8 border-0 p-0">
        <legend className="sr-only">
          {question.text}
          {isMulti ? " — select all that apply" : ""}
        </legend>
        {isMulti && (
          <p className="mb-3 text-sm text-muted-foreground">Select all that apply.</p>
        )}

        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = isMulti
              ? selectedValues.includes(String(option.value))
              : selected === option.value
            const inputId = `${groupName}-${option.value}`
            const descId = option.description ? `${inputId}-desc` : undefined

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
                  aria-describedby={descId}
                  onChange={() =>
                    isMulti ? handleMultiSelect(option.value) : handleSingleSelect(option.value)
                  }
                />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground sm:text-base">
                      {option.label}
                    </p>
                    {option.description && (
                      <p
                        id={descId}
                        className="mt-0.5 text-xs leading-snug text-muted-foreground sm:text-sm"
                      >
                        {option.description}
                      </p>
                    )}
                  </div>

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

      {/* Navigation. Continue is rendered for EVERY question type — it used to
        * exist only for multi-select, so single-choice had no explicit way
        * forward at all. Disabled until a valid answer exists. */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={cn(
            "flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all",
            canNext
              ? "brand-gradient hover:opacity-90"
              : "bg-border text-muted-foreground cursor-not-allowed opacity-50",
          )}
        >
          {isLast ? "See My Results" : "Continue"}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}
