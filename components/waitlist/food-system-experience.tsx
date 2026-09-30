"use client"

/**
 * The opening of EatoBiotics — hero, assessment, score, and the place claimed.
 *
 * One component owns the whole opening, because it is one experience:
 *
 *     idle → intro → questions → building → reveal → claim → done
 *
 * `idle` IS the hero. Starting the assessment does not navigate anywhere — the
 * hero is replaced in place, so /enter stays the URL and nothing in proxy.ts,
 * lib/v1-surface.ts or the sitemap moves. It also means the figure the visitor
 * was just looking at is the same element that resolves into their score.
 *
 * ── What is deliberately NOT here ───────────────────────────────────────────
 *
 * The questions, their wording, their values and the scoring are untouched:
 * QUICK_QUESTIONS and computeQuickResult come from lib/quick-assessment.ts,
 * which runs the real engine in lib/assessment-scoring.ts. This file decides
 * how the assessment LOOKS and in what order its steps happen. It computes
 * nothing.
 *
 * ── The reveal comes before the ask ─────────────────────────────────────────
 *
 * The flow this replaces asked for an email BEFORE showing any result. The
 * score is now given first and the place is claimed after, so the reveal is
 * something the visitor receives rather than something they are charged for.
 * The two segmentation questions (goal, challenge) moved into the claim step:
 * they are not scored, and asking them mid-run would have made a five-question
 * assessment a seven-question one, which is a different product from a five-
 * question one.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import posthog from "posthog-js"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { HeroVideo } from "@/components/hero-video"
import { ScoreRing } from "@/components/assessment/score-ring"
import { usePrefersReducedMotion } from "@/components/assessment/result/use-reduced-motion"
import { HealthConsentCheckbox } from "@/components/health-consent-checkbox"
import { HEALTH_CONSENT_REQUIRED_MESSAGE } from "@/lib/health-consent"
import { useTranslations } from "@/components/i18n/locale-provider"
import { AGE_BRACKETS } from "@/lib/age-brackets"
import { pillarBehaviour } from "@/lib/pillars"
import { resolveMarket, DEFAULT_MARKET, type FoodProfile } from "@/lib/market"
import { submitWaitlistJoin, type WaitlistUtm } from "@/lib/waitlist/join"
import { CONSUMER_CAMPAIGN, type CampaignContext } from "@/lib/waitlist/campaign"
import { joinCtaLabel, cohortNameInSentence } from "@/lib/waitlist/early-access"
import { useCohort } from "./use-cohort"
import { CohortLine } from "./cohort-line"
import {
  QUICK_QUESTIONS,
  ENGINES,
  MAIN_GOAL_OPTIONS,
  FOOD_CHALLENGE_OPTIONS,
  DIET_OPTIONS,
  computeQuickResult,
  type QuickPillar,
} from "@/lib/quick-assessment"

type Phase = "idle" | "intro" | "questions" | "building" | "reveal" | "claim" | "done"

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const

const COUNTRIES = [
  "Ireland", "United Kingdom", "United States", "Canada", "Australia",
  "New Zealand", "Germany", "France", "Spain", "Netherlands", "Other",
]

/*
 * SECONDS_PER_QUESTION was here.
 *
 * It existed so the headline's "sixty seconds" and the in-flow estimate came
 * from one number rather than one being marketing and the other arithmetic —
 * a good rule, for a claim the product no longer makes. With no time claim
 * anywhere on this page there is nothing left for it to keep honest, and an
 * exported constant nobody can explain is worse than one that explains itself.
 *
 * Removed rather than left unused. `progressCue` below now reports position,
 * not pace.
 */

/**
 * What the progress line says, given how many questions are answered.
 *
 * ══ IT NO LONGER COUNTS SECONDS ═════════════════════════════════════════════
 *
 * This returned "~45 seconds left", derived from SECONDS_PER_QUESTION. The
 * arithmetic was honest and the framing was not: EatoBiotics is about
 * understanding a food system and improving it over time, and a stopwatch in
 * the corner argues the opposite on every screen. Removing the claim from the
 * hero while leaving it running mid-flow would have moved it, not retired it.
 *
 * What remains is position, which is the thing a progress cue is actually for:
 * how far through am I, and am I nearly done. No number that implies a pace,
 * and nothing replacing one time claim with another.
 */
