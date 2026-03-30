"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollReveal } from "@/components/scroll-reveal"
import { MissionNote } from "./mission-note"
import { ReportMembershipCTA } from "./report-membership-cta"
import type {
  DeepReport,
  DeepStarterReport,
  DeepFullReport,
  DeepPremiumReport,
} from "@/lib/claude-report"
import type { SubScores, AssessmentProfile } from "@/lib/assessment-scoring"

interface PaidReportClientProps {
  tier: "starter" | "full" | "premium"
  sessionId: string
  reportJson: DeepReport
  pdfUrl: string | null
  freeScores?: {
    overall: number
    subScores: SubScores
    profile: AssessmentProfile
  }
  membershipTier?: string
}

/* ── Sub-components ──────────────────────────────────────────────── */

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <div className="h-0.5 w-12 brand-gradient rounded-full mb-3" />
      <h2 className="text-2xl font-bold font-serif">{title}</h2>
      {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  )
}

function TopTriggerCard({ trigger, explanation }: { trigger: string; explanation: string }) {
  return (
    <div className="bg-[var(--icon-teal)]/6 border border-[var(--icon-teal)]/20 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--icon-teal)] rounded-l-2xl" />
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-teal)] mb-3">
        🔍 Your Key Insight
      </p>
      <p className="text-lg font-semibold font-serif mb-3">"{trigger}"</p>
      <p className="text-muted-foreground leading-relaxed">{explanation}</p>
    </div>
  )
}

const DAY_COLORS = [
  "var(--icon-lime)",
  "var(--icon-green)",
  "var(--icon-teal)",
  "var(--icon-teal)",
  "var(--icon-yellow)",
  "var(--icon-orange)",
  "var(--icon-green)",
]

/* ── Main component ──────────────────────────────────────────────── */

