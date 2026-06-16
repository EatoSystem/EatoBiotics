"use client"

/**
 * components/eatobetics/glp1-check.tsx
 *
 * A short, self-contained "muscle-preservation readiness" check for people on
 * (or considering) a GLP-1. Scored entirely client-side — no backend, no PII.
 * Produces a 0–100 readiness score, a band, and tailored recommendations.
 * Educational only — not medical or dietetic advice.
 */

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ArrowLeft, Dumbbell, RotateCcw, Check } from "lucide-react"

type Choice = { label: string; value: number }
type Question = {
  id: "stage" | "protein" | "resistance" | "intake" | "energy"
  weight: number // 0 = context only (unscored)
  q: string
  sub?: string
  choices: Choice[]
}

const QUESTIONS: Question[] = [
  {
    id: "stage", weight: 0,
    q: "Where are you with a GLP-1?",
    sub: "Ozempic, Wegovy, Mounjaro, or similar.",
    choices: [
      { label: "Considering it", value: 0 },
      { label: "Just started", value: 1 },
      { label: "A few months in", value: 2 },
      { label: "Long-term", value: 3 },
    ],
  },
  {
    id: "protein", weight: 30,
    q: "Do you eat a protein-rich food at every meal?",
    sub: "Protein is your number-one muscle-protecting lever.",
    choices: [
      { label: "Rarely", value: 0 },
      { label: "Sometimes", value: 0.4 },
      { label: "Most meals", value: 0.75 },
      { label: "Every meal", value: 1 },
    ],
  },
  {
    id: "resistance", weight: 30,
    q: "How often do you do strength or resistance exercise?",
    sub: "It tells your body to hold on to muscle.",
    choices: [
      { label: "Never", value: 0 },
      { label: "Now and then", value: 0.4 },
      { label: "1–2× a week", value: 0.75 },
      { label: "3+× a week", value: 1 },
    ],
  },
  {
    id: "intake", weight: 25,
    q: "Overall, are you eating enough?",
    sub: "A very low intake makes muscle harder to keep.",
    choices: [
      { label: "I struggle to eat much", value: 0 },
      { label: "Eating a lot less", value: 0.45 },
      { label: "Somewhat less", value: 0.8 },
      { label: "About normal", value: 1 },
    ],
  },
  {
    id: "energy", weight: 15,
    q: "How's your strength and energy lately?",
    choices: [
      { label: "Declining", value: 0 },
      { label: "About the same", value: 0.6 },
      { label: "Improving", value: 1 },
    ],
  },
]

const SYMPTOMS = [
  { key: "nausea", label: "Nausea" },
  { key: "fullness", label: "Early fullness" },
  { key: "constipation", label: "Constipation" },
  { key: "fatigue", label: "Fatigue" },
  { key: "none", label: "None of these" },
]

type Tip = { title: string; body: string }

function buildTips(ans: Record<string, number>, symptoms: string[]): Tip[] {
  const tips: Tip[] = []
  if ((ans.protein ?? 1) < 0.75)
    tips.push({ title: "Lead with protein", body: "Anchor every meal with a protein source first — eggs, yoghurt, fish, chicken, tofu, or legumes. Aim for a steady daily total." })
  if ((ans.resistance ?? 1) < 0.75)
    tips.push({ title: "Add two strength sessions", body: "Two short resistance sessions a week — even bodyweight or bands — are enough to signal your body to keep muscle." })
  if ((ans.intake ?? 1) < 0.8)
    tips.push({ title: "Make every bite count", body: "On a low appetite, eat protein and vegetables first while you have room. A protein shake can bridge the gap on tough days." })
  if (symptoms.includes("nausea"))
    tips.push({ title: "Ease nausea", body: "Smaller, slower, blander meals. Lean on protein-rich, low-grease options and sip fluids between meals rather than during." })
  if (symptoms.includes("constipation"))
    tips.push({ title: "Stay regular", body: "Build fibre up gradually, keep fluids high, and take a short walk after meals — it helps digestion and glucose alike." })
  if (symptoms.includes("fullness"))
    tips.push({ title: "Work with early fullness", body: "Eat protein first while you have appetite, and drink between meals so liquid doesn't crowd out food." })
  if ((ans.energy ?? 1) === 0)
    tips.push({ title: "Act on declining energy", body: "Falling strength is the key signal to protect muscle now — pair your protein target with regular resistance work." })
  return tips.slice(0, 3)
}

function band(score: number): { label: string; color: string; blurb: string } {
  if (score >= 80) return { label: "Strong muscle protection", color: "var(--icon-green)", blurb: "You're doing the things that protect muscle while you lose weight. Keep the rhythm going." }
  if (score >= 55) return { label: "Good foundation, a few gaps", color: "var(--icon-yellow)", blurb: "You've got real strengths — a couple of tweaks will lock in your muscle while the weight comes off." }
  return { label: "Let's protect your muscle", color: "var(--icon-orange)", blurb: "There's a clear opportunity here. Small, specific changes now will protect the muscle you most want to keep." }
}

