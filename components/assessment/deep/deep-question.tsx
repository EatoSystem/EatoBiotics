"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DeepQuestion, DeepAnswer } from "@/lib/deep-assessment"

interface DeepQuestionProps {
  question: DeepQuestion
  answer: DeepAnswer | undefined
  onAnswer: (id: string, value: DeepAnswer) => void
  onNext: () => void
  questionNumber: number
  totalQuestions: number
}

export function DeepQuestionView({
  question,
  answer,
  onAnswer,
  onNext,
}: DeepQuestionProps) {
  const [sliderValue, setSliderValue] = useState<number>(
    typeof answer === "number" ? answer : (question.min ?? 1)
  )
  const [textValue, setTextValue] = useState<string>(
    typeof answer === "string" ? answer : ""
  )
  const [multiSelected, setMultiSelected] = useState<string[]>(
    Array.isArray(answer) ? (answer as string[]) : []
  )

  function handleSingleSelect(value: string) {
    onAnswer(question.id, value)
    setTimeout(() => onNext(), 350)
  }

  function handleYesNo(value: "yes" | "no") {
    onAnswer(question.id, value)
    setTimeout(() => onNext(), 350)
  }

  function handleSliderChange(val: number) {
    setSliderValue(val)
    onAnswer(question.id, val)
  }

  function handleMultiToggle(value: string) {
    const updated = multiSelected.includes(value)
      ? multiSelected.filter((v) => v !== value)
      : [...multiSelected, value]
    setMultiSelected(updated)
    onAnswer(question.id, updated)
  }

  function handleTextChange(val: string) {
    if (val.length > 500) return
    setTextValue(val)
    onAnswer(question.id, val)
  }

  const eduContext = question.eduContext ? (
    <p className="text-sm text-muted-foreground italic mt-2">{question.eduContext}</p>
  ) : null

  const continueButton = (
    <button
      onClick={onNext}
      className="mt-6 w-full brand-gradient text-white font-semibold py-3 rounded-full text-sm hover:opacity-90 transition-opacity"
    >
      Continue →
    </button>
  )

  return (
    <div className="w-full max-w-lg mx-auto animate-in fade-in duration-300">
      {/* Question text */}
      <h2 className="font-serif text-xl font-semibold leading-snug text-foreground sm:text-2xl">
        {question.text}
      </h2>
      {eduContext}

      {/* ── single ── */}
      {question.type === "single" && question.options && (
        <div className="mt-6 space-y-3">
          {question.options.map((option) => {
            const isSelected = answer === option.value
            return (
              <button
                key={option.value}
                onClick={() => handleSingleSelect(option.value)}
                className={cn(
                  "relative w-full rounded-xl border-2 p-4 text-left transition-all duration-150",
                  isSelected
                    ? "border-[var(--icon-green)] bg-[var(--icon-green)]/8 font-medium"
                    : "border-border bg-background hover:bg-secondary/50 cursor-pointer"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-foreground">{option.label}</p>
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150",
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
      )}

      {/* ── yesno ── */}
      {question.type === "yesno" && (
        <div className="mt-6 flex gap-3">
          {(["yes", "no"] as const).map((val) => {
            const isYes = val === "yes"
            const isSelected = answer === val
            return (
              <button
                key={val}
                onClick={() => handleYesNo(val)}
                className={cn(
                  "flex-1 py-5 rounded-xl border-2 text-lg font-semibold text-center cursor-pointer transition-all duration-150",
                  isYes
                    ? isSelected
                      ? "border-[var(--icon-green)] bg-[var(--icon-green)]/10 text-[var(--icon-green)]"
                      : "border-[var(--icon-green)] text-foreground hover:bg-[var(--icon-green)]/5"
                    : isSelected
                    ? "border-destructive/40 bg-destructive/8 text-destructive"
                    : "border-destructive/40 text-foreground hover:bg-destructive/5"
                )}
              >
                {isYes ? "Yes" : "No"}
              </button>
            )
          })}
        </div>
      )}

      {/* ── slider ── */}
      {question.type === "slider" && (
        <div className="mt-8 space-y-4">
          <div className="text-center">
            <span className="text-4xl font-bold text-foreground">{sliderValue}</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={question.min ?? 1}
              max={question.max ?? 10}
              value={sliderValue}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full accent-[var(--icon-green)] cursor-pointer"
            />
            {(question.minLabel || question.maxLabel) && (
              <div className="mt-1 flex justify-between">
                <span className="text-xs text-muted-foreground">{question.minLabel}</span>
                <span className="text-xs text-muted-foreground">{question.maxLabel}</span>
              </div>
            )}
          </div>
          {continueButton}
        </div>
      )}

      {/* ── multi ── */}
      {question.type === "multi" && question.options && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">Select all that apply.</p>
          {question.options.map((option) => {
            const isSelected = multiSelected.includes(option.value)
            return (
              <button
                key={option.value}
                onClick={() => handleMultiToggle(option.value)}
                className={cn(
                  "relative w-full rounded-xl border-2 p-4 text-left transition-all duration-150 cursor-pointer",
                  isSelected
                    ? "border-[var(--icon-green)] bg-[var(--icon-green)]/8 font-medium"
                    : "border-border bg-background hover:bg-secondary/50"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-foreground">{option.label}</p>
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150",
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
          {continueButton}
        </div>
      )}

      {/* ── textarea ── */}
      {question.type === "textarea" && (
        <div className="mt-6 space-y-3">
          <textarea
            value={textValue}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Type your answer here…"
            className="w-full min-h-[120px] rounded-xl border border-border p-4 text-base resize-none focus:border-[var(--icon-green)] focus:outline-none bg-background transition-colors"
          />
          <p className="text-xs text-muted-foreground text-right">{textValue.length}/500</p>
          {continueButton}
        </div>
      )}
    </div>
  )
}
