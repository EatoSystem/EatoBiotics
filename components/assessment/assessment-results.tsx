"use client"

import { useState, useEffect } from "react"
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
import { PremiumTeaser } from "./premium-teaser"
import { MissionNote } from "./mission-note"
import type { AssessmentResult, PillarInsight } from "@/lib/assessment-scoring"
import { getFoodBySlug } from "@/lib/foods"

/* ── Gut Starter Pack config ─────────────────────────────────────────── */

const STARTER_PACK: Record<string, string[]> = {
  "Thriving System":    ["kimchi", "kombucha", "asparagus", "tempeh", "pomegranate", "water-kefir"],
  "Strong Foundation":  ["kimchi", "kefir", "garlic", "asparagus", "wild-salmon", "almonds"],
  "Emerging Balance":   ["yogurt", "oats", "garlic", "blueberries", "eggs", "lentils"],
  "Inconsistent System":["garlic", "oats", "yogurt", "banana", "eggs", "kimchi"],
  "Underfed System":    ["garlic", "oats", "yogurt", "banana", "lentils", "kimchi"],
  "Early Builder":      ["garlic", "oats", "yogurt", "banana", "lentils", "eggs"],
}

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

/* ── Pillar mini-bar (used in hero) ─────────────────────────────────── */

function PillarMiniBar({ insight, index }: { insight: PillarInsight; index: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400 + index * 100)
    return () => clearTimeout(t)
  }, [index])

  const Icon = ICON_MAP[insight.icon] ?? Leaf

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ background: insight.gradient }}
      >
        <Icon size={13} className="text-white" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">{insight.label}</span>
          <span className="text-xs font-bold" style={{ color: insight.color }}>{insight.score}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border/40">
          <div
            className="h-full rounded-full"
            style={{
              width: visible ? `${insight.score}%` : "0%",
              background: insight.gradient,
              transition: `width 700ms ease-out ${index * 80}ms`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

/* ── Save Results Card (auto-sends magic link) ───────────────────────── */

function SaveResultsCard({ email }: { email?: string }) {
  // Email already sent by assessment-client.tsx on completion — start in sent state
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
              }).then(() => setSent(true)).catch(() => setSent(true))
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

export function AssessmentResults({ result, onRetake, leadEmail }: AssessmentResultsProps) {
  const { overall, profile, insights, nextActions } = result
  const strengths = insights.filter((i) => i.strength)
  const opportunities = insights.filter((i) => i.opportunity)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero: Score ring + Pillar bars ────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-12 pt-28 sm:pt-36">
        {/* Radial glow tinted by profile colour */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, ${profile.color} 12%, transparent), transparent 70%)`,
          }}
        />

        <div className="relative mx-auto max-w-4xl">
          {/* Overline */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: profile.color }}
              />
              Your Results
            </div>
            <h1 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
              Your Food System Inside You Score
            </h1>
          </div>

          {/* Score ring (left) + pillar bars (right) */}
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-10 lg:gap-16">
            {/* Score ring */}
            <div className="flex shrink-0 flex-col items-center">
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

            {/* Profile + pillar mini-bars */}
            <div className="w-full max-w-sm flex-1 rounded-2xl border border-border bg-background/80 p-5 backdrop-blur-sm sm:max-w-none">
              {/* Profile label */}
              <div className="mb-4 flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: profile.color }}
                />
                <span className="text-sm font-bold" style={{ color: profile.color }}>
                  {profile.type}
                </span>
              </div>
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {profile.tagline}
              </p>

              {/* 5 pillar mini-bars */}
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <PillarMiniBar key={insight.pillar} insight={insight} index={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Profile description ──────────────────────────────────────── */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <div className="rounded-3xl border border-border bg-background overflow-hidden">
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${profile.color}, transparent)` }} />
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: profile.color }}
                  />
                  <span className="text-base font-bold" style={{ color: profile.color }}>
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

      {/* ── 5-Pillar Breakdown — grouped by strength/focus ───────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your 5 Pillars
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              How your food system scores across each of the five areas that matter most for gut health.
            </p>

            {/* Summary pill row */}
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

          {/* Strengths group */}
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
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {insight.strength}
                          </p>
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

          {/* Opportunities group */}
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
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {insight.opportunity}
                          </p>
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

      {/* ── 7-Day Actions ────────────────────────────────────────────── */}
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
        <div className="mx-auto max-w-3xl">
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
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <MissionNote variant="bridge" />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Premium Teaser (PaymentCTA) ───────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <PremiumTeaser result={result} />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Save Results ─────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <SaveResultsCard email={leadEmail} />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Retake + Disclaimer ──────────────────────────────────────── */}
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
    </div>
  )
}
