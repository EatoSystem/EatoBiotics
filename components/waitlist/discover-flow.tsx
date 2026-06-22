"use client"

/**
 * components/waitlist/discover-flow.tsx
 *
 * The pre-launch "Meet the Food System Inside You" discovery — a vibrant,
 * animated 60-second quiz framed around the three engines of your inner food
 * system (Prebiotics, Probiotics, Postbiotics). It reveals one of the five
 * canonical profiles (via lib/quick-assessment.ts → the real scoring engine),
 * then invites the visitor to join the waitlist. On submit it posts everything
 * to /api/waitlist, which stores the lead + profile + segmentation context and
 * sends the instant result email.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowLeft, Sparkles, Check } from "lucide-react"
import { ScoreRing } from "@/components/assessment/score-ring"
import { WaitlistStatus } from "@/components/waitlist/waitlist-status"
import { getPercentile } from "@/lib/percentile"
import {
  QUICK_QUESTIONS,
  MAIN_GOAL_OPTIONS,
  FOOD_CHALLENGE_OPTIONS,
  DIET_OPTIONS,
  ENGINES,
  ANSWER_REACTIONS,
  computeQuickResult,
  type QuickPillar,
} from "@/lib/quick-assessment"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

const AGE_BRACKETS = ["Under 20", "20–29", "30–39", "40–49", "50–59", "60+"]

const COUNTRIES = [
  "Ireland", "United Kingdom", "United States", "Canada", "Australia",
  "New Zealand", "Germany", "France", "Spain", "Netherlands", "Other",
]

const ENGINE_ORDER: QuickPillar[] = ["prebiotics", "probiotics", "postbiotics"]

type Phase = "intro" | "questions" | "reveal" | "form" | "done"

const GOAL_STEP = QUICK_QUESTIONS.length
const CHALLENGE_STEP = QUICK_QUESTIONS.length + 1
const TOTAL_STEPS = QUICK_QUESTIONS.length + 2

const CARD = "overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_70px_-28px_rgba(26,46,18,0.30)]"

export function DiscoverFlow() {
  const rootRef = useRef<HTMLDivElement>(null)

  const [phase, setPhase] = useState<Phase>("intro")
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [mainGoal, setMainGoal] = useState("")
  const [foodChallenge, setFoodChallenge] = useState("")
  const [revealMounted, setRevealMounted] = useState(false)

  // Email gate fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [ageBracket, setAgeBracket] = useState("")
  const [country, setCountry] = useState("")
  const [diet, setDiet] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [message, setMessage] = useState("")
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [referredBy, setReferredBy] = useState<string | null>(null)
  const [reaction, setReaction] = useState<string | null>(null)
  const [introsSeen, setIntrosSeen] = useState<Set<QuickPillar>>(new Set())

  // Capture a referral code from the URL (?ref=CODE) for skip-the-line credit.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref")
    if (ref) setReferredBy(ref.trim().slice(0, 16))
  }, [])

  const result = useMemo(
    () => (phase === "reveal" || phase === "form" || phase === "done" ? computeQuickResult(answers) : null),
    [phase, answers]
  )

  // Keep the active step clear of the sticky site header.
  useEffect(() => {
    if (phase === "intro") return
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [phase, step])

  // Trigger the reveal bar fill once we reach the result.
  useEffect(() => {
    if (phase === "reveal" || phase === "form" || phase === "done") setRevealMounted(true)
  }, [phase])

  function pickAnswer(id: string, value: number, pillar: QuickPillar) {
    if (reaction) return
    setAnswers((a) => ({ ...a, [id]: value }))
    setReaction(ANSWER_REACTIONS[pillar][value] ?? null)
    setTimeout(() => { setReaction(null); setStep((s) => s + 1) }, 950)
  }

  function pickContext(setter: (v: string) => void, value: string, isLast: boolean) {
    setter(value)
    setTimeout(() => {
      if (isLast) setPhase("reveal")
      else setStep((s) => s + 1)
    }, 180)
  }

  function back() {
    if (step === 0) { setPhase("intro"); return }
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
        body: JSON.stringify({ email, name, ageBracket, country, diet, mainGoal, foodChallenge, referredBy, result }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; shareCode?: string }
      if (res.ok && data.ok) { setShareCode(data.shareCode ?? null); setPhase("done") }
      else { setStatus("error"); setMessage(data.error ?? "Something went wrong. Please try again.") }
    } catch {
      setStatus("error"); setMessage("Something went wrong. Please try again.")
    }
  }

  const inputCls = "w-full rounded-2xl border bg-card px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:ring-2"
  const inputStyle = { borderColor: "var(--border)", ["--tw-ring-color" as string]: "var(--icon-green)" }

  let content: ReactNode = null

  /* ── Intro hook ─────────────────────────────────────────────────────── */
  if (phase === "intro") {
    content = (
      <div key="intro" className={`animate-quiz-step ${CARD}`}>
        <div className="h-2 w-full brand-gradient" />
        <div className="p-7 text-center sm:p-10">
          <div className="relative mx-auto h-44 w-44">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 -z-10 rounded-full opacity-80 blur-3xl animate-pulse"
              style={{ background: "radial-gradient(60% 60% at 50% 45%, color-mix(in srgb, var(--icon-green) 38%, transparent), color-mix(in srgb, var(--icon-teal) 22%, transparent) 55%, transparent 78%)" }}
            />
            <Image src="/images/hero-gut.png" alt="The living food system inside you" fill sizes="176px" className="object-contain" priority />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[var(--icon-green)]">
            The Food System Inside You
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground sm:text-[2.6rem] text-balance">
            Meet the <span className="brand-gradient-text">living world</span> inside you.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            ~38 trillion microbes form a food system that shapes your energy, mood, digestion and
            long-term health. Most people never meet it. In 60 seconds, discover the state of yours.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            {ENGINE_ORDER.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
                style={{ background: ENGINES[p].gradient }}
              >
                {ENGINES[p].label}
              </span>
            ))}
          </div>
          <button
            onClick={() => { setPhase("questions"); setStep(0) }}
            className="brand-gradient mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold text-white shadow-[0_14px_30px_-10px_rgba(45,170,110,0.6)] transition-transform hover:-translate-y-0.5"
          >
            Meet my food system <ArrowRight size={16} />
          </button>
          <p className="mt-3 text-xs text-muted-foreground">Free · 60 seconds · No login</p>
        </div>
      </div>
    )
  }

  /* ── Done ──────────────────────────────────────────────────────────── */
  else if (phase === "done") {
    const reportUrl = shareCode ? `${SITE_URL}/discover/${shareCode}` : null
    content = (
      <div key="done" className="mx-auto max-w-md space-y-4">
        <div className={`animate-quiz-step ${CARD}`}>
          <div className="h-2 w-full brand-gradient" />
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-white brand-gradient shadow-[0_10px_24px_-8px_rgba(45,170,110,0.7)]">
              <Check size={26} />
            </div>
            <p className="font-serif text-2xl font-bold text-foreground">You&rsquo;re on the list</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We&rsquo;ve emailed your Food System Type and a snapshot of your three engines. Now climb
              the queue — invite friends to move up the line and unlock founding-member pricing.
            </p>
            {reportUrl && (
              <Link href={`/discover/${shareCode}`} className="brand-gradient mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5">
                View your mini report <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
        {reportUrl && result && shareCode && (
          <WaitlistStatus shareCode={shareCode} shareUrl={reportUrl} profileType={result.profile.type} overall={result.overall} />
        )}
      </div>
    )
  }

  /* ── Reveal + email gate ───────────────────────────────────────────── */
  else if ((phase === "reveal" || phase === "form") && result) {
    const { profile, overall, subScores, insights } = result
    const weakest = insights[0]
    content = (
      <div key={phase} className="animate-quiz-step">
        <div className={`relative ${CARD}`}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-64 opacity-70 blur-2xl"
            style={{ background: `radial-gradient(60% 80% at 50% 0%, color-mix(in srgb, ${profile.color} 28%, transparent), transparent 75%)` }}
          />
          <div className="h-2 w-full brand-gradient" />
          <div className="relative p-7 text-center sm:p-9">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: profile.color }}>
              Meet your food system
            </p>
            <ScoreRing
              score={overall}
              color={profile.color}
              gradientId="discover-reveal-ring"
              className="relative mx-auto mt-3 h-40 w-40"
            />
            <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl" style={{ color: profile.color }}>
              {profile.type}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {profile.tagline}
            </p>
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              Higher than {getPercentile(overall)}% of people with typical eating habits
            </p>

            {/* Three engines — animated bars */}
            <div className="mt-6 space-y-3.5 text-left">
              {ENGINE_ORDER.map((p) => {
                const eng = ENGINES[p]
                const value = subScores[p] ?? 0
                return (
                  <div key={p}>
                    <div className="mb-1 flex items-center justify-between text-xs font-bold">
                      <span style={{ color: eng.color }}>{eng.label}</span>
                      <span className="tabular-nums text-muted-foreground">{value}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-[width] duration-1000 ease-out"
                        style={{ width: revealMounted ? `${value}%` : "0%", background: eng.gradient }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {weakest && (
              <p className="mx-auto mt-5 max-w-md rounded-2xl px-4 py-3 text-left text-sm leading-relaxed text-muted-foreground"
                style={{ background: "color-mix(in srgb, var(--icon-green) 7%, transparent)" }}>
                <span className="font-semibold text-foreground">Your biggest opportunity: {weakest.label}.</span>{" "}
                {weakest.action}
              </p>
            )}
          </div>

          {/* Email gate */}
          <div className="relative border-t border-border p-7 sm:p-9">
            {phase === "reveal" ? (
              <>
                <p className="text-center font-serif text-xl font-bold text-foreground">
                  Be first through the door
                </p>
                <p className="mt-1.5 text-center text-sm text-muted-foreground">
                  Join the waitlist for early access. You&rsquo;ve got your snapshot — be first in line to
                  unlock your full EatoBiotics report the moment we launch.
                </p>
                <button
                  onClick={() => setPhase("form")}
                  className="brand-gradient mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold text-white shadow-[0_14px_30px_-10px_rgba(45,170,110,0.6)] transition-transform hover:-translate-y-0.5"
                >
                  Join the waitlist <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" autoComplete="given-name" required value={name}
                  onChange={(e) => setName(e.target.value)} placeholder="First name" className={inputCls} style={inputStyle} />
                <input type="email" inputMode="email" autoComplete="email" required value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
                  placeholder="you@email.com" className={inputCls} style={inputStyle} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <select required value={ageBracket} onChange={(e) => setAgeBracket(e.target.value)}
                    className="w-full rounded-2xl border bg-card px-4 py-3.5 text-sm text-foreground outline-none transition-all focus:ring-2" style={inputStyle}>
                    <option value="" disabled>Age</option>
                    {AGE_BRACKETS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <select required value={country} onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-2xl border bg-card px-4 py-3.5 text-sm text-foreground outline-none transition-all focus:ring-2" style={inputStyle}>
                    <option value="" disabled>Country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select required value={diet} onChange={(e) => setDiet(e.target.value)}
                    className="w-full rounded-2xl border bg-card px-4 py-3.5 text-sm text-foreground outline-none transition-all focus:ring-2" style={inputStyle}>
                    <option value="" disabled>Diet</option>
                    {DIET_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <button type="submit"
                  disabled={status === "loading" || !email || !name || !ageBracket || !country || !diet}
                  className="brand-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold text-white shadow-[0_14px_30px_-10px_rgba(45,170,110,0.6)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
                  {status === "loading" ? "Joining…" : <>Join the waitlist <ArrowRight size={16} /></>}
                </button>
                {status === "error" && <p className="text-sm font-medium text-red-500">{message}</p>}
                <p className="text-center text-xs text-muted-foreground">Free to join · Early access · No spam.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Questions + context ───────────────────────────────────────────── */
  else {
    const isGoal = step === GOAL_STEP
    const isChallenge = step === CHALLENGE_STEP
    const q = step < QUICK_QUESTIONS.length ? QUICK_QUESTIONS[step] : null
    const engine = q ? ENGINES[q.pillar] : null
    const accent = engine ? engine.color : "var(--icon-teal)"
    const gradient = engine ? engine.gradient : "linear-gradient(135deg, var(--icon-green), var(--icon-teal))"
    const activeEngineIndex = engine ? engine.index : 3
    // Show a "meet this engine" interstitial before the first question of each engine.
    const isFirstOfEngine = !!q && (step === 0 || QUICK_QUESTIONS[step - 1].pillar !== q.pillar)
    const showEngineIntro = !!q && !!engine && isFirstOfEngine && !introsSeen.has(q.pillar)

    content = (
      <>
        {/* Segmented engine progress */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            {ENGINE_ORDER.map((p) => {
              const eng = ENGINES[p]
              const reached = eng.index <= activeEngineIndex
              const isActive = !!engine && eng.index === activeEngineIndex
              return (
                <div key={p} className="relative h-2 flex-1 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: reached ? "100%" : "0%", background: eng.gradient, boxShadow: isActive ? `0 0 10px color-mix(in srgb, ${eng.color} 70%, transparent)` : "none" }} />
                  {isActive && (
                    <div aria-hidden className="absolute inset-0 rounded-full opacity-40 animate-pulse" style={{ background: eng.gradient }} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: accent }}>
              {q ? `Engine ${engine!.index} of 3 · ${engine!.label}` : "Almost there"}
            </span>
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">{step + 1}/{TOTAL_STEPS}</span>
          </div>
        </div>

        <div
          key={`q-${step}`}
          className={`animate-quiz-step relative ${CARD}`}
        >
          <div className="h-2 w-full" style={{ background: gradient }} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-40 opacity-60 blur-2xl"
            style={{ background: `radial-gradient(60% 80% at 50% 0%, color-mix(in srgb, ${accent} 26%, transparent), transparent 75%)` }}
          />
          <div className="relative p-6 sm:p-8">
            {/* "Meet this engine" interstitial */}
            {q && engine && showEngineIntro && (
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-sm" style={{ background: gradient }}>
                  Engine {engine.index} of 3
                </span>
                <h2 className="mt-4 font-serif text-3xl font-bold text-foreground">
                  {engine.label} <span className="text-base font-semibold" style={{ color: accent }}>· {engine.verb}</span>
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">{engine.fact}</p>
                <button
                  onClick={() => setIntrosSeen((s) => new Set(s).add(q.pillar))}
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                  style={{ background: gradient }}
                >
                  {engine.index === 1 ? "Let's begin" : "Continue"} <ArrowRight size={16} />
                </button>
              </div>
            )}

            {q && engine && !showEngineIntro && (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-sm" style={{ background: gradient }}>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px]">{engine.index}</span>
                  {engine.label} · {engine.verb}
                </span>
                <h2 className="mt-4 font-serif text-2xl font-bold leading-snug text-foreground sm:text-[1.7rem]">{q.text}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{q.subtitle}</p>
                <div className="mt-5 space-y-3">
                  {q.options.map((o) => {
                    const active = answers[q.id] === o.value
                    return (
                      <button
                        key={o.label}
                        onClick={() => pickAnswer(q.id, o.value, q.pillar)}
                        disabled={!!reaction}
                        className="relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl border py-4 pl-6 pr-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                        style={
                          active
                            ? { background: gradient, borderColor: "transparent", boxShadow: `0 14px 30px -12px color-mix(in srgb, ${accent} 70%, transparent)` }
                            : { background: "var(--card)", borderColor: `color-mix(in srgb, ${accent} 32%, transparent)` }
                        }
                      >
                        {!active && <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: gradient }} />}
                        <span>
                          <span className="block text-sm font-bold" style={{ color: active ? "white" : "var(--foreground)" }}>{o.label}</span>
                          <span className="mt-0.5 block text-xs" style={{ color: active ? "rgba(255,255,255,0.85)" : "var(--muted-foreground)" }}>{o.description}</span>
                        </span>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2"
                          style={{ borderColor: active ? "white" : `color-mix(in srgb, ${accent} 45%, transparent)`, background: active ? "rgba(255,255,255,0.25)" : "transparent" }}>
                          {active && <Check size={13} className="text-white" />}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {reaction && (
                  <div className="animate-quiz-step mt-4 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center text-sm font-semibold" style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}>
                    <Sparkles size={14} /> {reaction}
                  </div>
                )}
              </>
            )}

            {(isGoal || isChallenge) && (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-sm" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
                  <Sparkles size={13} /> {isChallenge ? "Last one" : "One more thing"}
                </span>
                <h2 className="mt-4 font-serif text-2xl font-bold leading-snug text-foreground sm:text-[1.7rem]">
                  {isGoal ? "If your food system could fix one thing first…" : "What gets in the way most?"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">We&rsquo;ll tailor your report around this.</p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {(isGoal ? MAIN_GOAL_OPTIONS : FOOD_CHALLENGE_OPTIONS).map((o) => {
                    const current = isGoal ? mainGoal : foodChallenge
                    const active = current === o.value
                    return (
                      <button
                        key={o.value}
                        onClick={() => pickContext(isGoal ? setMainGoal : setFoodChallenge, o.value, isChallenge)}
                        className="rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                        style={
                          active
                            ? { background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", borderColor: "transparent", color: "white", boxShadow: "0 12px 26px -12px rgba(45,170,110,0.7)" }
                            : { background: "var(--card)", borderColor: "color-mix(in srgb, var(--icon-green) 32%, transparent)", color: "var(--foreground)" }
                        }
                      >
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <button onClick={back} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={14} /> Back
        </button>
      </>
    )
  }

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-xl scroll-mt-28">
      {content}
    </div>
  )
}
