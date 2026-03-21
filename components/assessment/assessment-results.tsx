"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Leaf,
  Wheat,
  FlaskConical,
  Clock,
  Heart,
  Utensils,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ScoreRing } from "./score-ring"
import { SubScoreCard } from "./sub-score-card"
import { PremiumTeaser } from "./premium-teaser"
import { MissionNote } from "./mission-note"
import { PillarRadar } from "./pillar-radar"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import type { AssessmentResult } from "@/lib/assessment-scoring"
import { getFoodBySlug } from "@/lib/foods"

/* ── Gut Starter Pack config ─────────────────────────────────────────── */

// Profile type → recommended food slugs (ordered by priority)
const STARTER_PACK: Record<string, string[]> = {
  "Thriving System":    ["kimchi", "kombucha", "asparagus", "tempeh", "pomegranate", "water-kefir"],
  "Strong Foundation":  ["kimchi", "kefir", "garlic", "asparagus", "wild-salmon", "almonds"],
  "Emerging Balance":   ["yogurt", "oats", "garlic", "blueberries", "eggs", "lentils"],
  "Inconsistent System":["garlic", "oats", "yogurt", "banana", "eggs", "kimchi"],
  "Underfed System":    ["garlic", "oats", "yogurt", "banana", "lentils", "kimchi"],
  "Early Builder":      ["garlic", "oats", "yogurt", "banana", "lentils", "eggs"],
}

// Fallback for any unrecognised profile
const DEFAULT_STARTER: string[] = ["garlic", "oats", "yogurt", "kefir", "lentils", "blueberries"]

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Leaf,
  Wheat,
  FlaskConical,
  Clock,
  Heart,
}

interface AssessmentResultsProps {
  result: AssessmentResult
  onRetake: () => void
  leadEmail?: string
}

function SaveResultsCard({ email }: { email?: string }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!email || sent) return
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/account`,
        },
      })
      setSent(true)
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }

  if (!email) return null

  return (
    <div className="rounded-2xl border bg-card p-6 text-center space-y-3">
      <div className="w-10 h-10 rounded-full bg-[var(--icon-green)]/10 flex items-center justify-center mx-auto">
        <span className="text-xl">💾</span>
      </div>
      <h3 className="font-semibold text-base">Save your results to your account</h3>
      <p className="text-sm text-muted-foreground">
        Access your report anytime, track your progress over time, and unlock early access to new features.
      </p>
      {sent ? (
        <p className="text-sm font-medium text-[var(--icon-green)]">
          ✓ Check your email for a sign-in link
        </p>
      ) : (
        <button
          onClick={handleSave}
          disabled={loading}
          className="brand-gradient text-white text-sm font-semibold px-6 py-2.5 rounded-full disabled:opacity-60"
        >
          {loading ? "Sending link…" : "Create your free account →"}
        </button>
      )}
    </div>
  )
}

export function AssessmentResults({ result, onRetake, leadEmail }: AssessmentResultsProps) {
  const { overall, profile, insights, nextActions } = result
  const strengths = insights.filter((i) => i.strength)
  const opportunities = insights.filter((i) => i.opportunity)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero: Score ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-10 pt-28 sm:pt-32">
        {/* Decorative glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-5"
          style={{
            background: `radial-gradient(circle, ${profile.color}, transparent 70%)`,
          }}
        />

        <div className="relative mx-auto max-w-3xl">
          {/* Overline */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: profile.color }}
              />
              Your Results
            </div>
            <h1 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              Your Food System Inside You Score
            </h1>
          </div>

          {/* Score ring + Radar side by side on desktop */}
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-center sm:gap-12">
            <div className="flex flex-col items-center">
              <ScoreRing
                score={overall}
                color={profile.color}
                gradientId="assessment-ring"
                profileType={profile.type}
              />
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Overall Score
              </p>
            </div>
            <div className="flex flex-col items-center">
              <PillarRadar subScores={result.subScores} size={260} />
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                5-Pillar Breakdown
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Profile description ──────────────────────────────────────── */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <div className="rounded-3xl border border-border bg-background overflow-hidden">
              {/* Gradient top accent */}
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${profile.color}, transparent)` }} />
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: profile.color }}
                  />
                  <span
                    className="text-base font-bold"
                    style={{ color: profile.color }}
                  >
                    {profile.type}
                  </span>
                </div>
                <p className="mt-2 font-serif text-xl font-semibold text-foreground leading-snug sm:text-2xl">
                  {profile.tagline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {profile.description}
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 5-Pillar Breakdown ───────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your 5 Pillars
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              How your food system scores across each of the five areas.
            </p>
          </ScrollReveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {insights.map((insight, i) => (
              <ScrollReveal key={insight.pillar} delay={i * 60}>
                <SubScoreCard insight={insight} index={i} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Strengths ────────────────────────────────────────────────── */}
      {strengths.length > 0 && (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <ScrollReveal>
              <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                What&rsquo;s Working
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Areas where your food system is already delivering.
              </p>
            </ScrollReveal>

            <div className="mt-6 space-y-3">
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
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{insight.label}</p>
                          <CheckCircle2 size={14} className="text-[var(--icon-green)]" />
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {insight.strength}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Opportunities ────────────────────────────────────────────── */}
      {opportunities.length > 0 && (
        <section className="border-t border-border bg-secondary/10 px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <ScrollReveal>
              <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                Where to Focus
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Areas with the most room for improvement.
              </p>
            </ScrollReveal>

            <div className="mt-6 space-y-3">
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
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{insight.label}</p>
                          <TrendingUp size={14} className="text-muted-foreground" />
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {insight.opportunity}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 7-Day Actions ────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl">
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
                  <p className="pt-1.5 text-sm leading-relaxed text-foreground sm:text-base">
                    {action}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gut Starter Pack ─────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Your personalised picks
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your Gut Starter Pack
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Six foods matched to your profile type — add any of them to today&apos;s plate to start improving your score right now.
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
                    style={{
                      borderTopColor: food.accentColor,
                      borderTopWidth: "3px",
                    }}
                  >
                    <span className="text-3xl">{food.emoji}</span>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: food.accentColor }}>
                      {food.biotic === "prebiotic" ? "Prebiotic" :
                       food.biotic === "probiotic" ? "Probiotic" :
                       food.biotic === "postbiotic" ? "Postbiotic" :
                       food.biotic === "protein" ? "Protein" : "Food"}
                    </p>
                    <p className="mt-0.5 font-serif text-sm font-semibold text-foreground">{food.name}</p>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground line-clamp-2">{food.tagline}</p>
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

      {/* ── Mission Bridge ───────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <MissionNote variant="bridge" />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Premium Teaser ───────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <PremiumTeaser result={result} />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Save Results ─────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <SaveResultsCard email={leadEmail} />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Retake + Disclaimer ──────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl flex flex-col items-center gap-4">
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
    </div>
  )
}
