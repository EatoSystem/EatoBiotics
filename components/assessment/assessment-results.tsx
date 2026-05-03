"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Leaf,
  Droplets,
  Zap,
  Utensils,
  ArrowRight,
  Check,
  Calendar,
  ShoppingCart,
  BarChart3,
} from "lucide-react"
import posthog from "posthog-js"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ScoreRing } from "./score-ring"
import { MissionNote } from "./mission-note"
import { ShareScoreCard } from "./share-score-card"
import { ScoreCard } from "./score-card"
import type { AssessmentResult, PillarInsight } from "@/lib/assessment-scoring"
import type { PillarKey } from "@/lib/assessment-data"
import { getFoodBySlug } from "@/lib/foods"
import { getPercentile } from "@/lib/percentile"
import { getIdentityLabel } from "@/lib/identity-labels"

/* ── Gut Starter Pack config ─────────────────────────────────────────── */

const STARTER_PACK: Record<string, string[]> = {
  "Thriving Food System": ["kimchi", "kombucha", "asparagus", "tempeh", "pomegranate", "water-kefir"],
  "Strong Foundation":    ["kimchi", "kefir", "garlic", "asparagus", "wild-salmon", "almonds"],
  "Emerging Balance":     ["yogurt", "oats", "garlic", "blueberries", "eggs", "lentils"],
  "Developing System":    ["garlic", "oats", "yogurt", "banana", "eggs", "kimchi"],
  "Early Builder":        ["garlic", "oats", "yogurt", "banana", "lentils", "eggs"],
}

const DEFAULT_STARTER: string[] = ["garlic", "oats", "yogurt", "kefir", "lentils", "blueberries"]

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Leaf,
  Droplets,
  Zap,
}

/* ── Interpretation copy (in-component, no API call) ─────────────────── */

const INTERPRETATIONS: Record<string, Record<"low" | "mid" | "high", string>> = {
  prebiotics: {
    low: "Your gut bacteria are hungry. Your Prebiotics score suggests you may not be eating enough plant diversity and fibre to support a thriving microbiome — this is your biggest lever right now.",
    mid: "Your Prebiotics score shows a reasonable fibre foundation. With a few targeted additions to your weekly plant variety, you could significantly improve your gut ecosystem.",
    high: "Your Prebiotics score is strong — you're consistently nourishing your gut bacteria with the plant diversity and fibre they need to thrive.",
  },
  probiotics: {
    low: "Your Probiotics score is your biggest opportunity. Adding even one fermented food daily — yoghurt, kefir, or miso — can transform your microbial diversity within weeks.",
    mid: "You're introducing some live foods, but your Probiotics score suggests there's room to build a more consistent fermented food habit and broaden the variety.",
    high: "Your Probiotics score shows you're actively supporting your gut microbiome with fermented and live foods — one of the most targeted dietary inputs available.",
  },
  postbiotics: {
    low: "Your Postbiotics score suggests your food habits and meal rhythm may be working against your gut's recovery and energy systems. Small consistency wins here compound quickly.",
    mid: "Your Postbiotics score shows some consistency, but your gut's recovery system could benefit from more regular meal patterns and colourful, polyphenol-rich foods.",
    high: "Your Postbiotics score is excellent — your food habits and meal timing are supporting your gut's natural recovery and resilience processes.",
  },
}

/* ── Weakest pillar free food recommendation ─────────────────────────── */

const WEAKEST_FOOD_REC: Record<string, string> = {
  prebiotics: "Adding oats, garlic, and lentils to just three meals this week could meaningfully move your Prebiotics score.",
  probiotics: "One tablespoon of live yoghurt or kefir daily is one of the fastest ways to improve your Probiotics score — it takes seconds.",
  postbiotics: "Eating your main meal before 7pm and adding two colourful plant foods per day can improve your Postbiotics score within weeks.",
}

/* ── Animated score counter ─────────────────────────────────────────── */