export function Glp1Check() {
  const [step, setStep] = useState(0) // 0..QUESTIONS.length-1, then symptoms, then result
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [symptoms, setSymptoms] = useState<string[]>([])

  const total = QUESTIONS.length + 1 // questions + symptoms step
  const isSymptoms = step === QUESTIONS.length
  const isResult = step > QUESTIONS.length

  function pick(qid: string, value: number) {
    setAnswers((a) => ({ ...a, [qid]: value }))
    setTimeout(() => setStep((s) => s + 1), 160)
  }

  function toggleSymptom(key: string) {
    setSymptoms((prev) => {
      if (key === "none") return prev.includes("none") ? [] : ["none"]
      const next = prev.filter((k) => k !== "none")
      return next.includes(key) ? next.filter((k) => k !== key) : [...next, key]
    })
  }

  function reset() {
    setStep(0); setAnswers({}); setSymptoms([])
  }

  // Score
  const scored = QUESTIONS.filter((q) => q.weight > 0)
  const earned = scored.reduce((s, q) => s + (answers[q.id] ?? 0) * q.weight, 0)
  const penalty = Math.min(15, symptoms.filter((k) => k !== "none").length * 5)
  const score = Math.max(0, Math.min(100, Math.round(earned - penalty)))

  // ── Result ──
  if (isResult) {
    const b = band(score)
    const tips = buildTips(answers, symptoms)
    const r = 54, circ = 2 * Math.PI * r
    return (
      <div className="mx-auto max-w-xl">
        <div className="overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white shadow-[0_18px_60px_-24px_rgba(26,46,18,0.28)]">
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange), var(--icon-green))" }} />
          <div className="p-7 text-center sm:p-9">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>Your muscle-protection readiness</p>
            <div className="relative mx-auto mt-4 h-[136px] w-[136px]">
              <svg width="136" height="136" viewBox="0 0 136 136" className="-rotate-90">
                <circle cx="68" cy="68" r={r} fill="none" stroke="var(--border)" strokeWidth="11" />
                <circle cx="68" cy="68" r={r} fill="none" stroke={b.color} strokeWidth="11" strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * circ} ${circ}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-4xl font-bold" style={{ color: "var(--foreground)" }}>{score}</span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>/ 100</span>
              </div>
            </div>
            <h2 className="mt-4 font-serif text-2xl font-bold" style={{ color: b.color }}>{b.label}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{b.blurb}</p>
          </div>

          {tips.length > 0 && (
            <div className="border-t border-black/[0.06] p-7 sm:p-9">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Your top moves</p>
              <div className="mt-4 space-y-3">
                {tips.map((t) => (
                  <div key={t.title} className="flex items-start gap-3 rounded-2xl bg-[#f4f8f0] p-4">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style={{ background: "var(--icon-green)" }}><Check size={12} /></span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{t.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{t.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-black/[0.06] p-7 sm:p-9">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/glucose/assessment" className="brand-gradient inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90">
                Take the full assessment <ArrowRight size={15} />
              </Link>
              <Link href="/account/glp1" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-black/[0.03]" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                Open the Companion
              </Link>
            </div>
            <button onClick={reset} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">
              <RotateCcw size={12} /> Retake the check
            </button>
          </div>
        </div>
        <p className="mx-auto mt-5 max-w-md text-center text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Educational only — not medical or dietetic advice. GLP-1 medications should be managed by a qualified clinician.
        </p>
      </div>
    )
  }

  const pct = Math.round((step / total) * 100)

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" }} />
        </div>
        <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--muted-foreground)" }}>{step + 1}/{total}</span>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white p-7 shadow-[0_18px_60px_-24px_rgba(26,46,18,0.22)] sm:p-9">
        {isSymptoms ? (
          <>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>
              <Dumbbell size={14} /> Almost there
            </div>
            <h2 className="mt-3 font-serif text-2xl font-bold leading-snug" style={{ color: "var(--foreground)" }}>Any of these affecting you right now?</h2>
            <p className="mt-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>Select any that apply — we'll tailor your tips.</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {SYMPTOMS.map((s) => {
                const active = symptoms.includes(s.key)
                return (
                  <button key={s.key} onClick={() => toggleSymptom(s.key)}
                    className="rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-all"
                    style={{ borderColor: active ? "var(--icon-green)" : "var(--border)", background: active ? "color-mix(in srgb, var(--icon-green) 8%, white)" : "white", color: "var(--foreground)" }}>
                    {s.label}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setStep((s) => s + 1)}
              className="brand-gradient mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90">
              See my result <ArrowRight size={15} />
            </button>
          </>
        ) : (
          <>
            <h2 className="font-serif text-2xl font-bold leading-snug" style={{ color: "var(--foreground)" }}>{QUESTIONS[step].q}</h2>
            {QUESTIONS[step].sub && <p className="mt-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>{QUESTIONS[step].sub}</p>}
            <div className="mt-5 space-y-2.5">
              {QUESTIONS[step].choices.map((c) => {
                const active = answers[QUESTIONS[step].id] === c.value
                return (
                  <button key={c.label} onClick={() => pick(QUESTIONS[step].id, c.value)}
                    className="flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left text-sm font-semibold transition-all"
                    style={{ borderColor: active ? "var(--icon-green)" : "var(--border)", background: active ? "color-mix(in srgb, var(--icon-green) 8%, white)" : "white", color: "var(--foreground)" }}>
                    {c.label}
                    <span className="h-4 w-4 shrink-0 rounded-full border-2" style={{ borderColor: active ? "var(--icon-green)" : "var(--border)", background: active ? "var(--icon-green)" : "transparent" }} />
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {step > 0 && (
        <button onClick={() => setStep((s) => s - 1)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={14} /> Back
        </button>
      )}
    </div>
  )
}
