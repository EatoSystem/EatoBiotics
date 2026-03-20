"use client"

import {
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Leaf,
  Wheat,
  FlaskConical,
  Clock,
  Heart,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ScoreRing } from "./score-ring"
import { SubScoreCard } from "./sub-score-card"
import { PremiumTeaser } from "./premium-teaser"
import { MissionNote } from "./mission-note"
import { PillarRadar } from "./pillar-radar"
import type { AssessmentResult } from "@/lib/assessment-scoring"

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
}

export function AssessmentResults({ result, onRetake }: AssessmentResultsProps) {
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
