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

import { HealthConsentCheckbox } from "@/components/health-consent-checkbox"
import { HEALTH_CONSENT_REQUIRED_MESSAGE } from "@/lib/health-consent"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import posthog from "posthog-js"
import { ArrowRight, ArrowLeft, Sparkles, Check } from "lucide-react"
import { ScoreRing } from "@/components/assessment/score-ring"
import { WaitlistStatus } from "@/components/waitlist/waitlist-status"
import { CountryLeaderboard } from "@/components/waitlist/country-leaderboard"
import { WaitlistLangBar } from "@/components/waitlist/waitlist-lang-bar"
import { useTranslations } from "@/components/i18n/locale-provider"
import { interpolate } from "@/lib/i18n/config"
import { resolveMarket, marketByName, DEFAULT_MARKET, type FoodProfile } from "@/lib/market"
import { foodSet } from "@/lib/foods-by-country"
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
import { AGE_BRACKETS } from "@/lib/age-brackets"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

/** Fire a PostHog funnel event (consent-gated; safely no-ops pre-consent). */
function track(event: string, props?: Record<string, unknown>) {
  try { posthog.capture(event, props) } catch { /* analytics optional */ }
}


const COUNTRIES = [
  "Ireland", "United Kingdom", "United States", "Canada", "Australia",
  "New Zealand", "Germany", "France", "Spain", "Netherlands", "Other",
]

const ENGINE_ORDER: QuickPillar[] = ["prebiotics", "probiotics", "postbiotics"]

/** Standard UTM params captured from the /enter URL for campaign attribution. */
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const
type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>

type Phase = "intro" | "questions" | "form" | "done"

const GOAL_STEP = QUICK_QUESTIONS.length
const CHALLENGE_STEP = QUICK_QUESTIONS.length + 1
const TOTAL_STEPS = QUICK_QUESTIONS.length + 2

const CARD = "overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_70px_-28px_rgba(26,46,18,0.30)]"

