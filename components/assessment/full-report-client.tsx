"use client"

import { useEffect, useState } from "react"
import {
  Leaf,
  Wheat,
  FlaskConical,
  Clock,
  Heart,
  Printer,
  RotateCcw,
  ChevronDown,
  TrendingDown,
  Star,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
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

function formatRetestDate(completedAt: number): string {
  const d = new Date(completedAt + 75 * 24 * 60 * 60 * 1000)
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })
}

const FOOD_SWAPS: Record<string, { out: string; in: string; reason: string }[]> = {
  diversity: [
    { out: "Same salad greens every week", in: "Rotate 3+ different leafy greens", reason: "Each leaf variety feeds different microbial strains — variety is the mechanism, not just the outcome." },
    { out: "White rice as a staple", in: "Mixed grains (farro, barley, or quinoa)", reason: "Swapping white rice for diverse whole grains increases the fibre types reaching your colon bacteria." },
    { out: "Standard crisps or crackers", in: "Seedy crackers (flax, sesame, poppy)", reason: "Seeds are compact plant diversity — each type carries a different fibre and polyphenol profile." },
    { out: "Bottled juice with your meal", in: "Whole fruit or a fruit + seed combo", reason: "Juice removes the fibre matrix. Whole fruit delivers both the sugar and the prebiotic fibre together." },
    { out: "Single-veg side dishes", in: "Roasted 3-veg medleys", reason: "Mixing vegetables at every meal is the simplest way to expand your weekly plant count." },
  ],
  feeding: [
    { out: "White bread at breakfast", in: "Whole grain rye or seeded sourdough", reason: "Rye arabinoxylans outperform wheat fibre in studies measuring microbial diversity gain." },
    { out: "Pasta as a quick dinner base", in: "Lentil pasta or wholewheat pasta", reason: "Lentil pasta adds 8g+ protein and soluble fibre per serving — the substrate your gut bacteria need." },
    { out: "Crisps or crackers as a snack", in: "Hummus with raw vegetable sticks", reason: "Chickpeas deliver both protein and prebiotic fibre; raw veg preserves the fibre structure." },
    { out: "Instant porridge sachets", in: "Rolled or steel-cut oats", reason: "Instant oats are pre-digested — you lose the intact beta-glucan that drives Bifidobacterium growth." },
    { out: "Skipping the side vegetable", in: "Frozen veg added to every main meal", reason: "Frozen veg is nutritionally equivalent to fresh. Removing the prep barrier is the single biggest fibre lever." },
  ],
  adding: [
    { out: "Flavoured yoghurt", in: "Plain live yoghurt + fresh fruit", reason: "Flavoured yoghurts typically have added sugar and lower live bacteria counts. Plain, full-fat live yoghurt delivers the cultures." },
    { out: "Standard table salt on food", in: "Miso paste in soups and dressings", reason: "Miso adds umami and live cultures. Replacing salt with miso is the simplest daily fermented food upgrade." },
    { out: "Vinegar-based pickles (pasteurised)", in: "Lacto-fermented pickles or sauerkraut", reason: "Vinegar pickles have no live cultures. Lacto-fermented versions provide hundreds of millions of bacteria per serving." },
    { out: "Fizzy soft drink with meals", in: "Kombucha (low sugar, <5g/100ml)", reason: "Kombucha provides organic acids and live cultures. Choose unflavoured or low-sugar varieties." },
    { out: "Cheese spread or processed cheese", in: "Kefir-based dressings or dips", reason: "Kefir contains 30+ live strains. Blending with herbs makes a creamy, probiotic-rich alternative." },
  ],
  consistency: [
    { out: "Skipping breakfast when busy", in: "Overnight oats prepared the night before", reason: "Overnight oats take 2 minutes to prepare. Removing the morning decision barrier protects your gut's feeding rhythm." },
    { out: "Takeaway when no plan exists", in: "A default 'fallback meal' from pantry staples", reason: "Having one simple pantry meal (e.g. lentil soup from canned lentils) removes the decision that breaks consistency." },
    { out: "Eating at different times each day", in: "Anchored meal windows (30-min tolerance)", reason: "Even rough consistency in meal timing synchronises your gut microbiome's circadian rhythm." },
    { out: "Grazing and snacking between meals", in: "Planned snack at 10:30 and 3:30", reason: "Scheduled snacks reduce hunger-driven food decisions and give gut bacteria predictable substrate timing." },
    { out: "Rushed meals at the desk", in: "One sit-down, screen-free meal per day", reason: "Distraction-free eating activates the parasympathetic nervous system, improving digestive enzyme output." },
  ],
  feeling: [
    { out: "Eating straight after exercise", in: "15-minute rest window before eating", reason: "Exercise redirects blood flow away from the gut. A short rest window allows motility to normalise before a meal." },
    { out: "Large evening meal as the biggest meal", in: "Larger lunch, lighter dinner", reason: "Digestive enzyme output peaks midday. A lighter evening meal works with your gut's circadian schedule." },
    { out: "Coffee on an empty stomach", in: "Coffee after a fibre-rich breakfast", reason: "Coffee stimulates gastric acid production. Eating first buffers this and reduces post-coffee digestive discomfort." },
    { out: "Eating quickly under stress", in: "Three deep breaths before eating", reason: "The gut-brain axis is directly affected by stress state. Even a brief pause activates rest-and-digest mode." },
    { out: "High-FODMAP foods during flares", in: "Low-FODMAP alternatives during sensitive periods", reason: "Onion, garlic, and wheat ferment rapidly in the gut. Temporary reduction during flares identifies your personal threshold." },
  ],
}

