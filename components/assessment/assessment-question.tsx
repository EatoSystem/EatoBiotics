"use client"

import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AssessmentQuestion } from "@/lib/assessment-data"
import { SECTION_COLORS } from "@/lib/assessment-data"

interface AssessmentQuestionProps {
  question: AssessmentQuestion
  selected: number | string[] | undefined
  onAnswer: (id: string, value: number | string[]) => void
  onBack: () => void
  onNext: () => void
  canNext: boolean
  isLast: boolean
}

export function AssessmentQuestionView({
  question,
  selected,
  onAnswer,
  onBack,
  onNext,
  canNext,
  isLast,
}: AssessmentQuestionProps) {
  function handleSingleSelect(value: number) {
    onAnswer(question.id, value)
    // Auto-advance after brief visual confirmation
    setTimeout(() => onNext(), 350)
  }

  function handleMultiSelect(value: number) {
    const strValue = String(value)
    const current = Array.isArray(selected) ? (selected as string[]) : []
    const updated = current.includes(strValue)
      ? current.filter((v) => v !== strValue)
      : [...current, strValue]
    onAnswer(question.id, updated)
  }

  const isMulti = question.type === "multi"
  const selectedValues = isMulti
    ? (Array.isArray(selected) ? (selected as string[]) : [])
    : null

  return (
    <div
      key={question.index}
      className="animate-in fade-in duration-300 mx-auto max-w-2xl px-6 pb-24 pt-6"
    >
      {/* Section overline */}
      <div className="mb-4 flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: SECTION_COLORS[question.sectionTitle] ?? "var(--icon-green)" }}
        />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {question.sectionTitle}
        </span>
      </div>
      {/* Question text */}
      <h2 className="font-serif text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
        {question.text}
      </h2>
      {isMulti && (
        <p className="mt-2 text-sm text-muted-foreground">Select all that apply.</p>
      )}

      {/* Options */}
      <div className="mt-8 space-y-3">
        {question.options.map((option) => {
          const isSelected = isMulti
            ? (selectedValues ?? []).includes(String(option.value))
            : selected === option.value

          return (
            <button
              key={option.value}
              onClick={() =>
                isMulti ? handleMultiSelect(option.value) : handleSingleSelect(option.value)
              }
              className={cn(
                "relative w-full rounded-2xl border-2 p-4 text-left transition-all duration-150 sm:p-5",
                isSelected
                  ? "border-[var(--icon-green)] bg-[var(--icon-green)]/8"
                  : "border-border bg-background hover:border-[var(--icon-green)]/40 hover:bg-secondary/60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground sm:text-base">
                    {option.label}
                  </p>
                  {option.description && (
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground sm:text-sm">
                      {option.description}
                    </p>
                  )}
                </div>

                {/* Selection indicator */}
                <div
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150",
                    isSelected
                      ? "border-[var(--icon-green)] bg-[var(--icon-green)]"
                      : "border-border"
                  )}
                >
                  {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        {/* For multi-select (Q13), show explicit Continue button. For single, it auto-advances but we still show it for accessibility. */}
        {isMulti && (
          <button
            onClick={onNext}
            disabled={!canNext}
            className={cn(
              "flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all",
              canNext
                ? "brand-gradient hover:opacity-90"
                : "bg-border text-muted-foreground cursor-not-allowed opacity-50"
            )}
          >
            {isLast ? "See My Results" : "Continue"}
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
