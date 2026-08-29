"use client"

import { useEffect, useState } from "react"
import {
  Leaf,
  Wheat,
  FlaskConical,
  Clock,
  Heart,
  RotateCcw,
  ChevronDown,
  TrendingDown,
  Star,
  CalendarDays,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BioticIcon } from "@/components/report/food-tool"
import { swapsForPathway, type FoodSwap, type SwapPathway } from "@/lib/report/food-swaps"
import { bioticFromPillar, type PillarAlias } from "@/lib/report/visual-token"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ScoreRing } from "./score-ring"
import { ReportStarter } from "./report-starter"
import { ReportPremiumAddons } from "./report-premium-addons"
import { MissionNote } from "./mission-note"
import { loadAssessment } from "@/lib/assessment-storage"
import { generateFullReport, generatePremiumAddons } from "@/lib/assessment-report"
import type { AssessmentResult } from "@/lib/assessment-scoring"
import type { FullReport, PillarDeepDive, PremiumAddons } from "@/lib/assessment-report"
import type { ClaudeReportOutput, ClaudeStarterReport, ClaudeFullReport, ClaudePremiumReport } from "@/lib/claude-report"

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Leaf,
  Wheat,
  FlaskConical,
  Clock,
  Heart,
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** Unified soft card shadow (matches the account dashboard + homepage). */
const CARD_SHADOW = "0 2px 12px rgba(26,46,18,0.05)"

function formatRetestDate(completedAt: number): string {
  const d = new Date(completedAt + 75 * 24 * 60 * 60 * 1000)
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })
}

function buildFoodSwaps(report: FullReport): FoodSwap[] {
  // deepDives are sorted weakest-first, so [0] is the pathway to lead with.
  // It is always feed | seed | heal (PILLAR_DEEP_DIVES keys), which is exactly
  // why the old legacy-keyed lookup never matched — see lib/report/food-swaps.ts.
  const weakestPathway = (report.deepDives[0]?.pillar ?? "feed") as SwapPathway
  return swapsForPathway(weakestPathway).slice(0, 5)
}

