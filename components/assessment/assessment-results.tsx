"use client"

import {
  IMMEDIATE_START_FIELD,
  IMMEDIATE_START_REQUIRED_MESSAGE,
  ImmediateStartRequest,
} from "@/components/assessment/immediate-start-request"
import { HealthConsentCheckbox } from "@/components/health-consent-checkbox"
import {
  HEALTH_CONSENT_FIELD,
  HEALTH_CONSENT_REQUIRED_MESSAGE,
} from "@/lib/health-consent"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  RotateCcw,
  Utensils,
  ArrowRight,
  Check,
  Calendar,
  ShoppingCart,
  BarChart3,
  Copy,
  Trophy,
} from "lucide-react"
import posthog from "posthog-js"
import { ScrollReveal } from "@/components/scroll-reveal"
import { BioticsScoreReveal } from "./result/biotics-score-reveal"
import { FoodSystemProfile } from "./result/food-system-profile"
import { ThreeBioticsResult } from "./result/three-biotics-result"
import { FoodSystemPattern } from "./result/food-system-pattern"
import { OneFreeAction } from "./result/one-free-action"
import { ContributeOptIn } from "./result/contribute-opt-in"
import { MissionNote } from "./mission-note"
import { ShareScoreCard } from "./share-score-card"
import { JourneyNextStep } from "./journey-next-step"
import { ScoreCard } from "./score-card"
import { SaveResultsCard } from "./save-results-card"
import type { AssessmentResult } from "@/lib/assessment-scoring"
import { getFoodBySlug } from "@/lib/foods"
import { REPORT_OFFER_FEATURES } from "@/lib/report/offer"
import { browserCountry, localFoods, fermentedPair, prebioticTrio } from "@/lib/local-foods"
import type { FoodSet } from "@/lib/foods-by-country"
import { BioticIcon } from "@/components/report/food-tool"
import { bioticFromFoodType } from "@/lib/report/visual-token"

/* ── Gut Starter Pack config ─────────────────────────────────────────── */

const STARTER_PACK: Record<string, string[]> = {
  "Thriving Food System": ["kimchi", "kombucha", "asparagus", "tempeh", "pomegranate", "water-kefir"],
  "Strong Foundation":    ["kimchi", "kefir", "garlic", "asparagus", "wild-salmon", "almonds"],
  "Emerging Balance":     ["yogurt", "oats", "garlic", "blueberries", "eggs", "lentils"],
  "Developing System":    ["garlic", "oats", "yogurt", "banana", "eggs", "kimchi"],
  "Early Builder":        ["garlic", "oats", "yogurt", "banana", "lentils", "eggs"],
}

const DEFAULT_STARTER: string[] = ["garlic", "oats", "yogurt", "kefir", "lentils", "blueberries"]



/* ── Localised focus suggestion ──────────────────────────────────────────
   One concrete, country-aware thing to try, rendered by OneFreeAction.

   The interpretation paragraphs that used to sit beside this were removed with
   the weakest-pillar callout they belonged to. They carried claims this phase
   retires — "significantly improve your gut ecosystem", "your biggest lever
   right now", "may be working against your gut's recovery", and "the habit this
   pillar measures". insight.strength / insight.opportunity already carry
   interpretation, without the promises.

   The localisation itself was worth keeping rather than deleting with them:
   lib/local-foods.ts has exactly one consumer — this file — so dropping the
   last use would have orphaned the module and quietly removed a personalisation
   that names food someone can actually buy where they live. */

const FOCUS_FOOD_SUGGESTION: Record<string, string> = {
  prebiotics: "Add {PREBIOTIC} to three meals this week.",
  probiotics: "A daily spoonful of {FERMENTED} — it takes seconds.",
  postbiotics:
    "Eat your main meal earlier in the evening, and add two colourful plant foods a day.",
}

/* ── "The science is global. The food is local." ─────────────────────────
   {FERMENTED}/{PREBIOTIC} placeholders are filled from the visitor's market
   (eb_country cookie → lib/local-foods). SSR and first paint use the
   western_eu set — identical to the previous hardcoded copy — and the local
   examples swap in after mount, so there is no hydration mismatch. */
