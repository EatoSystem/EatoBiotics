"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, ShieldAlert } from "lucide-react"
import {
  STABILITY_SECTIONS, SAFETY_QUESTIONS, DEFAULT_ANSWERS, DEFAULT_FLAGS, TOTAL_STEPS,
  requiredStabilityQuestionIds, allStabilityAnswered,
} from "@/lib/stability/questions"
import { calculateStabilityScore } from "@/lib/stability/scoring"
import { saveAssessment } from "@/lib/stability/storage"
import type { StabilityAnswers, SafetyFlags, StoolType } from "@/lib/stability/types"
import { RedFlagWarning } from "./RedFlagWarning"

export function StabilityAssessmentForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<StabilityAnswers>({ ...DEFAULT_ANSWERS })
  const [flags, setFlags] = useState<SafetyFlags>({ ...DEFAULT_FLAGS })
  // Track which scored questions the user has actually answered. No score may be
  // computed from untouched DEFAULT_ANSWERS — see allStabilityAnswered().
  const [answered, setAnswered] = useState<Set<string>>(new Set())
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isSafety = step === STABILITY_SECTIONS.length
  const section = STABILITY_SECTIONS[step]
  const anyFlag = Object.values(flags).some(Boolean)
  const matchedFlags = SAFETY_QUESTIONS.filter((q) => flags[q.id]).map((q) => q.label)

  const requiredIds = requiredStabilityQuestionIds()
  const allAnswered = allStabilityAnswered([...answered])
  const remaining = requiredIds.filter((id) => !answered.has(id)).length
  const canFinish = allAnswered && confirmed && !submitting

  function set<K extends keyof StabilityAnswers>(id: K, value: number) {
    setAnswers((a) => ({ ...a, [id]: id === "usualStool" ? (value as StoolType) : value }))
    setAnswered((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  function finish() {
    // Hard guard: never compute/show a score from an incomplete/default state.
    if (!allAnswered || !confirmed) return
    setSubmitting(true)
    const score = calculateStabilityScore(answers, flags)
    saveAssessment({ answers, flags, score })
    router.push("/stability/results")
  }

  const pct = Math.round(((step + 1) / TOTAL_STEPS) * 100)

  return (
    <div className="mx-auto max-w-2xl">
      {/* Sticky red-flag warning — shown immediately the moment any safety flag is ticked */}
      {anyFlag && (
        <div className="sticky top-3 z-20 mb-4">
          <RedFlagWarning matched={matchedFlags} compact />
        </div>
      )}

      {/* Progress */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" }} />
        </div>
        <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--muted-foreground)" }}>{step + 1}/{TOTAL_STEPS}</span>
      </div>

      <div className="rounded-[2rem] border border-black/[0.06] bg-white p-6 shadow-[0_18px_60px_-24px_rgba(26,46,18,0.22)] sm:p-8">
        {isSafety ? (
          <>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>
              <ShieldAlert size={14} /> Safety check
            </div>
            <h2 className="mt-3 font-serif text-2xl font-bold" style={{ color: "var(--foreground)" }}>Have you noticed any of these?</h2>
            <p className="mt-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>Tick anything you&apos;ve experienced recently. This helps us flag when to point you to a doctor.</p>
            <div className="mt-5 space-y-2.5">
              {SAFETY_QUESTIONS.map((q) => {
                const on = flags[q.id]
                return (
                  <button key={q.id} type="button" onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}
                    className="flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all"
                    style={{ borderColor: on ? "#ef4444" : "var(--border)", background: on ? "color-mix(in srgb, #ef4444 6%, white)" : "white", color: "var(--foreground)" }}>
                    {q.label}
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2" style={{ borderColor: on ? "#ef4444" : "var(--border)", background: on ? "#ef4444" : "transparent", color: "white" }}>
                      {on ? "✓" : ""}
                    </span>
                  </button>
                )
              })}
            </div>
            {anyFlag && <div className="mt-5"><RedFlagWarning matched={matchedFlags} compact /></div>}

            {/* Completeness + explicit confirmation gate */}
            <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "#f7f9f4" }}>
              {!allAnswered ? (
                <p className="text-sm font-medium" style={{ color: "var(--icon-orange)" }}>
                  Please answer every question before seeing your score — {remaining} still {remaining === 1 ? "needs" : "need"} an answer. Use Back to complete the earlier sections.
                </p>
              ) : (
                <label className="flex cursor-pointer items-start gap-3 text-sm" style={{ color: "var(--foreground)" }}>
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--icon-green)]"
                  />
                  <span>I&apos;ve answered these questions honestly for myself.</span>
                </label>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>{section.title}</p>
            {section.intro && <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>{section.intro}</p>}
            <div className="mt-5 space-y-6">
              {section.questions.map((q) => (
                <div key={q.id}>
                  <label className="block text-sm font-semibold" style={{ color: "var(--foreground)" }}>{q.label}</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.options.map((o) => {
                      const active = answers[q.id] === o.value
                      return (
                        <button key={o.label} type="button" onClick={() => set(q.id, o.value)}
                          className="rounded-full border-2 px-3.5 py-2 text-sm font-medium transition-all"
                          style={{ borderColor: active ? "var(--icon-green)" : "var(--border)", background: active ? "color-mix(in srgb, var(--icon-green) 8%, white)" : "white", color: "var(--foreground)" }}>
                          {o.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft size={14} /> Back
            </button>
          ) : <span />}
          {isSafety ? (
            <button type="button" onClick={finish} disabled={!canFinish}
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? "Calculating…" : "See my Stability Score"} <ArrowRight size={15} />
            </button>
          ) : (
            <button type="button" onClick={() => setStep((s) => s + 1)}
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90">
              Continue <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