export function PaidReportClient({
  tier,
  reportJson,
  pdfUrl,
  freeScores,
  membershipTier,
}: PaidReportClientProps) {
  const [openWeek, setOpenWeek] = useState<number>(1)

  const r = reportJson as DeepStarterReport
  const rFull = tier === "full" || tier === "premium" ? (reportJson as DeepFullReport) : null
  const rPremium = tier === "premium" ? (reportJson as DeepPremiumReport) : null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section>
          <div className="text-center py-8 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">
              {freeScores?.profile?.color && (
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: freeScores.profile.color }}
                />
              )}
              {tier === "starter"
                ? "Starter Insights"
                : tier === "full"
                ? "Full Report"
                : "Premium Report"}
            </div>

            {freeScores && (
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span
                  className="text-sm font-semibold"
                  style={{ color: freeScores.profile.color }}
                >
                  {freeScores.profile.type}
                </span>
                <span className="text-muted-foreground text-sm">·</span>
                <span className="text-sm font-bold text-foreground">
                  {freeScores.overall}/100
                </span>
              </div>
            )}

            <h1 className="text-3xl font-bold font-serif sm:text-4xl leading-snug">
              {r.opening.split(".")[0]}.
            </h1>

            {pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--icon-green)] hover:underline"
              >
                ↓ Download Your PDF Report
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">
                PDF generating — we'll email it shortly
              </p>
            )}
          </div>
        </section>

        {/* ── Your Pattern ─────────────────────────────────────────── */}
        <section>
          <ScrollReveal>
            <SectionHeader title="Your Pattern" />
            <div className="rounded-2xl border border-border bg-background p-6 space-y-4">
              <p className="text-base leading-relaxed text-foreground/80">{r.opening}</p>
              <div className="h-px bg-border" />
              <p className="text-sm leading-relaxed text-muted-foreground">{r.scoreInterpretation}</p>
            </div>
          </ScrollReveal>
        </section>

        {/* ── Strengths & Opportunities ────────────────────────────── */}
        <section>
          <ScrollReveal>
            <SectionHeader
              title="Strengths & Opportunities"
              subtitle="What's already working for you — and where your biggest gains are."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Strengths */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-green)]">
                  ✓ Your Strengths
                </p>
                {r.strengths.map((strength, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[var(--icon-green)]/20 bg-[var(--icon-green)]/5 p-4"
                  >
                    <p className="text-sm font-semibold text-foreground mb-1">{strength}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {r.strengthExplanations[i]}
                    </p>
                  </div>
                ))}
              </div>
              {/* Opportunities */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-orange)]">
                  → Your Opportunities
                </p>
                {r.opportunities.map((opp, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[var(--icon-orange)]/20 bg-[var(--icon-orange)]/5 p-4"
                  >
                    <p className="text-sm font-semibold text-foreground mb-1">{opp}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {r.opportunityExplanations[i]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ── Your Key Insight ─────────────────────────────────────── */}
        <section>
          <ScrollReveal>
            <SectionHeader title="Your Key Insight" />
            <TopTriggerCard
              trigger={r.topTrigger}
              explanation={r.topTriggerExplanation}
            />
          </ScrollReveal>
        </section>

        {/* ── Deep Insight ─────────────────────────────────────────── */}
        <section>
          <ScrollReveal>
            <SectionHeader
              title="Deep Insight"
              subtitle="What your answers reveal about your food system."
            />
            <div className="space-y-4">
              {r.deepInsight.split("\n\n").map((para, i) => (
                <p key={i} className="text-base leading-relaxed text-foreground/80">
                  {para}
                </p>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* ── 7-Day Starter Plan ───────────────────────────────────── */}
        <section>
          <ScrollReveal>
            <SectionHeader
              title="Your 7-Day Starter Plan"
              subtitle="One small action each day to shift your gut health trajectory."
            />
            <div className="space-y-3">
              {r.sevenDayPlan.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-2xl border border-border bg-background p-4"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: DAY_COLORS[i] ?? "var(--icon-green)" }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                      {item.day}
                    </p>
                    <p className="text-sm leading-relaxed text-foreground">{item.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* ── Full + Premium sections ───────────────────────────────── */}
        {rFull && (
          <>
            {/* Your System Pattern */}
            <section>
              <ScrollReveal>
                <SectionHeader title="Your System Pattern" />
                <p className="text-base leading-relaxed text-foreground/80 whitespace-pre-line">
                  {rFull.habitAnalysis}
                </p>
              </ScrollReveal>
            </section>

            {/* Rhythm & Energy */}
            <section>
              <ScrollReveal>
                <SectionHeader
                  title="Rhythm & Energy"
                  subtitle="How consistency and feeling combine in your system."
                />
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[var(--icon-teal)]/20 bg-[var(--icon-teal)]/5 p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-teal)] mb-2">
                      Rhythm Insight
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {rFull.rhythmInsight}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {rFull.energyBreakdown}
                  </p>
                </div>
              </ScrollReveal>
            </section>

            {/* Lifestyle Connection */}
            <section>
              <ScrollReveal>
                <SectionHeader title="Lifestyle Connection" />
                <p className="text-base leading-relaxed text-foreground/80">
                  {rFull.lifestyleConnection}
                </p>
              </ScrollReveal>
            </section>

            {/* 5 Foods Chosen For You */}
            <section>
              <ScrollReveal>
                <SectionHeader
                  title="5 Foods Chosen For You"
                  subtitle="Selected specifically based on your answers — not generic recommendations."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  {rFull.specificFoodList.map((food, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{food.emoji}</span>
                        <p className="text-sm font-bold text-foreground">{food.food}</p>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {food.whyForThem}
                      </p>
                      <div className="rounded-xl bg-[var(--icon-green)]/6 px-3 py-2">
                        <p className="text-[11px] leading-relaxed text-foreground/70">
                          <span className="font-semibold text-[var(--icon-green)]">How to use: </span>
                          {food.howToUse}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </section>

            {/* 30-Day Roadmap */}
            <section>
              <ScrollReveal>
                <SectionHeader
                  title="Your 30-Day Roadmap"
                  subtitle="Four weeks of focused actions built around your unique food system."
                />
                <div className="space-y-3">
                  {rFull.thirtyDayRoadmap.map((week) => (
                    <div
                      key={week.week}
                      className="rounded-3xl border border-border bg-background overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setOpenWeek(openWeek === week.week ? 0 : week.week)
                        }
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
                            <div
                              key={i}
                              className="flex gap-3 rounded-2xl border border-border bg-secondary/20 p-4"
                            >
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--icon-green)]/15 text-xs font-bold text-[var(--icon-green)]">
                                {i + 1}
                              </div>
                              <p className="text-sm leading-relaxed text-foreground">{action}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </section>
          </>
        )}

        {/* ── Premium-only sections ──────────────────────────────────── */}
        {rPremium && (
          <>
            {/* Priority Map */}
            <section>
              <ScrollReveal>
                <SectionHeader
                  title="Priority Map"
                  subtitle="Your single biggest blocker and biggest builder right now."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-destructive/70 mb-3">
                      🚧 Biggest Blocker
                    </p>
                    <p className="text-base font-semibold font-serif text-foreground mb-2">
                      {rPremium.priorityMap.biggestBlocker}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {rPremium.priorityMap.blockerExplanation}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--icon-green)]/20 bg-[var(--icon-green)]/5 p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-green)] mb-3">
                      ✦ Biggest Builder
                    </p>
                    <p className="text-base font-semibold font-serif text-foreground mb-2">
                      {rPremium.priorityMap.biggestBuilder}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {rPremium.priorityMap.builderExplanation}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </section>

            {/* Gut Diagnostic Analysis */}
            <section>
              <ScrollReveal>
                <SectionHeader title="Gut Diagnostic Analysis" />
                <div className="space-y-4">
                  <p className="text-base leading-relaxed text-foreground/80">
                    {rPremium.gutDiagnosticSummary}
                  </p>
                  <div className="rounded-2xl border border-[var(--icon-orange)]/20 bg-[var(--icon-orange)]/5 p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-orange)] mb-2">
                      Symptom Pattern
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {rPremium.symptomPattern}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </section>

            {/* Your System Story */}
            <section>
              <ScrollReveal>
                <SectionHeader title="Your System Story" />
                <blockquote className="border-l-4 border-[var(--icon-green)] pl-6 py-2">
                  <p className="text-xl font-serif font-semibold leading-relaxed text-foreground italic">
                    "{rPremium.systemStory}"
                  </p>
                </blockquote>
              </ScrollReveal>
            </section>

            {/* System Interpretation */}
            <section>
              <ScrollReveal>
                <SectionHeader title="Your System Interpretation" />
                <div className="space-y-4">
                  {rPremium.systemInterpretation.split("\n\n").map((para, i) => (
                    <p key={i} className="text-base leading-relaxed text-foreground/80">
                      {para}
                    </p>
                  ))}
                </div>
              </ScrollReveal>
            </section>

            {/* Phased Strategy */}
            <section>
              <ScrollReveal>
                <SectionHeader
                  title="Phased Strategy"
                  subtitle="Three phases to systematically upgrade your gut health."
                />
                <div className="space-y-4">
                  {rPremium.phasedStrategy.map((phase, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-border bg-background p-5"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full brand-gradient text-xs font-bold text-white">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{phase.phase}</p>
                          <p className="text-xs text-muted-foreground">{phase.duration}</p>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-[var(--icon-teal)] mb-2">
                        Milestone: {phase.milestone}
                      </p>
                      <ul className="space-y-2">
                        {phase.actions.map((action, j) => (
                          <li key={j} className="flex gap-2 text-sm leading-relaxed text-foreground/80">
                            <span className="text-[var(--icon-green)] mt-0.5 shrink-0">→</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </section>
          </>
        )}

        {/* ── Closing ──────────────────────────────────────────────── */}
        <section>
          <ScrollReveal>
            <SectionHeader title="Final Thoughts" />
            <div className="space-y-4">
              {r.closing.split("\n\n").map((para, i) => (
                <p key={i} className="text-base leading-relaxed text-foreground/80">
                  {para}
                </p>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* ── Retest nudge ─────────────────────────────────────────── */}
        <section>
          <ScrollReveal>
            <div className="flex items-start gap-4 rounded-2xl border border-[var(--icon-teal)]/20 bg-[var(--icon-teal)]/5 p-5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-base"
                style={{
                  background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
                }}
              >
                📅
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Recommended retest: in 75 days
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  We recommend retesting in 75 days to measure your progress. Retesting after
                  60–90 days will show meaningful, measurable change from the habits you build now.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ── Membership CTA ───────────────────────────────────────── */}
        <section>
          <ScrollReveal>
            <ReportMembershipCTA
              scoreProjection={(reportJson as DeepStarterReport).scoreProjection}
              membershipBridge={(reportJson as DeepStarterReport).membershipBridge}
              membershipTier={membershipTier}
            />
          </ScrollReveal>
        </section>

        {/* ── Mission note ─────────────────────────────────────────── */}
        <section>
          <ScrollReveal>
            <MissionNote variant="inline" />
            <p className="mt-4 text-center text-xs text-muted-foreground/60">
              This report is for educational purposes and is not medical advice or a diagnosis.
            </p>
          </ScrollReveal>
        </section>

      </div>
    </div>
  )
}