function buildFoodSwaps(report: FullReport): { out: string; in: string; reason: string }[] {
  // Use weakest pillar (first in deepDives since they're sorted weakest-first)
  const weakestPillar = report.deepDives[0]?.pillar ?? "feeding"
  const swaps = FOOD_SWAPS[weakestPillar] ?? FOOD_SWAPS.feeding
  return swaps.slice(0, 5)
}

function DeepDiveCard({ dive }: { dive: PillarDeepDive }) {
  const [open, setOpen] = useState(false)
  const Icon = ICON_MAP[dive.icon] ?? Leaf

  return (
    <div className="rounded-3xl border border-border bg-background overflow-hidden">
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
              <div key={food.food} className="rounded-2xl border border-border bg-secondary/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{food.emoji}</span>
                  <p className="text-sm font-semibold text-foreground">{food.food}</p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{food.why}</p>
                <p className="mt-2 text-xs font-medium text-foreground/70">
                  <span className="text-[var(--icon-green)]">How to use: </span>
                  {food.howToUse}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Worth reducing
          </p>
          <div className="mt-3 space-y-2">
            {dive.reduce.map((item) => (
              <div key={item.food} className="flex gap-3 rounded-xl border border-border bg-background p-4">
                <TrendingDown size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
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
            Full Report
          </div>
          <h1 className="mt-5 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            The Food System Inside You
          </h1>
          <div className="mt-8 flex justify-center">
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
                <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full brand-gradient text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{food.emoji}</span>
                      <p className="text-sm font-semibold text-foreground">{food.food}</p>
                      {food.priority === "high" && (
                        <Star size={11} className="text-[var(--icon-yellow)] fill-[var(--icon-yellow)]" />
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{food.impact}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {food.pillars.map((p) => (
                        <span
                          key={p}
                          className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
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
            <div className="flex items-start gap-4 rounded-2xl border border-[var(--icon-teal)]/20 bg-[var(--icon-teal)]/5 p-5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-base"
                style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
              >
                📅
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Your recommended retest date</p>
                <p className="mt-1 text-sm font-bold" style={{ color: "var(--icon-teal)" }}>
                  {formatRetestDate(result.completedAt)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Retesting in 60–90 days will show meaningful, measurable progress from the habits you build now. Save this date and come back to see how far you&rsquo;ve come.
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
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your 30-Day Plan
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Four weeks of targeted habits built around your weakest pillars. One week at a time.
            </p>
          </ScrollReveal>
          {claudeReport?.rhythmInsight && (
            <ScrollReveal>
              <div className="mb-6 mt-4 rounded-2xl border border-[var(--icon-teal)]/20 bg-[var(--icon-teal)]/5 p-5">
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
                    <div className="rounded-3xl border border-border bg-background overflow-hidden">
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
                    <div className="rounded-3xl border border-border bg-background overflow-hidden">
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