function DeepDiveCard({ dive }: { dive: PillarDeepDive }) {
  const [open, setOpen] = useState(false)
  const Icon = ICON_MAP[dive.icon] ?? Leaf

  return (
    <div
      className="rounded-3xl border border-border bg-background overflow-hidden transition-shadow hover:shadow-lg"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-6 text-left"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: dive.gradient }}
        >
          <Icon size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-semibold text-foreground">{dive.label}</p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: dive.color }}>
                {dive.score}/100
              </span>
              <ChevronDown
                size={16}
                className={cn(
                  "text-muted-foreground transition-transform duration-200",
                  open && "rotate-180"
                )}
              />
            </div>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {dive.summary}
          </p>
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-6 pb-6 pt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Foods to prioritise
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {dive.foods.map((food) => (
              <div key={food.food} className="rounded-2xl border border-border bg-background p-4 hover:bg-secondary/20 transition-colors">
                <div className="mb-2 flex items-center gap-3">
                  <BioticIcon food={food.food} biotic={bioticFromPillar(dive.pillar as PillarAlias)} size={18} />
                  <p className="text-sm font-bold text-foreground">{food.food}</p>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{food.why}</p>
                <div className="mt-2.5 rounded-lg bg-[var(--icon-green)]/8 px-3 py-2">
                  <p className="text-[11px] leading-relaxed text-foreground/70">
                    <span className="font-semibold text-[var(--icon-green)]">How to use: </span>
                    {food.howToUse}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Worth reducing
          </p>
          <div className="mt-3 space-y-2">
            {dive.reduce.map((item) => (
              <div key={item.food} className="flex gap-3 rounded-xl border border-destructive/10 bg-destructive/5 p-4">
                <span className="mt-0.5 shrink-0 text-destructive/60 font-bold text-sm">✕</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.food}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FullReportSections({
  result,
  report,
  isDemo,
  claudeReport,
}: {
  result: AssessmentResult
  report: FullReport
  isDemo?: boolean
  claudeReport?: ClaudeFullReport | null
}) {
  const [openWeek, setOpenWeek] = useState<number>(1)

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-16 pt-28 sm:pt-32 print:pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: result.profile.color }} />
            Personal Food System Report
          </div>
          <h1 className="mt-5 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            The Food System Inside You
          </h1>
          <div className="relative mt-8 flex justify-center">
            {/* Vertical bleed only — see the identical glow in
              * paid-report-client.tsx for why the horizontal edges are pinned
              * to the parent (#218). */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-y-6 inset-x-0 -z-10 rounded-full opacity-70 blur-3xl print:hidden"
              style={{
                background:
                  "radial-gradient(60% 60% at 50% 45%, color-mix(in srgb, var(--icon-green) 28%, transparent), transparent 75%)",
              }}
            />
            <ScoreRing
              score={result.overall}
              color={result.profile.color}
              gradientId="report-ring"
              profileType={result.profile.type}
            />
          </div>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {result.profile.tagline}
          </p>
          <p className="mt-4 text-xs text-muted-foreground/50 italic">
            Building the food system inside you — and beyond.
          </p>
        </div>
      </section>

      {/* ── Pillar Deep-Dives ─────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--icon-green)]">
              Pillar Breakdown
            </p>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your Pillar Deep-Dives
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Starting with your areas of greatest opportunity. Tap each pillar to expand.
            </p>
          </ScrollReveal>
          <div className="mt-6 space-y-3">
            {report.deepDives.map((dive, i) => (
              <ScrollReveal key={dive.pillar} delay={i * 60}>
                <DeepDiveCard dive={dive} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Claude System Pattern ─────────────────────────────────────── */}
      {claudeReport?.habitAnalysis && (
        <section className="border-t border-border px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <ScrollReveal>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--icon-green)]">
                Your System
              </p>
              <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                Your System Pattern
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-foreground/80 sm:text-base whitespace-pre-line">
                {claudeReport.habitAnalysis}
              </p>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── Top 12 Foods ──────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--icon-green)]">
              Eat This
            </p>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your Top 12 Foods
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ranked by impact for your specific profile — start here.
            </p>
          </ScrollReveal>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {report.top12Foods.map((food, i) => (
              <ScrollReveal key={food.food} delay={i * 40}>
                <div className="relative flex flex-col rounded-2xl border border-border bg-background p-4 overflow-hidden">
                  {/* Rank badge */}
                  <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full brand-gradient text-[10px] font-bold text-white">
                    {i + 1}
                  </div>
                  <span className="mb-2">
                    <BioticIcon
                      food={food.food}
                      biotic={bioticFromPillar((food.pillars[0] ?? "feed") as PillarAlias)}
                      size={20}
                    />
                  </span>
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-sm font-bold text-foreground">{food.food}</p>
                    {food.priority === "high" && (
                      <Star size={11} className="text-[var(--icon-yellow)] fill-[var(--icon-yellow)]" />
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground flex-1">{food.impact}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {food.pillars.map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5 Food Swaps ──────────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--icon-green)]">
              Quick Wins
            </p>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              5 Easy Food Swaps
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Simple substitutions targeted at your weakest pillar — no willpower required.
            </p>
          </ScrollReveal>
          <div className="mt-6 space-y-3">
            {buildFoodSwaps(report).map((swap, i) => (
              <ScrollReveal key={i} delay={i * 50}>
                <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full brand-gradient text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-destructive/8 px-2.5 py-1 text-xs font-medium text-destructive/80">
                        ✕ {swap.out}
                      </span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="rounded-lg bg-[var(--icon-green)]/8 px-2.5 py-1 text-xs font-medium text-[var(--icon-green)]">
                        ✓ {swap.in}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{swap.reason}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Retest Date ───────────────────────────────────────────────── */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <div
              className="flex items-start gap-4 rounded-2xl border border-[var(--icon-teal)]/20 border-l-4 border-l-[var(--icon-teal)] p-5"
              style={{ background: "color-mix(in srgb, var(--icon-teal) 8%, transparent)" }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
              >
                <CalendarDays size={17} aria-hidden strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Your recommended retest date</p>
                <p className="mt-1 text-sm font-bold" style={{ color: "var(--icon-teal)" }}>
                  {formatRetestDate(result.completedAt)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Retesting after this window can show whether the habits you build now have shifted your pattern. Save this date and come back to see how far you&rsquo;ve come.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 30-Day Plan ───────────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--icon-green)]">
              The Plan
            </p>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your 30-Day Plan
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Four weeks of targeted habits built around your weakest pillars. One week at a time.
            </p>
          </ScrollReveal>
          {claudeReport?.rhythmInsight && (
            <ScrollReveal>
              <div
                className="mb-6 mt-4 rounded-2xl border border-[var(--icon-teal)]/20 border-l-4 border-l-[var(--icon-teal)] p-5"
                style={{ background: "color-mix(in srgb, var(--icon-teal) 8%, transparent)" }}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-teal)] mb-2">
                  Rhythm + Feeling Insight
                </p>
                <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
                  {claudeReport.rhythmInsight}
                </p>
              </div>
            </ScrollReveal>
          )}
          <div className="mt-6 space-y-3">
            {claudeReport?.thirtyDayRoadmap
              ? claudeReport.thirtyDayRoadmap.map((week) => (
                  <ScrollReveal key={week.week} delay={week.week * 60}>
                    <div
                      className="rounded-3xl border border-border bg-background overflow-hidden transition-shadow hover:shadow-lg"
                      style={{ boxShadow: CARD_SHADOW }}
                    >
                      <button
                        onClick={() => setOpenWeek(openWeek === week.week ? 0 : week.week)}
                        className="w-full flex items-center justify-between gap-4 p-5 text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full brand-gradient text-sm font-bold text-white">
                            {week.week}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Week {week.week}: {week.focus}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{week.theme}</p>
                          </div>
                        </div>
                        <ChevronDown
                          size={16}
                          className={cn(
                            "shrink-0 text-muted-foreground transition-transform duration-200",
                            openWeek === week.week && "rotate-180"
                          )}
                        />
                      </button>
                      {openWeek === week.week && (
                        <div className="border-t border-border px-5 pb-5 pt-4 space-y-3">
                          {week.actions.map((action, i) => (
                            <div key={i} className="flex gap-3 rounded-2xl border border-border bg-secondary/20 p-4">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--icon-green)]/15 text-xs font-bold text-[var(--icon-green)]">
                                {i + 1}
                              </div>
                              <div>
                                <p className="text-sm leading-relaxed text-foreground">{action}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollReveal>
                ))
              : report.thirtyDayPlan.map((week) => (
                  <ScrollReveal key={week.week} delay={week.week * 60}>
                    <div
                      className="rounded-3xl border border-border bg-background overflow-hidden transition-shadow hover:shadow-lg"
                      style={{ boxShadow: CARD_SHADOW }}
                    >
                      <button
                        onClick={() => setOpenWeek(openWeek === week.week ? 0 : week.week)}
                        className="w-full flex items-center justify-between gap-4 p-5 text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full brand-gradient text-sm font-bold text-white">
                            {week.week}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Week {week.week}: {week.title}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{week.focus}</p>
                          </div>
                        </div>
                        <ChevronDown
                          size={16}
                          className={cn(
                            "shrink-0 text-muted-foreground transition-transform duration-200",
                            openWeek === week.week && "rotate-180"
                          )}
                        />
                      </button>
                      {openWeek === week.week && (
                        <div className="border-t border-border px-5 pb-5 pt-4 space-y-3">
                          {week.habits.map((h, i) => (
                            <div key={i} className="flex gap-3 rounded-2xl border border-border bg-secondary/20 p-4">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--icon-green)]/15 text-xs font-bold text-[var(--icon-green)]">
                                {i + 1}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{h.habit}</p>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{h.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollReveal>
                ))}
          </div>
        </div>
      </section>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      {!isDemo && (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-2xl flex flex-col items-center gap-4">
            <ScrollReveal>
              <div className="flex flex-wrap justify-center gap-3">
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
    </>
  )
}

interface FullReportClientProps {
  tier?: "starter" | "full" | "premium"
  demoResult?: AssessmentResult
}

export function FullReportClient({ tier = "full", demoResult }: FullReportClientProps) {
  const [result, setResult] = useState<AssessmentResult | null>(demoResult ?? null)
  const [report, setReport] = useState<FullReport | null>(null)
  const [premiumAddons, setPremiumAddons] = useState<PremiumAddons | null>(null)
  const [claudeReport, setClaudeReport] = useState<ClaudeReportOutput | null>(null)
  const [claudeLoading, setClaudeLoading] = useState(false)

  useEffect(() => {
    const r = demoResult ?? loadAssessment().result
    if (r) {
      setResult(r)
      if (tier !== "starter") {
        setReport(generateFullReport(r))
      }
      if (tier === "premium") {
        setPremiumAddons(generatePremiumAddons(r))
      }
    }
  }, [tier, demoResult])

  useEffect(() => {
    if (!result) return
    setClaudeLoading(true)
    fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tier,
        overall: result.overall,
        subScores: result.subScores,
        profile: result.profile,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.report) setClaudeReport(data.report)
      })
      .catch(() => {})
      .finally(() => setClaudeLoading(false))
  }, [result, tier])

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Loading your report…</p>
          <p className="mt-2 text-xs text-muted-foreground/60">
            If this persists,{" "}
            <Link href="/assessment" className="underline">
              retake the assessment
            </Link>
            .
          </p>
        </div>
      </div>
    )
  }

  if (tier === "starter") {
    return (
      <div className="min-h-screen bg-background print:bg-white">
        {claudeLoading && (
          <div className="sticky top-[105px] z-30 flex items-center justify-center gap-2 border-b border-border bg-background/80 py-2 backdrop-blur-sm">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--icon-green)]/30 border-t-[var(--icon-green)]" />
            <span className="text-xs text-muted-foreground">Personalising your report with AI insights…</span>
          </div>
        )}
        <ReportStarter result={result} claudeReport={claudeReport as ClaudeStarterReport | null} />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Generating your report…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {claudeLoading && (
        <div className="sticky top-[105px] z-30 flex items-center justify-center gap-2 border-b border-border bg-background/80 py-2 backdrop-blur-sm">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--icon-green)]/30 border-t-[var(--icon-green)]" />
          <span className="text-xs text-muted-foreground">Personalising your report with AI insights…</span>
        </div>
      )}
      <FullReportSections result={result} report={report} claudeReport={claudeReport as ClaudeFullReport | null} />
      {tier === "premium" && premiumAddons && (
        <ReportPremiumAddons addons={premiumAddons} claudeReport={claudeReport as ClaudePremiumReport | null} />
      )}
      {tier === "premium" && premiumAddons && (
        <section className="border-t border-border px-6 py-12">
          <div className="mx-auto max-w-2xl flex flex-col items-center gap-4">
            <ScrollReveal>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/assessment"
                  className="flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground print:hidden"
                >
                  <RotateCcw size={14} />
                  Retake Assessment
                </Link>
              </div>
              <MissionNote variant="inline" />
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
