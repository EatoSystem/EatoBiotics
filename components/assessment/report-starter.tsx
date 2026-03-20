"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { RotateCcw, Printer } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ScoreRing } from "./score-ring"
import { MissionNote } from "./mission-note"
import { generateStarterReport } from "@/lib/assessment-report"
import type { AssessmentResult } from "@/lib/assessment-scoring"
import type { StarterReport } from "@/lib/assessment-report"
import type { ClaudeStarterReport } from "@/lib/claude-report"

interface ReportStarterProps {
  result: AssessmentResult
  isDemo?: boolean
  claudeReport?: ClaudeStarterReport | null
}

export function ReportStarter({ result, isDemo, claudeReport }: ReportStarterProps) {
  const [report, setReport] = useState<StarterReport | null>(null)

  useEffect(() => {
    setReport(generateStarterReport(result))
  }, [result])

  if (!report) return null

  const DAY_COLORS = [
    "var(--icon-lime)",
    "var(--icon-green)",
    "var(--icon-teal)",
    "var(--icon-yellow)",
    "var(--icon-orange)",
    "var(--icon-green)",
    "var(--icon-teal)",
  ]

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-16 pt-28 sm:pt-32 print:pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: result.profile.color }} />
            Starter Insights Report
          </div>
          <h1 className="mt-5 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            The Food System Inside You
          </h1>
          <div className="mt-8 flex justify-center">
            <ScoreRing
              score={result.overall}
              color={result.profile.color}
              gradientId="starter-ring"
              profileType={result.profile.type}
            />
          </div>
          <div className="mt-6 rounded-2xl border border-border bg-secondary/20 px-6 py-4">
            <p className="font-serif text-lg font-semibold text-foreground">{result.profile.type}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{result.profile.tagline}</p>
          </div>
        </div>
      </section>

      {/* ── Claude Opening ────────────────────────────────────────────── */}
      {claudeReport?.opening && (
        <section className="px-6 pb-4 pt-4">
          <div className="mx-auto max-w-2xl">
            <ScrollReveal>
              <p className="border-l-2 border-[var(--icon-green)] pl-4 font-serif text-base italic leading-relaxed text-foreground/80 sm:text-lg">
                {claudeReport.opening}
              </p>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── Top 5 Foods ───────────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your Top 5 Priority Foods
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The highest-leverage foods for your specific profile — start here.
            </p>
          </ScrollReveal>
          <div className="mt-6 space-y-3">
            {report.top5Foods.map((food, i) => (
              <ScrollReveal key={food.food} delay={i * 60}>
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full brand-gradient text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <span className="text-2xl">{food.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{food.food}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{food.impact}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5 Pillars at a Glance ─────────────────────────────────── */}
      <section className="border-t border-border px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your 5 Pillars at a Glance
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              How your food system scores across each area.
            </p>
          </ScrollReveal>
          <div className="mt-5 space-y-3">
            {result.insights.map((insight, i) => (
              <ScrollReveal key={insight.pillar} delay={i * 50}>
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
                  <div className="w-24 shrink-0">
                    <p className="text-xs font-semibold text-foreground">{insight.label}</p>
                  </div>
                  <div className="flex-1">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/60">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                        style={{
                          width: `${insight.score}%`,
                          background: insight.gradient,
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-10 shrink-0 text-right">
                    <span className="text-sm font-bold" style={{ color: insight.color }}>
                      {insight.score}
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Claude Strengths & Opportunities ─────────────────────────── */}
      {claudeReport?.strengths && claudeReport.strengths.length > 0 && (
        <section className="border-t border-border px-6 py-12">
          <div className="mx-auto max-w-2xl">
            <ScrollReveal>
              <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                What&rsquo;s Working
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Areas where your food system is already delivering — specific to your scores.
              </p>
            </ScrollReveal>
            <div className="mt-5 space-y-3">
              {claudeReport.strengths.map((s, i) => (
                <ScrollReveal key={i} delay={i * 60}>
                  <div className="rounded-2xl border border-[var(--icon-green)]/15 bg-[var(--icon-green)]/5 p-5">
                    <p className="text-sm font-semibold text-foreground">{s}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {claudeReport.strengthExplanations[i]}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
            <ScrollReveal>
              <h2 className="mt-8 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                Where to Focus
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Areas with the most room to grow — personalised to your assessment.
              </p>
            </ScrollReveal>
            <div className="mt-5 space-y-3">
              {claudeReport.opportunities.map((o, i) => (
                <ScrollReveal key={i} delay={i * 60}>
                  <div className="rounded-2xl border border-border bg-background p-5">
                    <p className="text-sm font-semibold text-foreground">{o}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {claudeReport.opportunityExplanations[i]}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 3 Biotics Explained ───────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              The 3 Biotics Explained
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The three forces driving your food system score — and your gut health.
            </p>
          </ScrollReveal>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              {
                name: "Prebiotics",
                emoji: "🌱",
                definition:
                  "The fibre-rich plant foods that feed your gut bacteria. Without them, your microbiome starves.",
                pillars: "Diversity · Feeding",
                gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
                color: "var(--icon-green)",
              },
              {
                name: "Probiotics",
                emoji: "🧬",
                definition:
                  "The live bacteria in fermented foods — kefir, yoghurt, sauerkraut — that directly seed your microbiome.",
                pillars: "Adding",
                gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
                color: "var(--icon-teal)",
              },
              {
                name: "Postbiotics",
                emoji: "⚡",
                definition:
                  "The compounds your gut bacteria produce when they digest fibre — including butyrate, which fuels your gut lining.",
                pillars: "Consistency · Feeling",
                gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
                color: "var(--icon-orange)",
              },
            ].map((biotic, i) => (
              <ScrollReveal key={biotic.name} delay={i * 70}>
                <div className="flex flex-col rounded-2xl border border-border bg-background p-5">
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                    style={{ background: biotic.gradient }}
                  >
                    <span>{biotic.emoji}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{biotic.name}</p>
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">
                    {biotic.definition}
                  </p>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: biotic.color }}>
                    {biotic.pillars}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7-Day Starter Plan ────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your 7-Day Starter Plan
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              One targeted action per day, built around your weakest pillars.
            </p>
          </ScrollReveal>
          <div className="mt-6 space-y-3">
            {claudeReport?.sevenDayPlan
              ? claudeReport.sevenDayPlan.map((day, i) => (
                  <ScrollReveal key={day.day} delay={i * 50}>
                    <div className="flex items-start gap-4 rounded-2xl border border-border bg-background p-4">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: `linear-gradient(135deg, ${DAY_COLORS[i]}, ${DAY_COLORS[(i + 1) % DAY_COLORS.length]})` }}
                      >
                        {day.day}
                      </div>
                      <div>
                        <p className="mt-1 text-sm leading-relaxed text-foreground">{day.action}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))
              : report.sevenDayPlan.map((day, i) => (
                  <ScrollReveal key={day.day} delay={i * 50}>
                    <div className="flex items-start gap-4 rounded-2xl border border-border bg-background p-4">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: `linear-gradient(135deg, ${DAY_COLORS[i]}, ${DAY_COLORS[(i + 1) % DAY_COLORS.length]})` }}
                      >
                        {day.day}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day.label}</p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground">{day.habit}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
          </div>
        </div>
      </section>

      {/* ── Claude Closing ────────────────────────────────────────────── */}
      {claudeReport?.closing && (
        <section className="border-t border-border bg-secondary/10 px-6 py-10">
          <div className="mx-auto max-w-2xl">
            <ScrollReveal>
              <p className="font-serif text-base leading-relaxed text-foreground/80 sm:text-lg">
                {claudeReport.closing}
              </p>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── Mission Note ──────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/5 px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <MissionNote variant="inline" />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      {!isDemo && (
        <section className="border-t border-border px-6 py-12">
          <div className="mx-auto max-w-2xl flex flex-col items-center gap-4">
            <ScrollReveal>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground print:hidden"
                >
                  <Printer size={14} />
                  Print / Save PDF
                </button>
                <Link
                  href="/assessment"
                  className="flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground print:hidden"
                >
                  <RotateCcw size={14} />
                  Retake Assessment
                </Link>
              </div>
              <p className="mt-4 max-w-md text-center text-xs text-muted-foreground/60">
                This report is for educational purposes and is not medical advice or a diagnosis.
              </p>
            </ScrollReveal>
          </div>
        </section>
      )}
    </div>
  )
}