function fillLocalFoods(template: string, set: FoodSet): string {
  return template
    .replaceAll("{FERMENTED}", fermentedPair(set))
    .replaceAll("{PREBIOTIC}", prebioticTrio(set))
}

function useLocalFoodSet(): FoodSet {
  const [set, setSet] = useState<FoodSet>(() => localFoods(null))
  useEffect(() => {
    const country = browserCountry()
    if (country) setSet(localFoods(country))
  }, [])
  return set
}




/* ── Main component ──────────────────────────────────────────────────── */

interface AssessmentResultsProps {
  result: AssessmentResult
  onRetake: () => void
  leadEmail?: string
  winnerCode?: string
}

export function AssessmentResults({ result, onRetake, leadEmail, winnerCode }: AssessmentResultsProps) {
  const { overall, profile, insights, nextActions, subScores } = result
  const [loading, setLoading] = useState(false)
  // Two separate questions, both unticked by default — a pre-ticked box is
  // neither a request nor consent. They were one sentence until this change;
  // bundling a processing consent into a commercial request is what made the
  // consent record quote a statement the buyer had never been shown.
  const [startNow, setStartNow] = useState(false)
  const [healthConsent, setHealthConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lottery winner code copy state
  const [winnerCodeCopied, setWinnerCodeCopied] = useState(false)

  // FoodSystemPattern reads the same weakest-first `insights` ordering that
  // produced the callout this replaced — the derivation moved, it was not
  // reinvented. `foods` is still needed by the Gut Starter Pack below.
  const foods = useLocalFoodSet()
  const focusPillar = insights[0]?.pillar ?? ""
  const localSuggestion = FOCUS_FOOD_SUGGESTION[focusPillar]
    ? fillLocalFoods(FOCUS_FOOD_SUGGESTION[focusPillar], foods)
    : undefined

  /* ── Checkout helpers ─────────────────────────────────────────────── */

  async function handlePurchase(tier: string = "personal") {
    if (!healthConsent) {
      setError(HEALTH_CONSENT_REQUIRED_MESSAGE)
      return
    }
    if (!startNow) {
      setError(IMMEDIATE_START_REQUIRED_MESSAGE)
      return
    }
    setLoading(true)
    setError(null)

    posthog.capture("report_purchase_clicked", {
      tier,
      score: overall,
      profile_type: profile.type,
    })

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          overall,
          profile,
          subScores,
          email: leadEmail,
          [HEALTH_CONSENT_FIELD]: true,
          [IMMEDIATE_START_FIELD]: true,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout. Please try again.")
        return
      }
      window.location.href = data.url
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── The free result, in the order it makes sense ────────────────
        *
        * Score → profile → the three Biotics → the pattern → one thing to try.
        * All of it before the €49 block, which used to sit above the Three
        * Biotics and above the report-features list; the only interpretation
        * ahead of it was a "weakest pillar" callout that closed by advertising
        * the paid plan. The free result now stands on its own.
        *
        * One scrollable page, normal document flow — no stage index, no taps
        * between a customer and their own result. */}
      <BioticsScoreReveal overall={overall} color={profile.color} profileType={profile.type} />

      <FoodSystemProfile profile={profile} />

      <ThreeBioticsResult insights={insights} />

      <FoodSystemPattern insights={insights} />

      <OneFreeAction action={nextActions[0]} localSuggestion={localSuggestion} />

      {/* ── Share your score ───────────────────────────────────────────── */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-3xl space-y-4">
          <ScrollReveal>
            <ShareScoreCard result={result} />
          </ScrollReveal>
          <ScrollReveal>
              <ScoreCard
                score={result.overall}
                feed={result.subScores.prebiotics ?? result.subScores.feed ?? 0}
                seed={result.subScores.probiotics ?? result.subScores.seed ?? 0}
                heal={result.subScores.postbiotics ?? result.subScores.heal ?? 0}
                profile={result.profile.type}
              />
          </ScrollReveal>
        </div>
      </section>

      {/* The optional contribution ask, after the free result rather than
        * in front of it. */}
      <ContributeOptIn result={result} />

      {/* ── C. Single CTA — the conversion moment ─────────────────────── */}
      <section className="border-y border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <div className="rounded-3xl border border-border bg-background overflow-hidden shadow-xl shadow-black/5">
              {/* Top accent */}
              <div className="h-1.5 w-full brand-gradient" />

              <div className="p-6 sm:p-10">
                {/* Headline */}
                <div className="mb-8 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    The next step in your Food System
                  </p>
                  <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                    Personal Food System Consultation
                  </h2>
                  <div className="mt-3 flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-foreground">€49</span>
                    <span className="text-muted-foreground text-sm">one-time</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    A guided set of deeper questions about your food, rhythm and daily life — and the Personal Food System Report they produce.
                  </p>
                </div>

                {/* What&apos;s included */}
                <ul className="mb-8 grid gap-2.5 sm:grid-cols-2">
                  {REPORT_OFFER_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <Check size={15} className="shrink-0 text-[var(--icon-green)]" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <div className="space-y-3">
                  <HealthConsentCheckbox checked={healthConsent} onChange={setHealthConsent} />
                  <ImmediateStartRequest checked={startNow} onChange={setStartNow} />
                </div>

                <button
                  onClick={() => handlePurchase("personal")}
                  disabled={loading || !healthConsent || !startNow}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 brand-gradient"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Redirecting…
                    </>
                  ) : (
                    <>
                      Pay €49 &amp; Begin My Consultation
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {error && (
                  <p className="mt-3 text-center text-sm text-destructive">{error}</p>
                )}

                <p className="mt-4 text-center text-xs text-muted-foreground/60">
                  A guided digital process. Educational and non-diagnostic; not a medical
                  consultation or diagnosis. One-off payment · Secure checkout via Stripe
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── D. What the report includes ────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl text-center">
              What your report includes
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Built around your Biotics Score™ — not a generic template.
            </p>
          </ScrollReveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Calendar,
                gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
                title: "Your 30-Day Plan",
                desc: "Four weeks of specific, week-by-week actions tailored to your Prebiotics, Probiotics, and Postbiotics scores.",
              },
              {
                icon: ShoppingCart,
                gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
                title: "Your Five-Food Strategy",
                desc: "Five foods chosen for your profile — what each one does, why it suits you, and a swap if it doesn't.",
              },
              {
                icon: BarChart3,
                gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
                title: "Your 7-Day Starter Plan",
                desc: "One specific action for each of the first seven days, so where to begin is never a decision.",
              },
            ].map((card, i) => (
              <ScrollReveal key={card.title} delay={i * 80}>
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: card.gradient }}
                  >
                    <card.icon size={18} className="text-white" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">{card.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{card.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7-Day Actions ────────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              More to try
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A few more small things you could try this week.
            </p>
          </ScrollReveal>

          <div className="mt-6 space-y-4">
            {nextActions.slice(1).map((action, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="flex gap-4 rounded-2xl border border-border bg-background p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full brand-gradient text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <p className="pt-1.5 text-sm leading-relaxed text-foreground sm:text-base">{action}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gut Starter Pack ─────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Your personalised picks
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your Gut Starter Pack
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Six foods matched to your profile — any of them is a reasonable place to start.
            </p>
          </ScrollReveal>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(STARTER_PACK[profile.type] ?? DEFAULT_STARTER).map((slug, i) => {
              const food = getFoodBySlug(slug)
              if (!food) return null
              return (
                <ScrollReveal key={slug} delay={i * 60}>
                  <div
                    className="relative overflow-hidden rounded-2xl border border-border bg-background p-4 transition-all hover:shadow-md"
                    style={{ borderTopColor: food.accentColor, borderTopWidth: "3px" }}
                  >
                    <BioticIcon food={food.name} biotic={bioticFromFoodType(food.biotic)} size={18} />
                    <p
                      className="mt-2 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: food.accentColor }}
                    >
                      {food.biotic === "prebiotic"
                        ? "Prebiotic"
                        : food.biotic === "probiotic"
                        ? "Probiotic"
                        : food.biotic === "postbiotic"
                        ? "Postbiotic"
                        : food.biotic === "protein"
                        ? "Protein"
                        : "Food"}
                    </p>
                    <p className="mt-0.5 font-serif text-sm font-semibold text-foreground">{food.name}</p>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground line-clamp-2">
                      {food.tagline}
                    </p>
                    <Link
                      href={`/myplate?add=${food.slug}`}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: food.accentColor }}
                    >
                      <Utensils size={11} />
                      Add to Plate
                    </Link>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>

          <ScrollReveal delay={400}>
            <div className="mt-6 text-center">
              <Link
                href="/food"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Browse the full food library →
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Foundation → add-on journey next step ──────────────────────── */}
      <section className="px-6"><JourneyNextStep /></section>

      {/* ── Lottery winner ────────────────────────────────────────────── */}
      {winnerCode && (
        <section className="px-6 pb-10">
          <div className="mx-auto max-w-3xl">
            <ScrollReveal>
              <div className="overflow-hidden rounded-2xl" style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 35%, #0ea5e9 70%, #06b6d4 100%)",
                boxShadow: "0 8px 40px rgba(79,70,229,0.35)",
              }}>
                {/* Shimmering top bar */}
                <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #fbbf24, #f59e0b, #fcd34d, #fbbf24)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }} />
                <div className="px-6 py-6 md:px-8">
                  {/* Trophy + headline */}
                  <div className="mb-1 flex items-center gap-3">
                    <Trophy size={32} aria-hidden strokeWidth={1.8} className="text-white" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.65)" }}>
                        You&apos;re a milestone taker
                      </p>
                      <p className="font-serif text-xl font-bold text-white leading-tight">
                        Congratulations — you&apos;ve won a free month!
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.80)" }}>
                    Every 100th person to take the EatoBiotics assessment wins a free first month on any plan. Today, that&apos;s you. Use the code below at checkout — it&apos;s yours alone and can only be used once.
                  </p>
                  {/* Code box */}
                  <div className="mt-5 flex items-center gap-2">
                    <div
                      className="flex-1 rounded-xl px-4 py-3 font-mono text-lg font-bold tracking-widest text-white"
                      style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.35)", letterSpacing: "0.15em" }}
                    >
                      {winnerCode}
                    </div>
                    <button
                      onClick={() => {
                        void navigator.clipboard.writeText(winnerCode).then(() => {
                          setWinnerCodeCopied(true)
                          setTimeout(() => setWinnerCodeCopied(false), 2500)
                          posthog.capture("lottery_winner_code_copied")
                        })
                      }}
                      className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold transition-opacity hover:opacity-90"
                      style={{ background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.30)", color: "white", minWidth: 90 }}
                    >
                      {winnerCodeCopied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                    </button>
                  </div>
                  <p className="mt-2.5 text-xs" style={{ color: "rgba(255,255,255,0.60)" }}>
                    Free first month · Single-use · Apply at checkout
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── Mission Bridge ─────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <MissionNote variant="bridge" />
          </ScrollReveal>
        </div>
      </section>

      {/* ── F. Save results / email capture ────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <SaveResultsCard email={leadEmail} />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Retake + Disclaimer ────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl flex flex-col items-center gap-4">
          <ScrollReveal>
            <button
              onClick={onRetake}
              className="flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              <RotateCcw size={14} />
              Retake Assessment
            </button>
            <p className="mt-4 max-w-md text-center text-xs text-muted-foreground/60">
              This assessment is for educational purposes and is not medical advice or a diagnosis.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/*
      {/*
        The abandonment safety net used to offer "Starter Insights for €19" here,
        wired to handlePurchase("starter"). The starter tier was retired:
        /api/checkout ignores the tier and charges €49 for the one product it
        sells, so this offered one price and took another. Removed rather than
        re-priced — a second CTA quoting the same €49 as the button above it is
        not a safety net, and re-introducing a cheaper tier is a pricing
        decision, not a copy fix.
      */}

    </div>
  )
}
