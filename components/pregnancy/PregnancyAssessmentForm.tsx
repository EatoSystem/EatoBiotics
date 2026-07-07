"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Sparkles, Target, ListChecks } from "lucide-react"
import { ScoreRing } from "@/components/assessment/score-ring"
import { PregnancyRedFlags } from "@/components/pregnancy/PregnancyRedFlags"
import {
  PREGNANCY_SECTIONS,
  PREGNANCY_SAFETY_QUESTIONS,
  DEFAULT_PREGNANCY_ANSWERS,
  DEFAULT_PREGNANCY_FLAGS,
  allPregnancyAnswered,
} from "@/lib/pregnancy/questions"
import { calculatePregnancyScore, pregnancyBandMeta } from "@/lib/pregnancy/scoring"
import { savePregnancyAssessment } from "@/lib/pregnancy/storage"
import type { PregnancyAnswers, PregnancySafetyFlags, PregnancyScore } from "@/lib/pregnancy/types"

/** A single scored question rendered as a row of choice pills. */
function Question({
  label, help, options, value, onSelect,
}: {
  label: string
  help?: string
  options: { label: string; value: number }[]
  value: number | undefined
  onSelect: (v: number) => void
}) {
  return (
    <div className="border-t border-border py-5 first:border-t-0 first:pt-0">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {help && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{help}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.value
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onSelect(o.value)}
              className="rounded-full border px-3.5 py-1.5 text-sm transition-colors"
              style={{
                borderColor: active ? "var(--icon-green)" : "var(--border)",
                background: active ? "color-mix(in srgb, var(--icon-green) 12%, transparent)" : "transparent",
                color: active ? "var(--foreground)" : "var(--muted-foreground)",
                fontWeight: active ? 600 : 400,
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function List({ title, items, icon: Icon, accent }: { title: string; items: string[]; icon: typeof Target; accent: string }) {
  if (!items.length) return null
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: accent }}>
        <Icon size={15} /> {title}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: accent }} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PregnancyAssessmentForm() {
  const [answers, setAnswers] = useState<Partial<PregnancyAnswers>>({})
  const [answeredIds, setAnsweredIds] = useState<string[]>([])
  const [flags, setFlags] = useState<PregnancySafetyFlags>({ ...DEFAULT_PREGNANCY_FLAGS })
  const [result, setResult] = useState<PregnancyScore | null>(null)

  const ready = allPregnancyAnswered(answeredIds)

  const setAnswer = (id: keyof PregnancyAnswers, v: number) => {
    setAnswers((a) => ({ ...a, [id]: v }))
    setAnsweredIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
  }

  const compute = () => {
    if (!ready) return
    const full = { ...DEFAULT_PREGNANCY_ANSWERS, ...answers } as PregnancyAnswers
    const score = calculatePregnancyScore(full, flags)
    savePregnancyAssessment({ answers: full, flags, score })
    setResult(score)
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const bandBlurb = useMemo(() => (result ? pregnancyBandMeta(result.band).blurb : ""), [result])

  /* ── Results ── */
  if (result) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[1.75rem] border border-border bg-card p-8 text-center shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-icon-green">Your Pregnancy Food Score</p>
          <ScoreRing score={result.totalScore} color="var(--icon-green)" gradientId="preg-score" profileType={result.band} className="relative mx-auto mt-4 h-44 w-44 sm:h-52 sm:w-52" />
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">{bandBlurb}</p>
        </div>

        {result.redFlags.length > 0 && <PregnancyRedFlags flagged={result.redFlags} className="mt-6" />}

        <div className="mt-6 space-y-6 rounded-[1.5rem] border border-border bg-card p-7">
          <List title="Strengths" items={result.positiveFactors} icon={Sparkles} accent="var(--icon-green)" />
          <List title="Priority areas" items={result.priorityFactors} icon={Target} accent="var(--icon-orange)" />
          <List title="Your next steps" items={result.recommendedNextSteps} icon={ListChecks} accent="var(--icon-teal)" />
        </div>

        <div className="mt-6 text-center">
          <Link href="/assessment/results" className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 hover:opacity-90">
            View your combined report <ArrowRight size={18} />
          </Link>
        </div>
        <p className="mx-auto mt-6 max-w-lg text-center text-xs leading-relaxed text-muted-foreground/80">
          This is a food-pattern reflection for general wellbeing — not antenatal care or a medical assessment.
          Always bring food and pregnancy questions to your midwife or doctor.
        </p>
      </div>
    )
  }

  /* ── Form ── */
  return (
    <div className="mx-auto max-w-2xl">
      {PREGNANCY_SECTIONS.map((section) => (
        <section key={section.id} className="mt-6 rounded-[1.5rem] border border-border bg-card p-6 sm:p-7">
          <h2 className="font-serif text-xl font-semibold text-foreground">{section.title}</h2>
          {section.intro && <p className="mt-1 text-sm text-muted-foreground">{section.intro}</p>}
          <div className="mt-4">
            {section.questions.map((q) => (
              <Question
                key={q.id}
                label={q.label}
                help={q.help}
                options={q.options}
                value={answers[q.id]}
                onSelect={(v) => setAnswer(q.id, v)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Safety screen */}
      <section className="mt-6 rounded-[1.5rem] border p-6 sm:p-7" style={{ borderColor: "color-mix(in srgb, var(--icon-orange) 35%, transparent)", background: "color-mix(in srgb, var(--icon-orange) 5%, transparent)" }}>
        <h2 className="font-serif text-xl font-semibold text-foreground">A quick safety check</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tick anything you&apos;re experiencing. This never gives a diagnosis — it just points you to the right person.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {PREGNANCY_SAFETY_QUESTIONS.map((q) => {
            const on = flags[q.id]
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}
                className="flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors"
                style={{ borderColor: on ? "var(--icon-orange)" : "var(--border)", background: on ? "color-mix(in srgb, var(--icon-orange) 12%, transparent)" : "transparent" }}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border" style={{ borderColor: on ? "var(--icon-orange)" : "var(--border)", background: on ? "var(--icon-orange)" : "transparent" }}>
                  {on && <CheckCircle2 size={12} color="white" />}
                </span>
                <span className="text-foreground/80">{q.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={compute}
          disabled={!ready}
          className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          See my Pregnancy Food Score <ArrowRight size={18} />
        </button>
        {!ready && <p className="mt-3 text-xs text-muted-foreground">Answer every question above to see your score.</p>}
      </div>
    </div>
  )
}