export function DiscoverFlow({ defaultCountry }: { defaultCountry?: string } = {}) {
  const t = useTranslations()
  const tw = t.waitlist
  const rootRef = useRef<HTMLDivElement>(null)
  const [geoProfile, setGeoProfile] = useState<FoodProfile>(DEFAULT_MARKET.foodProfile)

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
  // Unticked by default — a pre-ticked box is not consent.
  const [healthConsent, setHealthConsent] = useState(false)
  const [country, setCountry] = useState("")
  const [diet, setDiet] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [message, setMessage] = useState("")
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [referredBy, setReferredBy] = useState<string | null>(null)
  const [utm, setUtm] = useState<Utm>({})
  const [reaction, setReaction] = useState<string | null>(null)
  const [introsSeen, setIntrosSeen] = useState<Set<QuickPillar>>(new Set())

  // Capture a referral code (?ref=CODE) + UTM campaign params from the URL.
  // UTM is first-touch: read from the URL, else restore from sessionStorage, then
  // persist so it survives the multi-step quiz. Fire a landing event so
  // landing→signup conversion is measurable per campaign.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const ref = params.get("ref")
    if (ref) {
      const code = ref.trim().slice(0, 16)
      setReferredBy(code)
      track("waitlist_referral_opened", { ref_code: code })
    }

    let captured: Utm = {}
    for (const k of UTM_KEYS) {
      const v = params.get(k)
      if (v) captured[k] = v.trim().slice(0, 120)
    }
    if (Object.keys(captured).length === 0) {
      try {
        const saved = sessionStorage.getItem("eb_utm")
        if (saved) captured = JSON.parse(saved) as Utm
      } catch { /* sessionStorage optional */ }
    } else {
      try { sessionStorage.setItem("eb_utm", JSON.stringify(captured)) } catch { /* optional */ }
    }
    if (Object.keys(captured).length) setUtm(captured)
    track("waitlist_landing", captured)
  }, [])

  // Localise by country: landing-page prop wins, else the eb_country geo cookie.
  useEffect(() => {
    let market = defaultCountry ? marketByName(defaultCountry) : null
    if (!market) {
      const code = document.cookie.split("; ").find((c) => c.startsWith("eb_country="))?.split("=")[1]
      market = resolveMarket(code)
    }
    setGeoProfile(market.foodProfile)
    if (market.name && COUNTRIES.includes(market.name)) setCountry(market.name)
  }, [defaultCountry])

  const result = useMemo(
    () => (phase === "form" || phase === "done" ? computeQuickResult(answers) : null),
    [phase, answers]
  )

  // Keep the active step clear of the sticky site header.
  useEffect(() => {
    if (phase === "intro") return
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [phase, step])

  // Trigger the result bar fill once we reach the done screen.
  useEffect(() => {
    if (phase === "done") setRevealMounted(true)
  }, [phase])

  // Funnel: the quiz is "completed" the moment the join form appears (fire once).
  const quizCompletedFired = useRef(false)
  useEffect(() => {
    if (phase === "form" && result && !quizCompletedFired.current) {
      quizCompletedFired.current = true
      track("waitlist_quiz_completed", { profile_type: result.profile.type, score: result.overall })
    }
  }, [phase, result])

  function pickAnswer(id: string, value: number, pillar: QuickPillar) {
    if (reaction) return
    setAnswers((a) => ({ ...a, [id]: value }))
    setReaction(tw.reactions[pillar][value] ?? ANSWER_REACTIONS[pillar][value] ?? null)
    setTimeout(() => { setReaction(null); setStep((s) => s + 1) }, 950)
  }

  function pickContext(setter: (v: string) => void, value: string, isLast: boolean) {
    setter(value)
    setTimeout(() => {
      if (isLast) setPhase("form")
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
    if (!healthConsent) {
      setStatus("error")
      setMessage(HEALTH_CONSENT_REQUIRED_MESSAGE)
      return
    }
    setStatus("loading")
    setMessage("")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, ageBracket, country, diet, mainGoal, foodChallenge, referredBy, ...utm, result, healthDataConsent: healthConsent }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; shareCode?: string }
      if (res.ok && data.ok) {
        setShareCode(data.shareCode ?? null); setPhase("done")
        track("waitlist_join_submitted", { profile_type: result.profile.type, score: result.overall, country: country || undefined, referred: !!referredBy })
      } else {
        setStatus("error"); setMessage(data.error ?? tw.form.genericError)
        track("waitlist_join_failed", { reason: data.error ?? "unknown" })
      }
    } catch {
      setStatus("error"); setMessage(tw.form.genericError)
      track("waitlist_join_failed", { reason: "network" })
    }
  }

  const inputCls = "w-full rounded-2xl border bg-card px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:ring-2"
  const inputStyle = { borderColor: "var(--border)", ["--tw-ring-color" as string]: "var(--icon-green)" }

  // Country-localised fermented-food examples (updates if the user picks a country).
  const activeProfile: FoodProfile = marketByName(country)?.foodProfile ?? geoProfile
  const fermentedExamples = foodSet(activeProfile).fermented

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
            <Image src="/images/assessment-hero.png" alt="The food system inside you" fill sizes="176px" className="object-contain" priority />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[var(--icon-green)]">
            {tw.intro.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground sm:text-[2.6rem] text-balance">
            {tw.intro.titleLead}<span className="brand-gradient-text">{tw.intro.titleHighlight}</span>{tw.intro.titleTail}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            {tw.intro.body}
          </p>
          <p className="mt-7 mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {tw.intro.bioticsHeader}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {ENGINE_ORDER.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
                style={{ background: ENGINES[p].gradient }}
              >
                {tw.engines[p].label}
              </span>
            ))}
          </div>
          <button
            onClick={() => {
              track("waitlist_quiz_started", { referred: !!referredBy, country: country || undefined })
              setPhase("questions"); setStep(0)
            }}
            className="brand-gradient mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold text-white shadow-[0_14px_30px_-10px_rgba(45,170,110,0.6)] transition-transform hover:-translate-y-0.5"
          >
            {tw.intro.cta} <ArrowRight size={16} />
          </button>
          <p className="mt-3 text-xs text-muted-foreground">{tw.intro.meta}</p>
        </div>
      </div>
    )
  }

  /* ── Done (join confirmed) → reveal the result here ─────────────────── */
  else if (phase === "done") {
    const reportUrl = shareCode ? `${SITE_URL}/discover/${shareCode}` : null
    content = (
      <div key="done" className="mx-auto max-w-md space-y-4">
        {/* Personalised result — revealed only after joining */}
        {result && (
          <div className={`relative animate-quiz-step ${CARD}`}>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-64 opacity-70 blur-2xl"
              style={{ background: `radial-gradient(60% 80% at 50% 0%, color-mix(in srgb, ${result.profile.color} 28%, transparent), transparent 75%)` }}
            />
            <div className="h-2 w-full brand-gradient" />
            <div className="relative p-7 text-center sm:p-9">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: result.profile.color }}>
                {tw.reveal.eyebrow}
              </p>
              <ScoreRing score={result.overall} color={result.profile.color} gradientId="discover-reveal-ring" className="relative mx-auto mt-3 h-40 w-40" />
              <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl" style={{ color: result.profile.color }}>
                {result.profile.type}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{result.profile.tagline}</p>

              <div className="mt-6 space-y-3.5 text-left">
                {ENGINE_ORDER.map((p) => {
                  const eng = ENGINES[p]
                  const value = result.subScores[p] ?? 0
                  return (
                    <div key={p}>
                      <div className="mb-1 flex items-center justify-between text-xs font-bold">
                        <span style={{ color: eng.color }}>{tw.engines[p].label}</span>
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

              {result.insights[0] && (
                <p className="mx-auto mt-5 max-w-md rounded-2xl px-4 py-3 text-left text-sm leading-relaxed text-muted-foreground"
                  style={{ background: "color-mix(in srgb, var(--icon-green) 7%, transparent)" }}>
                  <span className="font-semibold text-foreground">{interpolate(tw.reveal.biggestOpp, { label: result.insights[0].label })}</span>{" "}
                  {result.insights[0].action}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Join confirmation */}
        <div className={`animate-quiz-step ${CARD}`}>
          <div className="h-2 w-full brand-gradient" />
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-white brand-gradient shadow-[0_10px_24px_-8px_rgba(45,170,110,0.7)]">
              <Check size={26} />
            </div>
            <p className="font-serif text-2xl font-bold text-foreground">{tw.done.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {tw.done.body}
            </p>
            {reportUrl && (
              <Link href={`/discover/${shareCode}`} className="brand-gradient mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5">
                {tw.done.viewReport} <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
        {reportUrl && result && shareCode && (
          <WaitlistStatus shareCode={shareCode} shareUrl={reportUrl} profileType={result.profile.type} overall={result.overall} />
        )}
        {shareCode && <CountryLeaderboard shareCode={shareCode} />}
      </div>
    )
  }

  /* ── Email gate (straight after the last question) ──────────────────── */
  else if (phase === "form" && result) {
    content = (
      <div key="form" className="animate-quiz-step">
        <div className={`relative ${CARD}`}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-56 opacity-70 blur-2xl"
            style={{ background: "radial-gradient(60% 80% at 50% 0%, color-mix(in srgb, var(--icon-green) 26%, transparent), transparent 75%)" }}
          />
          <div className="h-2 w-full brand-gradient" />
          <div className="relative p-7 text-center sm:p-9">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white brand-gradient shadow-[0_10px_24px_-8px_rgba(45,170,110,0.7)]">
              <Sparkles size={22} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground sm:text-[1.7rem]">{tw.form.gateTitle}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{tw.form.gateBody}</p>
          </div>

          {/* Email gate */}
          <div className="relative border-t border-border p-7 sm:p-9">
            <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" autoComplete="given-name" required value={name}
                  onChange={(e) => setName(e.target.value)} placeholder={tw.form.firstName} className={inputCls} style={inputStyle} />
                <input type="email" inputMode="email" autoComplete="email" required value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
                  placeholder={tw.form.email} className={inputCls} style={inputStyle} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <select required value={ageBracket} onChange={(e) => setAgeBracket(e.target.value)}
                    className="w-full rounded-2xl border bg-card px-4 py-3.5 text-sm text-foreground outline-none transition-all focus:ring-2" style={inputStyle}>
                    <option value="" disabled>{tw.form.age}</option>
                    {AGE_BRACKETS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <select required value={country} onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-2xl border bg-card px-4 py-3.5 text-sm text-foreground outline-none transition-all focus:ring-2" style={inputStyle}>
                    <option value="" disabled>{tw.form.country}</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select required value={diet} onChange={(e) => setDiet(e.target.value)}
                    className="w-full rounded-2xl border bg-card px-4 py-3.5 text-sm text-foreground outline-none transition-all focus:ring-2" style={inputStyle}>
                    <option value="" disabled>{tw.form.diet}</option>
                    {DIET_OPTIONS.map((d) => <option key={d.value} value={d.value}>{tw.diets[d.value as keyof typeof tw.diets] ?? d.label}</option>)}
                  </select>
                </div>
                <button type="submit"
                  disabled={status === "loading" || !email || !name || !ageBracket || !country || !diet}
                  className="brand-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold text-white shadow-[0_14px_30px_-10px_rgba(45,170,110,0.6)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
                  {status === "loading" ? tw.form.joining : <>{tw.form.joinCta} <ArrowRight size={16} /></>}
                </button>
                <HealthConsentCheckbox checked={healthConsent} onChange={setHealthConsent} />
                {status === "error" && <p className="text-sm font-medium text-red-600">{message}</p>}
                <p className="text-center text-xs text-muted-foreground">{tw.form.consent}</p>
            </form>
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
              {q ? interpolate(tw.progress.engineOf, { index: engine!.index, label: tw.engines[q.pillar].label }) : tw.progress.almostThere}
            </span>
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">{interpolate(tw.progress.stepCount, { step: step + 1, total: TOTAL_STEPS })}</span>
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
            {/* "Meet this biotic" educational interstitial */}
            {q && engine && showEngineIntro && (
              <div className="text-center">
                {/* Gradient emblem with the engine number */}
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl font-serif text-2xl font-bold text-white shadow-[0_12px_28px_-10px_rgba(45,170,110,0.6)]"
                  style={{ background: gradient }}
                >
                  {engine.index}
                </div>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {interpolate(tw.progress.interstitialBadge, { index: engine.index })}
                </p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-foreground">{tw.engines[q.pillar].label}</h2>
                <span
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white shadow-sm"
                  style={{ background: gradient }}
                >
                  {tw.engines[q.pillar].verb}
                </span>
                <p className="mx-auto mt-4 max-w-md text-base font-semibold leading-snug text-foreground">
                  {tw.engines[q.pillar].whatItIs}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {tw.engines[q.pillar].fact}
                </p>
                {/* Examples — probiotics uses the country-localised fermented foods */}
                <p
                  className="mx-auto mt-4 max-w-md rounded-2xl px-4 py-2.5 text-sm font-medium leading-relaxed"
                  style={{ background: `color-mix(in srgb, ${accent} 9%, transparent)`, color: accent }}
                >
                  {q.pillar === "probiotics"
                    ? interpolate(tw.probioticsSubtitle, { foods: fermentedExamples })
                    : tw.engines[q.pillar].examples}
                </p>
                <button
                  onClick={() => setIntrosSeen((s) => new Set(s).add(q.pillar))}
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                  style={{ background: gradient }}
                >
                  {engine.index === 1 ? tw.progress.begin : tw.progress.continue} <ArrowRight size={16} />
                </button>
              </div>
            )}

            {q && engine && !showEngineIntro && (() => {
              const tq = tw.questions[q.id as keyof typeof tw.questions]
              return (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-sm" style={{ background: gradient }}>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px]">{engine.index}</span>
                  {tw.engines[q.pillar].label} · {tw.engines[q.pillar].verb}
                </span>
                <h2 className="mt-4 font-serif text-2xl font-bold leading-snug text-foreground sm:text-[1.7rem]">{tq.text}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {q.pillar === "probiotics" ? interpolate(tw.probioticsSubtitle, { foods: fermentedExamples }) : tq.subtitle}
                </p>
                <div className="mt-5 space-y-3">
                  {q.options.map((o, oi) => {
                    const active = answers[q.id] === o.value
                    const opt = tq.options[oi] ?? { label: o.label, description: o.description }
                    return (
                      <button
                        key={o.value}
                        onClick={() => pickAnswer(q.id, o.value, q.pillar)}
                        disabled={!!reaction}
                        className="relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl border py-4 pl-6 pr-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                        style={
                          active
                            ? { background: gradient, borderColor: "transparent", boxShadow: `0 14px 30px -12px color-mix(in srgb, ${accent} 70%, transparent)` }
                            : { background: "var(--card)", borderColor: `color-mix(in srgb, ${accent} 32%, transparent)` }
                        }
                      >
                        {!active && <span aria-hidden className="absolute inset-y-0 start-0 w-1.5" style={{ background: gradient }} />}
                        <span>
                          <span className="block text-sm font-bold" style={{ color: active ? "white" : "var(--foreground)" }}>{opt.label}</span>
                          <span className="mt-0.5 block text-xs" style={{ color: active ? "rgba(255,255,255,0.85)" : "var(--muted-foreground)" }}>{opt.description}</span>
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
              )
            })()}

            {(isGoal || isChallenge) && (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-sm" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
                  <Sparkles size={13} /> {isChallenge ? tw.context.challengeBadge : tw.context.goalBadge}
                </span>
                <h2 className="mt-4 font-serif text-2xl font-bold leading-snug text-foreground sm:text-[1.7rem]">
                  {isGoal ? tw.context.goalTitle : tw.context.challengeTitle}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{tw.context.tailor}</p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {(isGoal ? MAIN_GOAL_OPTIONS : FOOD_CHALLENGE_OPTIONS).map((o) => {
                    const current = isGoal ? mainGoal : foodChallenge
                    const active = current === o.value
                    const label = isGoal
                      ? (tw.goals[o.value as keyof typeof tw.goals] ?? o.label)
                      : (tw.challenges[o.value as keyof typeof tw.challenges] ?? o.label)
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
                        {label}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <button onClick={back} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={14} /> {tw.progress.back}
        </button>
      </>
    )
  }

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-xl scroll-mt-28">
      {phase === "intro" && <WaitlistLangBar />}
      {content}
    </div>
  )
}
