"use client"

/**
 * components/waitlist/discover-flow.tsx
 *
 * The pre-launch "Discover Your Food System Type" flow. A very short, client-
 * scored quiz that reveals one of the five canonical food-system profiles
 * (reusing lib/quick-assessment.ts → the real scoring engine), then invites the
 * visitor to join the waitlist for their full launch report. On submit it posts
 * everything to /api/waitlist, which stores the lead + profile + segmentation
 * context and sends the instant result email.
 */

import { useMemo, useState } from "react"
import { ArrowRight, ArrowLeft, Sparkles, Check } from "lucide-react"
import {
  QUICK_QUESTIONS,
  MAIN_GOAL_OPTIONS,
  FOOD_CHALLENGE_OPTIONS,
  DIET_OPTIONS,
  computeQuickResult,
} from "@/lib/quick-assessment"

const AGE_BRACKETS = ["Under 20", "20–29", "30–39", "40–49", "50–59", "60+"]

const COUNTRIES = [
  "Ireland",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "New Zealand",
  "Germany",
  "France",
  "Spain",
  "Netherlands",
  "Other",
]

type Phase = "questions" | "reveal" | "form" | "done"

// The "questions" phase walks scored questions, then goal, then challenge.
const GOAL_STEP = QUICK_QUESTIONS.length
const CHALLENGE_STEP = QUICK_QUESTIONS.length + 1
const TOTAL_STEPS = QUICK_QUESTIONS.length + 2