export function progressCue(answered: number, total: number): string {
  const left = Math.max(total - answered, 0)
  if (left <= 0) return "Almost there"
  if (left === 1) return "Last question"
  if (answered === 0) return "Let's begin"
  return `${left} to go`
}

/**
 * The result, or null while the run is incomplete.
 *
 * Extracted and exported for the same reason as `cohortLineText`: inside the
 * component's useMemo this decision is unreachable from vitest, and a mutation
 * that computed a score from a half-finished run changed no test. A score is
 * the one thing on this page a visitor will act on, so "it is only ever the
 * whole run's score" needs to be a checkable statement.
 */
export function resultForAnswers(
  answers: Record<string, number>,
): ReturnType<typeof computeQuickResult> | null {
  const complete = QUICK_QUESTIONS.every((q) => typeof answers[q.id] === "number")
  return complete ? computeQuickResult(answers) : null
}

/** Fire a PostHog funnel event (consent-gated; safely no-ops pre-consent). */
function track(event: string, props?: Record<string, unknown>) {
  try { posthog.capture(event, props) } catch { /* analytics optional */ }
}

const GRADIENT_BAR =
  "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))"

export function FoodSystemExperience({
  campaign = CONSUMER_CAMPAIGN,
  onIdleChange,
}: {
  campaign?: CampaignContext
  /**
   * Called with `false` the moment the hero is replaced by the assessment, and
   * `true` if the visitor comes back to it.
   *
   * The page needs this because the experience swaps the hero IN PLACE: the
   * 100 Systems section now sits directly beneath, so without it a visitor on
   * question three would have "Add My System" sitting under the question — a
   * second call to action competing with the one they are already answering.
   * The old layout avoided that only by distance.
   *
   * A callback rather than lifted state: the phase machine stays owned here,
   * where every transition already lives, and the page learns the one bit of
   * it that affects layout.
   */
  onIdleChange?: (idle: boolean) => void
} = {}) {
  const t = useTranslations()
  const tw = t.waitlist
  const reducedMotion = usePrefersReducedMotion()
  const cohort = useCohort()
  const stageRef = useRef<HTMLDivElement>(null)

  const [phase, setPhase] = useState<Phase>("idle")
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})

  // Claim-step fields.
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [ageBracket, setAgeBracket] = useState("")
  const [country, setCountry] = useState("")
  const [diet, setDiet] = useState("")
  const [mainGoal, setMainGoal] = useState("")
  const [foodChallenge, setFoodChallenge] = useState("")
  const [healthConsent, setHealthConsent] = useState(false) // never pre-ticked
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [message, setMessage] = useState("")
  const [shareCode, setShareCode] = useState<string | null>(null)

  const [referredBy, setReferredBy] = useState<string | null>(null)
  const [utm, setUtm] = useState<WaitlistUtm>({})

  const answeredCount = Object.keys(answers).length
  const question = QUICK_QUESTIONS[step]
  const engine = question ? ENGINES[question.pillar] : null

  /* ── Referral + first-touch UTM, exactly as the previous flow captured them ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const ref = params.get("ref")
    if (ref) {
      const code = ref.trim().slice(0, 16)
      setReferredBy(code)
      track("waitlist_referral_opened", { ref_code: code })
    }

    let captured: WaitlistUtm = {}
    for (const k of UTM_KEYS) {
      const v = params.get(k)
      if (v) captured[k] = v.trim().slice(0, 120)
    }
    if (Object.keys(captured).length === 0) {
      try {
        const saved = sessionStorage.getItem("eb_utm")
        if (saved) captured = JSON.parse(saved) as WaitlistUtm
      } catch { /* sessionStorage optional */ }
    } else {
      try { sessionStorage.setItem("eb_utm", JSON.stringify(captured)) } catch { /* optional */ }
    }
    if (Object.keys(captured).length) setUtm(captured)
    track("waitlist_landing", captured)
  }, [])

  /* ── Localise the country default from the geo cookie ────────────────── */
  const [, setGeoProfile] = useState<FoodProfile>(DEFAULT_MARKET.foodProfile)
  useEffect(() => {
    const code = document.cookie.split("; ").find((c) => c.startsWith("eb_country="))?.split("=")[1]
    const market = resolveMarket(code)
    setGeoProfile(market.foodProfile)
    if (market.name && COUNTRIES.includes(market.name)) setCountry(market.name)
  }, [])

  /**
   * The result is computed once every question is answered, and never before.
   * Gating on the answer COUNT rather than on the phase means the number shown
   * at the reveal cannot be a partially-answered one.
   */
  const result = useMemo(() => resultForAnswers(answers), [answers])

  /* ── The building beat, and why reduced motion skips it entirely ──────
   * It exists to make the reveal land. For someone who has asked for reduced
   * motion it is a second and a half of nothing, so they go straight to the
   * score rather than watching a stilled version of an effect they declined. */
  useEffect(() => {
    if (phase !== "building") return
    if (reducedMotion) { setPhase("reveal"); return }
    const id = setTimeout(() => setPhase("reveal"), 1600)
    return () => clearTimeout(id)
  }, [phase, reducedMotion])

  useEffect(() => {
    if (phase === "reveal" && result) {
      track("waitlist_quiz_completed", { profile_type: result.profile.type, score: result.overall })
    }
    // Fires once per arrival at the reveal, which is once per run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  /* Keep the active stage clear of the sticky header when it changes. */
  useEffect(() => {
    if (phase === "idle") return
    stageRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" })
  }, [phase, step, reducedMotion])

  const answer = useCallback((id: string, value: number) => {
    setAnswers((a) => ({ ...a, [id]: value }))
    setStep((s) => {
      const next = s + 1
      if (next >= QUICK_QUESTIONS.length) {
        /*
         * Never ENTER `building` under reduced motion.
         *
         * The effect below also sends `building` straight to `reveal`, and
         * that was the whole mechanism until an e2e check recorded that the
         * building stage had rendered anyway: React paints the new phase, then
         * the effect runs. One frame — but a flash of an interstitial is
         * exactly what someone who asked for reduced motion asked not to get.
         * Deciding here means the stage is never mounted at all. The effect
         * stays as the timer for everyone else.
         */
        setPhase(reducedMotion ? "reveal" : "building")
      }
      return next
    })
  }, [reducedMotion])

  function back() {
    if (step === 0) { setPhase("intro"); return }
    setStep((s) => s - 1)
  }

  async function handleClaim(e: React.FormEvent) {
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
      const out = await submitWaitlistJoin({
        email, name, ageBracket, country, diet, mainGoal, foodChallenge,
        referredBy, utm, result, healthDataConsent: healthConsent,
      })
      if (out.ok) {
        setShareCode(out.shareCode)
        setPhase("done")
        track("waitlist_join_submitted", {
          profile_type: result.profile.type, score: result.overall,
          country: country || undefined, referred: !!referredBy,
          cohort: cohort?.cohort.id,
        })
      } else {
        setStatus("error")
        setMessage(out.error ?? tw.form.genericError)
        track("waitlist_join_failed", { reason: out.error ?? "unknown" })
      }
    } catch {
      setStatus("error")
      setMessage(tw.form.genericError)
      track("waitlist_join_failed", { reason: "network" })
    }
  }

  const begin = () => { setPhase("intro"); track("waitlist_experience_opened") }

  // One effect, one boundary. Deliberately not called inside `begin`: the phase
  // can also leave and re-enter `idle` by other paths, and a notification tied
  // to one button would be wrong for the others.
  useEffect(() => {
    onIdleChange?.(phase === "idle")
  }, [phase, onIdleChange])
  const startQuestions = () => { setStep(0); setPhase("questions") }

  /*
   * The figure, shared by every stage so it is one continuous object.
   *
   * Capped by VIEWPORT height, not only width. Sized on width alone it stood
   * 560px tall on a 900px desktop viewport and pushed the primary CTA to
   * y=1047 — off the first screen, on both desktop and phone. A hero whose
   * call to action cannot be seen without scrolling is not a hero, and this
   * was measured rather than eyeballed because the same mistake has already
   * shipped once on this page.
   *
   * The cap was min(40vh, 400px) and is now min(41vh, 415px) — the figure is
   * the brand's emotional anchor and had more white space around it than it
   * needed. The ceiling is set by MEASUREMENT, not by taste.
   *
   * It was briefly min(44vh, 450px), and that was too far: the CTA still fit
   * the first screen at every width, but the COHORT LINE beneath it did not,
   * and tests/e2e/early-access-campaign.spec.ts caught what my own
   * measurement had missed by watching only the button. The hero's first
   * screen is everything down to the counted programme, not the CTA alone.
   */
  const figure = (
    <div className="relative mx-auto flex w-full max-w-[620px] items-center justify-center" style={{ maxHeight: "min(41vh, 415px)" }}>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 48%, rgba(76,182,72,0.22), rgba(245,166,35,0.12) 55%, transparent 78%)",
        }}
      />
      <HeroVideo
        posterSrc="/videos/food-system-hero-poster.jpg"
        webmSrc="/videos/food-system-hero.webm"
        mp4Src="/videos/food-system-hero.mp4"
        alt="The food system inside you — an animated figure showing the gut microbiome"
        className="max-h-[min(41vh,415px)] w-full object-contain"
      />
    </div>
  )

  return (
    <section ref={stageRef} className="relative px-6 pt-12 pb-16 md:pt-16 md:pb-24">
      {/*
        One live region for the whole experience. Each stage change announces
        what the stage is, so a screen-reader user is told the assessment
        started, which question they are on and that a score has arrived —
        none of which is conveyed by the visual transition alone.
      */}
      <p aria-live="polite" className="sr-only">
        {phase === "questions" && question
          ? `Question ${step + 1} of ${QUICK_QUESTIONS.length}. ${ENGINES[question.pillar].label}.`
          : phase === "building"
            ? "Building your food system."
            : phase === "reveal" && result
              ? `Your first Biotics Score is ${result.overall} out of 100.`
              : ""}
      </p>

      <div className="mx-auto max-w-[1100px]">
        {phase === "idle" && (
          <HeroStage campaign={campaign} figure={figure} cohort={cohort} onBegin={begin} />
        )}

        {phase === "intro" && (
          <IntroStage campaign={campaign} onStart={startQuestions} />
        )}

        {phase === "questions" && question && engine && (
          <QuestionStage
            key={question.id}
            index={step}
            total={QUICK_QUESTIONS.length}
            answered={answeredCount}
            question={question}
            engineLabel={engine.label}
            engineVerb={engine.verb}
            engineGradient={engine.gradient}
            engineColor={engine.color}
            selected={answers[question.id]}
            localised={tw.questions[question.id as keyof typeof tw.questions]}
            onAnswer={answer}
            onBack={back}
          />
        )}

        {phase === "building" && <BuildingStage figure={figure} campaign={campaign} />}

        {phase === "reveal" && result && (
          <RevealStage
            result={result}
            cohort={cohort}
            onClaim={() => setPhase("claim")}
          />
        )}

        {phase === "claim" && result && (
          <ClaimStage
            cohort={cohort}
            status={status}
            message={message}
            email={email} setEmail={setEmail}
            name={name} setName={setName}
            ageBracket={ageBracket} setAgeBracket={setAgeBracket}
            country={country} setCountry={setCountry}
            diet={diet} setDiet={setDiet}
            mainGoal={mainGoal} setMainGoal={setMainGoal}
            foodChallenge={foodChallenge} setFoodChallenge={setFoodChallenge}
            healthConsent={healthConsent} setHealthConsent={setHealthConsent}
            onSubmit={handleClaim}
            onBack={() => setPhase("reveal")}
          />
        )}

        {phase === "done" && result && (
          <DoneStage cohort={cohort} shareCode={shareCode} overall={result.overall} />
        )}
      </div>
    </section>
  )
}