function useCountUp(target: number, duration = 1200, delay = 400) {
  const [count, setCount] = useState(0)
  const startTime = useRef<number | null>(null)
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const tick = (now: number) => {
        if (!startTime.current) startTime.current = now
        const elapsed = now - startTime.current
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(Math.round(eased * target))
        if (progress < 1) {
          rafId.current = requestAnimationFrame(tick)
        }
      }
      rafId.current = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [target, duration, delay])

  return count
}

/* ── Pillar bar (hero + breakdown) ───────────────────────────────────── */

function PillarBar({ insight, index }: { insight: PillarInsight; index: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500 + index * 120)
    return () => clearTimeout(t)
  }, [index])

  const Icon = ICON_MAP[insight.icon] ?? Leaf

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
        style={{ background: insight.gradient }}
      >
        <Icon size={14} className="text-white" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{insight.label}</span>
          <span className="text-sm font-bold tabular-nums" style={{ color: insight.color }}>
            {insight.score}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border/40">
          <div
            className="h-full rounded-full"
            style={{
              width: visible ? `${insight.score}%` : "0%",
              background: insight.gradient,
              transition: `width 800ms cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 100}ms`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

/* ── Save Results Card ───────────────────────────────────────────────── */

function SaveResultsCard({ email }: { email?: string }) {
  const [sent, setSent] = useState(true)
  if (!email) return null

  return (
    <div className="rounded-2xl border bg-card p-6 text-center space-y-3">
      <div className="w-10 h-10 rounded-full bg-[var(--icon-green)]/10 flex items-center justify-center mx-auto">
        <span className="text-xl">📧</span>
      </div>
      <h3 className="font-semibold text-base">Your sign-in link is on its way</h3>
      {sent ? (
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a sign-in link to{" "}
          <span className="font-semibold text-foreground">{email}</span> — check your inbox to save
          these results and access your account.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sending a sign-in link to <span className="font-semibold text-foreground">{email}</span>…
        </p>
      )}
      {sent && (
        <p className="text-xs text-muted-foreground/60">
          Can&apos;t find it? Check your spam folder or{" "}
          <button
            onClick={() => {
              setSent(false)
              fetch("/api/auth/send-magic-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              })
                .then(() => setSent(true))
                .catch(() => setSent(true))
            }}
            className="underline hover:text-foreground transition-colors"
          >
            resend the link
          </button>
          .
        </p>
      )}
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────────────── */

interface AssessmentResultsProps {
  result: AssessmentResult
  onRetake: () => void
  leadEmail?: string
}

export function AssessmentResults({ result, onRetake, leadEmail }: AssessmentResultsProps) {
  const { overall, profile, insights, nextActions, subScores } = result
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Animated counter
  const animatedScore = useCountUp(overall)

  // Weakest pillar (insights sorted weakest-first)
  const weakestInsight = insights[0]
  const weakestPillar = weakestInsight.pillar as PillarKey

  // Interpretation — keyed to weakest pillar's own score band
  const ws = weakestInsight.score
  const scoreBand: "low" | "mid" | "high" = ws >= 65 ? "high" : ws >= 40 ? "mid" : "low"
  const interpretationText = INTERPRETATIONS[weakestPillar][scoreBand]

  // Percentile + identity
  const percentile = getPercentile(overall)
  const identityLabel = getIdentityLabel(overall)

  // Strengths / opportunities for breakdown section
  const strengths = insights.filter((i) => i.strength)
  const opportunities = insights.filter((i) => i.opportunity)

  /* ── Checkout helpers ─────────────────────────────────────────────── */

  async function handlePurchase(tier: string = "personal") {
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
        body: JSON.stringify({ tier, overall, profile: profile.type, subScores }),
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

      {/* ── A. Score Reveal — above fold ───────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-16 pt-28 sm:pt-36">
        {/* Radial glow tinted by profile colour */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, ${profile.color} 12%, transparent), transparent 70%)`,
          }}
        />

        <div className="relative mx-auto max-w-4xl">
          {/* Overline */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: profile.color }} />
              Your EatoBiotics Score
            </div>
          </div>

          {/* Score + bars layout */}
          <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-start sm:gap-12 lg:gap-20">

            {/* Left: Score ring + animated number */}
            <div className="flex shrink-0 flex-col items-center">
              <ScoreRing
                score={overall}
                color={profile.color}
                gradientId="assessment-ring"
                profileType={profile.type}
                percentile={percentile}
              />
              <div className="mt-4 text-center">
                <p className="text-5xl font-bold tabular-nums leading-none" style={{ color: profile.color }}>
                  {animatedScore}
                  <span className="text-xl text-muted-foreground">/100</span>
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Overall Score
                </p>
              </div>
              {/* Identity badge */}
              <div className="mt-4 flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-1.5">
                  <span className="text-base">{identityLabel.emoji}</span>
                  <span className="text-sm font-bold text-foreground">{identityLabel.word}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Higher than <strong>{percentile}%</strong> of people
                </p>
              </div>
            </div>

            {/* Right: Profile label + 3 pillar bars + interpretation */}
            <div className="w-full max-w-sm flex-1 sm:max-w-none">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: profile.color }} />
                <span className="text-sm font-bold" style={{ color: profile.color }}>
                  {profile.type}
                </span>
              </div>
              <p className="mb-5 font-serif text-xl font-semibold text-foreground sm:text-2xl leading-snug">
                {profile.tagline}
              </p>

              {/* 3 pillar bars */}
              <div className="space-y-4 rounded-2xl border border-border bg-background/80 p-5 backdrop-blur-sm">
                {insights.map((insight, i) => (
                  <PillarBar key={insight.pillar} insight={insight} index={i} />
                ))}
              </div>

              {/* Interpretation paragraph */}
              <div
                className="mt-4 rounded-xl border-l-4 bg-secondary/30 px-4 py-3"
                style={{ borderLeftColor: weakestInsight.color }}
              >
                <p className="text-sm leading-relaxed text-foreground/80">{interpretationText}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── B. Weakest pillar callout — free insight ───────────────────── */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <div
              className="rounded-2xl border p-6"
              style={{
                borderColor: `color-mix(in srgb, ${weakestInsight.color} 30%, var(--border))`,
                background: `color-mix(in srgb, ${weakestInsight.color} 5%, var(--background))`,
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: weakestInsight.gradient }}
                >
                  {(() => {
                    const Icon = ICON_MAP[weakestInsight.icon] ?? Leaf
                    return <Icon size={18} className="text-white" />
                  })()}
                </div>
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: weakestInsight.color }}
                  >
                    Your biggest opportunity — {weakestInsight.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">
                    <strong>{WEAKEST_FOOD_REC[weakestPillar]}</strong>
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    This is a free insight — your full 30-day plan goes much deeper.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Share your score ───────────────────────────────────────────── */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-3xl">
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
                    Unlock your full 30-day plan
                  </p>
                  <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                    Personal EatoBiotics Report
                  </h2>
                  <div className="mt-3 flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-foreground">€49</span>
                    <span className="text-muted-foreground text-sm">one-time</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    Everything you need to understand and improve your inner food system — built around your specific scores.
                  </p>
                </div>

                {/* What&apos;s included */}
                <ul className="mb-8 grid gap-2.5 sm:grid-cols-2">
                  {[
                    "Full Prebiotics / Probiotics / Postbiotics score analysis",
                    "Your personalised 30-day gut reset plan",
                    "Top 10 food recommendations",
                    "Weekly shopping framework",
                    "Meal timing and food rhythm guidance",
                    "Food swaps and avoid / reduce list",
                    "7-day kickstart action plan",
                    "Free 30-day EatoBiotics account",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <Check size={15} className="shrink-0 text-[var(--icon-green)]" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <button
                  onClick={() => handlePurchase("personal")}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 brand-gradient"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Redirecting…
                    </>
                  ) : (
                    <>
                      Generate My Personal Report
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {error && (
                  <p className="mt-3 text-center text-sm text-destructive">{error}</p>
                )}

                <p className="mt-4 text-center text-xs text-muted-foreground/60">
                  Instant access · One-off payment · Secure checkout via Stripe
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
              Built around your EatoBiotics Score — not a generic template.
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
                title: "Your Food Upgrades",
                desc: "Ten foods ranked by impact for your specific profile, with a weekly shopping framework to match.",
              },
              {
                icon: BarChart3,
                gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
                title: "Your Weekly Framework",
                desc: "Meal timing guidance, food swaps, and a rhythm that fits your lifestyle — not someone else's.",
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

      {/* ── E. 3 Biotics Breakdown ─────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your Three Pillars
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              How your food system performs across Prebiotics, Probiotics, and Postbiotics — the three areas that shape your gut health.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {strengths.length > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-[var(--icon-green)]/10 px-3 py-1 text-xs font-semibold text-[var(--icon-green)]">
                  <CheckCircle2 size={11} />
                  {strengths.length} {strengths.length === 1 ? "strength" : "strengths"}
                </span>
              )}
              {opportunities.length > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  <TrendingUp size={11} />
                  {opportunities.length} {opportunities.length === 1 ? "area to build" : "areas to build"}
                </span>
              )}
            </div>
          </ScrollReveal>

          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--icon-green)]">
                What&rsquo;s working
              </p>
              <div className="space-y-3">
                {strengths.map((insight, i) => {
                  const Icon = ICON_MAP[insight.icon] ?? Leaf
                  return (
                    <ScrollReveal key={insight.pillar} delay={i * 60}>
                      <div className="flex gap-4 rounded-2xl border border-[var(--icon-green)]/15 bg-[var(--icon-green)]/5 p-5">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: insight.gradient }}
                        >
                          <Icon size={16} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{insight.label}</p>
                              <CheckCircle2 size={13} className="text-[var(--icon-green)]" />
                            </div>
                            <span className="text-xs font-bold tabular-nums" style={{ color: insight.color }}>
                              {insight.score}/100
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{insight.strength}</p>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground/70 italic">
                            Next step: {insight.action}
                          </p>
                        </div>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {opportunities.length > 0 && (
            <div className={strengths.length > 0 ? "mt-8" : "mt-6"}>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Where to focus
              </p>
              <div className="space-y-3">
                {opportunities.map((insight, i) => {
                  const Icon = ICON_MAP[insight.icon] ?? Leaf
                  return (
                    <ScrollReveal key={insight.pillar} delay={i * 60}>
                      <div className="flex gap-4 rounded-2xl border border-border bg-background p-5">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: insight.gradient }}
                        >
                          <Icon size={16} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{insight.label}</p>
                              <TrendingUp size={13} className="text-muted-foreground" />
                            </div>
                            <span className="text-xs font-bold tabular-nums text-muted-foreground">
                              {insight.score}/100
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{insight.opportunity}</p>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground/70 italic">
                            This week: {insight.action}
                          </p>
                        </div>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 7-Day Actions ────────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your Next 7 Days
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Three specific things you can do this week to start improving your food system.
            </p>
          </ScrollReveal>

          <div className="mt-6 space-y-4">
            {nextActions.map((action, i) => (
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
              Six foods matched to your profile — add any of them to today&apos;s plate to start improving your score right now.
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
                    <span className="text-3xl">{food.emoji}</span>
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

      {/* ── G. Abandonment safety net ──────────────────────────────────── */}
      <section className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs text-muted-foreground/50">
            Not ready for the full report?{" "}
            <button
              onClick={() => handlePurchase("starter")}
              disabled={loading}
              className="underline hover:text-muted-foreground transition-colors disabled:opacity-50"
            >
              Get your Starter Insights for €19
            </button>
          </p>
        </div>
      </section>

    </div>
  )
}