export function DiscoverFlow() {
  const [phase, setPhase] = useState<Phase>("questions")
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [mainGoal, setMainGoal] = useState("")
  const [foodChallenge, setFoodChallenge] = useState("")

  // Email gate fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [ageBracket, setAgeBracket] = useState("")
  const [country, setCountry] = useState("")
  const [diet, setDiet] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [message, setMessage] = useState("")

  const result = useMemo(
    () => (phase === "reveal" || phase === "form" || phase === "done" ? computeQuickResult(answers) : null),
    [phase, answers]
  )

  function pickAnswer(id: string, value: number) {
    setAnswers((a) => ({ ...a, [id]: value }))
    setTimeout(() => setStep((s) => s + 1), 160)
  }

  function pickContext(setter: (v: string) => void, value: string, isLast: boolean) {
    setter(value)
    setTimeout(() => {
      if (isLast) setPhase("reveal")
      else setStep((s) => s + 1)
    }, 160)
  }

  function back() {
    if (step === 0) return
    setStep((s) => s - 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === "loading" || !result) return
    setStatus("loading")
    setMessage("")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          ageBracket,
          country,
          diet,
          mainGoal,
          foodChallenge,
          result,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) {
        setPhase("done")
      } else {
        setStatus("error")
        setMessage(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      setStatus("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  /* ── Done ──────────────────────────────────────────────────────────── */
  if (phase === "done") {
    return (
      <div className="mx-auto w-full max-w-md">
        <div
          className="rounded-3xl border border-border bg-card p-7 text-center"
          style={{ boxShadow: "0 16px 50px -28px rgba(76, 182, 72, 0.55)" }}
        >
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white brand-gradient"
          >
            <Check size={22} />
          </div>
          <p className="font-serif text-xl font-bold text-foreground">You&rsquo;re on the list</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We&rsquo;ve emailed your Food System Type and a snapshot of your scores. When EatoBiotics
            opens you&rsquo;ll be first to get your full personalised report. Thank you for joining the
            movement.
          </p>
        </div>
      </div>
    )
  }

  /* ── Reveal + email gate ───────────────────────────────────────────── */
  if ((phase === "reveal" || phase === "form") && result) {
    const { profile, overall, subScores } = result
    const r = 50
    const circ = 2 * Math.PI * r
    const bars: { label: string; value: number }[] = [
      { label: "Prebiotics", value: subScores.prebiotics ?? 0 },
      { label: "Probiotics", value: subScores.probiotics ?? 0 },
      { label: "Postbiotics", value: subScores.postbiotics ?? 0 },
    ]
    return (
      <div className="mx-auto w-full max-w-xl">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_18px_60px_-24px_rgba(26,46,18,0.28)]">
          <div className="h-1.5 w-full brand-gradient" />
          <div className="p-7 text-center sm:p-9">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: profile.color }}>
              Your Food System Type
            </p>
            <div className="relative mx-auto mt-4 h-[128px] w-[128px]">
              <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                <circle cx="64" cy="64" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle
                  cx="64"
                  cy="64"
                  r={r}
                  fill="none"
                  stroke={profile.color}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(overall / 100) * circ} ${circ}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-4xl font-bold text-foreground">{overall}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
            <h2 className="mt-4 font-serif text-2xl font-bold sm:text-3xl" style={{ color: profile.color }}>
              {profile.type}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {profile.tagline}
            </p>

            {/* Biotic mini-bars */}
            <div className="mt-6 space-y-3 text-left">
              {bars.map((b) => (
                <div key={b.label}>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold text-foreground">
                    <span>{b.label}</span>
                    <span className="tabular-nums text-muted-foreground">{b.value}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${b.value}%`, background: profile.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email gate */}
          <div className="border-t border-border p-7 sm:p-9">
            {phase === "reveal" ? (
              <>
                <p className="text-center font-serif text-lg font-bold text-foreground">
                  Get your full report at launch
                </p>
                <p className="mt-1.5 text-center text-sm text-muted-foreground">
                  Join the waitlist and we&rsquo;ll send your complete personalised report — built around
                  your type — the moment EatoBiotics opens.
                </p>
                <button
                  onClick={() => setPhase("form")}
                  className="brand-gradient mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
                >
                  Join the waitlist <ArrowRight size={15} />
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  autoComplete="given-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="First name"
                  className="w-full rounded-2xl border bg-card px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:ring-2"
                  style={{ borderColor: "var(--border)", ["--tw-ring-color" as string]: "var(--icon-green)" }}
                />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
                  placeholder="you@email.com"
                  className="w-full rounded-2xl border bg-card px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:ring-2"
                  style={{ borderColor: "var(--border)", ["--tw-ring-color" as string]: "var(--icon-green)" }}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <select
                    required
                    value={ageBracket}
                    onChange={(e) => setAgeBracket(e.target.value)}
                    className="w-full rounded-2xl border bg-card px-4 py-3.5 text-sm text-foreground outline-none transition-all focus:ring-2"
                    style={{ borderColor: "var(--border)", ["--tw-ring-color" as string]: "var(--icon-green)" }}
                  >
                    <option value="" disabled>Age</option>
                    {AGE_BRACKETS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <select
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-2xl border bg-card px-4 py-3.5 text-sm text-foreground outline-none transition-all focus:ring-2"
                    style={{ borderColor: "var(--border)", ["--tw-ring-color" as string]: "var(--icon-green)" }}
                  >
                    <option value="" disabled>Country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    required
                    value={diet}
                    onChange={(e) => setDiet(e.target.value)}
                    className="w-full rounded-2xl border bg-card px-4 py-3.5 text-sm text-foreground outline-none transition-all focus:ring-2"
                    style={{ borderColor: "var(--border)", ["--tw-ring-color" as string]: "var(--icon-green)" }}
                  >
                    <option value="" disabled>Diet</option>
                    {DIET_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={status === "loading" || !email || !name || !ageBracket || !country || !diet}
                  className="brand-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {status === "loading" ? "Joining…" : <>Send my report at launch <ArrowRight size={15} /></>}
                </button>
                {status === "error" && <p className="text-sm font-medium text-red-500">{message}</p>}
                <p className="text-center text-xs text-muted-foreground">
                  Free to join · Early access · No spam.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Questions + context ───────────────────────────────────────────── */
  const pct = Math.round((step / TOTAL_STEPS) * 100)
  const isGoal = step === GOAL_STEP
  const isChallenge = step === CHALLENGE_STEP
  const q = step < QUICK_QUESTIONS.length ? QUICK_QUESTIONS[step] : null

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Progress */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" }}
          />
        </div>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
          {step + 1}/{TOTAL_STEPS}
        </span>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-border bg-card p-7 shadow-[0_18px_60px_-24px_rgba(26,46,18,0.22)] sm:p-9">
        {q && (
          <>
            <h2 className="font-serif text-2xl font-bold leading-snug text-foreground">{q.text}</h2>
            <div className="mt-5 space-y-2.5">
              {q.options.map((o) => {
                const active = answers[q.id] === o.value
                return (
                  <button
                    key={o.label}
                    onClick={() => pickAnswer(q.id, o.value)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all"
                    style={{
                      borderColor: active ? "var(--icon-green)" : "var(--border)",
                      background: active ? "color-mix(in srgb, var(--icon-green) 8%, white)" : "var(--card)",
                    }}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{o.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{o.description}</span>
                    </span>
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border-2"
                      style={{ borderColor: active ? "var(--icon-green)" : "var(--border)", background: active ? "var(--icon-green)" : "transparent" }}
                    />
                  </button>
                )
              })}
            </div>
          </>
        )}

        {(isGoal || isChallenge) && (
          <>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>
              <Sparkles size={14} /> {isChallenge ? "Last one" : "Quick context"}
            </div>
            <h2 className="mt-3 font-serif text-2xl font-bold leading-snug text-foreground">
              {isGoal ? "What's your main health goal?" : "What's your biggest food challenge?"}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">We&rsquo;ll tailor your report around this.</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {(isGoal ? MAIN_GOAL_OPTIONS : FOOD_CHALLENGE_OPTIONS).map((o) => {
                const current = isGoal ? mainGoal : foodChallenge
                const active = current === o.value
                return (
                  <button
                    key={o.value}
                    onClick={() =>
                      pickContext(isGoal ? setMainGoal : setFoodChallenge, o.value, isChallenge)
                    }
                    className="rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-all"
                    style={{
                      borderColor: active ? "var(--icon-green)" : "var(--border)",
                      background: active ? "color-mix(in srgb, var(--icon-green) 8%, white)" : "var(--card)",
                      color: "var(--foreground)",
                    }}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {step > 0 && (
        <button onClick={back} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={14} /> Back
        </button>
      )}
    </div>
  )
}