/* ══ Stages ══════════════════════════════════════════════════════════════ */

function HeroStage({
  campaign, figure, cohort, onBegin,
}: {
  campaign: CampaignContext
  figure: React.ReactNode
  cohort: ReturnType<typeof useCohort>
  onBegin: () => void
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        {campaign.brand}
      </p>

      <h1 className="mt-5 font-serif text-[2.5rem] font-bold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
        <span style={{ color: "var(--icon-green)" }}>The Food System</span>
        <br />
        <span
          style={{
            background: GRADIENT_BAR,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Inside {campaign.subject}.
        </span>
      </h1>

      {/*
        The proposition, not a stopwatch.

        This read "Understand yours in 60 seconds." Sixty seconds was a useful
        pre-launch mechanism and it is not what EatoBiotics is: the product is
        understanding a food system and improving it over time, which is the
        opposite of a claim about speed. No other time claim replaces it.

        Longer than the line it replaced, so the measure is set deliberately
        rather than inherited — `max-w-[22ch]` on the smallest breakpoint keeps
        it to two balanced lines on a phone instead of one orphaned word.
      */}
      <p className="mx-auto mt-5 max-w-[24ch] font-serif text-lg leading-snug text-foreground text-balance sm:max-w-[34ch] sm:text-xl">
        Understand your own food system, what shapes it, and how to improve it
        over time.
      </p>

      {/*
        The figure is the product, so it gets the room. No card, no border.

        The four gaps between here and the cohort line tighten at PHONE width
        only (`sm:` restores each one), because at 390×844 the counted
        programme's second line fell 15px past the fold. Recovering it by
        shrinking the figure would have traded the brand's anchor for a
        margin; recovering it from the rhythm costs nothing a reader can name.
      */}
      <div className="mt-4 w-full sm:mt-6">{figure}</div>

      <div className="mt-5 flex w-full flex-col items-center sm:mt-7">
        <button
          type="button"
          onClick={onBegin}
          className="brand-gradient inline-flex min-h-[56px] w-full max-w-sm items-center justify-center gap-2.5 whitespace-nowrap rounded-full px-10 py-4 text-base font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:opacity-90 sm:w-auto sm:max-w-none sm:text-lg"
        >
          Understand My Food System <ArrowRight size={20} aria-hidden />
        </button>
        <a
          href="#how-it-works"
          className="mt-3 text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground sm:mt-4"
        >
          See how it works
        </a>
      </div>

      {/* Restrained on purpose. It replaces a sentence that named Feed, Seed
        * and Rejuvenate and promised a score — three ideas competing under a
        * CTA. The framework is taught further down the page; here it only has
        * to say what kind of product this is. */}
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:mt-6">
        Science-backed insights. A healthier you.
      </p>

      <CohortLine cohort={cohort} className="mt-4 sm:mt-5" />
    </div>
  )
}

function IntroStage({ campaign, onStart }: { campaign: CampaignContext; onStart: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        {campaign.brand}
      </p>
      <h2 className="mt-6 font-serif text-4xl font-bold leading-tight sm:text-5xl">
        Let&rsquo;s meet your food system.
      </h2>
      <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
        Five simple questions. Your first Biotics&nbsp;Score™ at the end.
      </p>
      <button
        type="button"
        onClick={onStart}
        autoFocus
        className="brand-gradient mt-9 inline-flex min-h-[56px] w-full max-w-xs items-center justify-center gap-2.5 rounded-full px-10 py-4 text-base font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:opacity-90"
      >
        Begin <ArrowRight size={18} aria-hidden />
      </button>
      <p className="mt-5 max-w-sm text-xs leading-relaxed text-muted-foreground">
        Nothing is stored until you choose to claim your place. No account needed to see your score.
      </p>
    </div>
  )
}

function QuestionStage({
  index, total, answered, question, engineLabel, engineVerb, engineGradient, engineColor,
  selected, localised, onAnswer, onBack,
}: {
  index: number
  total: number
  answered: number
  question: (typeof QUICK_QUESTIONS)[number]
  engineLabel: string
  engineVerb: string
  engineGradient: string
  engineColor: string
  selected: number | undefined
  /**
   * The question in the visitor's language. Text, subtitle AND options all
   * come from here when present — translating the question but leaving its
   * four answers in English would be worse than not translating it at all.
   * The English source is the fallback, per option, so a short dictionary
   * cannot blank an answer.
   */
  localised?: { text: string; subtitle: string; options: { label: string; description: string }[] }
  onAnswer: (id: string, value: number) => void
  onBack: () => void
}) {
  const pct = Math.round((index / total) * 100)

  return (
    <div className="mx-auto flex max-w-2xl flex-col py-6">
      {/* Progress: a line plus a time cue. The engine is NAMED, not just
          coloured — Feed/Seed/Rejuvenate must never be carried by hue alone. */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: engineColor }}>
          {engineLabel} <span className="text-muted-foreground">· {engineVerb}</span>
        </p>
        <p className="text-xs font-medium text-muted-foreground">{progressCue(answered, total)}</p>
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%`, background: engineGradient }}
        />
      </div>

      <fieldset className="mt-10 border-0 p-0">
        <legend className="font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          {localised?.text ?? question.text}
        </legend>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {localised?.subtitle ?? question.subtitle}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {question.options.map((opt, oi) => {
            const id = `${question.id}-${opt.value}`
            const isSelected = selected === opt.value
            const copy = localised?.options?.[oi] ?? { label: opt.label, description: opt.description }
            return (
              <label
                key={id}
                htmlFor={id}
                className="group flex min-h-[64px] cursor-pointer items-center gap-4 rounded-2xl border bg-card px-5 py-4 text-left transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-offset-2"
                style={{
                  borderColor: isSelected ? engineColor : "var(--border)",
                  ["--tw-ring-color" as string]: engineColor,
                }}
              >
                <input
                  type="radio"
                  id={id}
                  name={question.id}
                  value={opt.value}
                  checked={isSelected}
                  onChange={() => onAnswer(question.id, opt.value)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                  style={{
                    borderColor: isSelected ? engineColor : "var(--border)",
                    background: isSelected ? engineColor : "transparent",
                  }}
                >
                  {isSelected ? <Check size={14} className="text-white" /> : null}
                </span>
                <span className="flex flex-col">
                  <span className="text-base font-semibold text-foreground">{copy.label}</span>
                  <span className="text-sm text-muted-foreground">{copy.description}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={onBack}
        className="mt-8 inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} aria-hidden /> Back
      </button>
    </div>
  )
}

function BuildingStage({ figure, campaign }: { figure: React.ReactNode; campaign: CampaignContext }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="w-full max-w-md">{figure}</div>
      <p className="mt-8 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
        Building the Food System Inside {campaign.subject}…
      </p>
      <div className="mt-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <span>Feed</span>
        <span aria-hidden className="h-1 w-1 rounded-full bg-border" />
        <span>Seed</span>
        <span aria-hidden className="h-1 w-1 rounded-full bg-border" />
        <span>Rejuvenate</span>
      </div>
    </div>
  )
}

/**
 * The three component scores.
 *
 * Labelled with the BIOTIC names, with the action beside each as a descriptor.
 * That is not a style choice: the actions are never score names — Rejuvenate is
 * something a person does, postbiotics are what bacteria produce — and
 * tests/unit/score-hierarchy.test.ts refuses an action used as a score label.
 */
/**
 * The Three Biotics, as the scientific foundation — with no personal number.
 *
 * ══ WHY THE NUMBERS ARE GONE ════════════════════════════════════════════════
 *
 * This rendered `Prebiotics — Feed 67`, `Probiotics — Seed 67`,
 * `Postbiotics — Rejuvenate 67` with bars. `Postbiotics — 67` is a personal
 * postbiotic state expressed as a number, which `POSTBIOTICS_INFERENCE_BOUNDARY`
 * prohibits by name: "personal Postbiotics state", "low Postbiotics", and the
 * relationships quantify / indicate / reflect. The other two were the same
 * shape of claim with a weaker spotlight on them.
 *
 * Under the strict ISAPP definitions the product now holds, none of the three
 * is a thing a questionnaire can measure in a person: a prebiotic is a
 * substrate that is selectively utilised AND confers a benefit; a probiotic is
 * a characterised live organism with a demonstrated benefit; a postbiotic is a
 * preparation. Self-report reaches none of them.
 *
 * So the Biotics keep equal status and become what they are — the foundation
 * the product teaches. The number that remains is the overall score, which is
 * computed from the same answers by the same untouched arithmetic.
 *
 * The scored dimensions that will eventually sit here (Diversity, Plants &
 * Fibre, Fermented Foods, Food Quality, Meal Rhythm) are FSS-v1 CANDIDATE
 * domains — frozen for scientific review and NOT yet approved. Shipping
 * numbers for them now would be the same mistake in a new costume.
 */
const FOUNDATION: { pillar: QuickPillar; teaches: string }[] = [
  { pillar: "prebiotics", teaches: "Substrates your microbes can use, with a demonstrated benefit." },
  { pillar: "probiotics", teaches: "Live microorganisms with a demonstrated benefit — not every fermented food has them." },
  { pillar: "postbiotics", teaches: "Preparations of inanimate microorganisms, or their components, with a demonstrated benefit." },
]

/**
 * The priority, named as the food behaviour rather than the Biotic.
 *
 * `insights[0].label` is "Prebiotics" / "Probiotics" / "Postbiotics", so
 * printing it directly says "your biggest opportunity is Postbiotics" — a
 * personal claim about a Biotic, only without a number attached. The behaviour
 * is what the questions actually asked about, and it is also the thing a
 * person can act on.
 *
 * The map itself lives in lib/pillars.ts, the canonical vocabulary module, so
 * the reveal, /assessment/results and /discover/[code] share one mapping. It
 * started here as a local constant and was moved the moment a second surface
 * needed it — three copies of this drifting apart is exactly how the product
 * ended up with two answers to the same question in the first place.
 */

function RevealStage({
  result, cohort, onClaim,
}: {
  result: ReturnType<typeof computeQuickResult>
  cohort: ReturnType<typeof useCohort>
  onClaim: () => void
}) {
  const claimLabel = joinCtaLabel(cohort)
  const priority = result.insights[0]
  const behaviour = pillarBehaviour(priority?.label)

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-6 text-center">
      <ScoreRing
        score={result.overall}
        color={result.profile.color}
        gradientId="experience-reveal-ring"
        className="relative mx-auto h-44 w-44"
      />
      {/*
        "first", deliberately and everywhere.

        This score comes from five questions. The free Food System Assessment
        is fifteen and is the product that produces a person's Biotics Score™.
        Calling this one the same thing would give the product one name for two
        different numbers, so the word "first" is load-bearing rather than
        decorative, and tests/unit/holding-page.test.ts pins it.
      */}
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        Your first Biotics Score™
      </p>
      <h2 className="mt-3 font-serif text-3xl font-bold text-foreground sm:text-4xl">
        {result.profile.type}
      </h2>

      {behaviour && priority ? (
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">
            Your biggest opportunity: {behaviour}.
          </span>{" "}
          {priority.action}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onClaim}
        className="brand-gradient mt-10 inline-flex min-h-[56px] w-full max-w-sm items-center justify-center gap-2.5 rounded-full px-10 py-4 text-base font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:opacity-90"
      >
        {claimLabel} <ArrowRight size={18} aria-hidden />
      </button>
      <CohortLine cohort={cohort} className="mt-6" />

      {/*
        The foundation. Equal status, no numbers — see the docblock above.

        It sits AFTER the claim, and that position was measured rather than
        chosen. The three numbered bars this replaced were ~150px shorter, so
        with the panel above the button the CTA landed 259px below the fold at
        390px and 86px below it at 1280px. The order now reads: your score,
        what to do about it, the next step, and then the science it rests on —
        which is also the honest hierarchy, since the Biotics are taught here
        rather than measured. tests/e2e/food-system-experience.spec.ts measures
        the CTA against the viewport at three widths, so this cannot drift back
        silently.
      */}
      <div className="mt-12 w-full rounded-2xl border border-border bg-card p-6 text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Built on the Three Biotics
        </p>
        <ul className="mt-5 flex flex-col gap-4">
          {FOUNDATION.map(({ pillar, teaches }) => {
            const engine = ENGINES[pillar]
            return (
              <li key={pillar} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: engine.gradient }}
                />
                <span>
                  <span className="text-sm font-semibold text-foreground">{engine.label}</span>
                  <span className="block text-sm leading-relaxed text-muted-foreground">{teaches}</span>
                </span>
              </li>
            )
          })}
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          EatoBiotics teaches the science of all three. This assessment measures food
          patterns — not your personal prebiotic, probiotic or postbiotic state.
        </p>
      </div>
    </div>
  )
}

function ClaimStage(props: {
  cohort: ReturnType<typeof useCohort>
  status: "idle" | "loading" | "error"
  message: string
  email: string; setEmail: (v: string) => void
  name: string; setName: (v: string) => void
  ageBracket: string; setAgeBracket: (v: string) => void
  country: string; setCountry: (v: string) => void
  diet: string; setDiet: (v: string) => void
  mainGoal: string; setMainGoal: (v: string) => void
  foodChallenge: string; setFoodChallenge: (v: string) => void
  healthConsent: boolean; setHealthConsent: (v: boolean) => void
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
}) {
  const { cohort, status } = props
  const inputCls =
    "w-full rounded-2xl border bg-card px-5 py-3.5 text-base text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:ring-2"
  const inputStyle = { borderColor: "var(--border)", ["--tw-ring-color" as string]: "var(--icon-green)" }

  return (
    <div className="mx-auto flex max-w-lg flex-col py-6">
      <h2 className="font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl">
        {cohort?.isOpen ? `Claim your place in ${cohortNameInSentence(cohort.cohort)}.` : "Join the waitlist."}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        We&rsquo;ll send your first Biotics&nbsp;Score™ and tell you the moment your place opens.
        You&rsquo;ll be among the first to take the full Food System Assessment.
      </p>

      <form onSubmit={props.onSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="claim-email" className="mb-2 block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="claim-email" type="email" required autoComplete="email" inputMode="email"
            value={props.email} onChange={(e) => props.setEmail(e.target.value)}
            className={inputCls} style={inputStyle} placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="claim-name" className="mb-2 block text-sm font-medium text-foreground">
            First name <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="claim-name" type="text" autoComplete="given-name"
            value={props.name} onChange={(e) => props.setName(e.target.value)}
            className={inputCls} style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="claim-age" className="mb-2 block text-sm font-medium text-foreground">
              Age <span className="text-muted-foreground">(optional)</span>
            </label>
            <select id="claim-age" value={props.ageBracket} onChange={(e) => props.setAgeBracket(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">Prefer not to say</option>
              {AGE_BRACKETS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="claim-country" className="mb-2 block text-sm font-medium text-foreground">
              Country <span className="text-muted-foreground">(optional)</span>
            </label>
            <select id="claim-country" value={props.country} onChange={(e) => props.setCountry(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">Prefer not to say</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Segmentation, not scoring. These two used to interrupt the run as
            questions six and seven; they belong here, after the score, where
            they do not make a five-question assessment a seven-question one. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="claim-goal" className="mb-2 block text-sm font-medium text-foreground">
              Main goal <span className="text-muted-foreground">(optional)</span>
            </label>
            <select id="claim-goal" value={props.mainGoal} onChange={(e) => props.setMainGoal(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">Prefer not to say</option>
              {MAIN_GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="claim-challenge" className="mb-2 block text-sm font-medium text-foreground">
              Biggest challenge <span className="text-muted-foreground">(optional)</span>
            </label>
            <select id="claim-challenge" value={props.foodChallenge} onChange={(e) => props.setFoodChallenge(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">Prefer not to say</option>
              {FOOD_CHALLENGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="claim-diet" className="mb-2 block text-sm font-medium text-foreground">
            How you eat <span className="text-muted-foreground">(optional)</span>
          </label>
          <select id="claim-diet" value={props.diet} onChange={(e) => props.setDiet(e.target.value)} className={inputCls} style={inputStyle}>
            <option value="">Prefer not to say</option>
            {DIET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <HealthConsentCheckbox checked={props.healthConsent} onChange={props.setHealthConsent} />

        {status === "error" && props.message ? (
          <p role="alert" className="text-sm font-medium text-red-600">{props.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={status === "loading"}
          className="brand-gradient mt-2 inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-full px-10 py-4 text-base font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:opacity-90 disabled:opacity-60"
        >
          {status === "loading" ? "Joining…" : joinCtaLabel(cohort)}
        </button>
      </form>

      <button
        type="button"
        onClick={props.onBack}
        className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} aria-hidden /> Back to my score
      </button>
    </div>
  )
}

function DoneStage({
  cohort, shareCode, overall,
}: {
  cohort: ReturnType<typeof useCohort>
  shareCode: string | null
  overall: number
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-10 text-center">
      <span
        aria-hidden
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: GRADIENT_BAR }}
      >
        <Check size={26} className="text-white" />
      </span>
      <h2 className="mt-7 font-serif text-3xl font-bold text-foreground sm:text-4xl">
        You&rsquo;re in.
      </h2>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Your first Biotics&nbsp;Score™ is <span className="font-semibold text-foreground">{overall}</span>.
        We&rsquo;ve emailed it to you, along with what it means and what happens next.
      </p>
      <CohortLine cohort={cohort} className="mt-7" />
      {shareCode ? (
        <Link
          href={`/discover/${shareCode}`}
          className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full border border-border px-8 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card"
        >
          See my food system
        </Link>
      ) : null}
    </div>
  )
}
