"use client"

import { useState } from "react"
import { ChevronDown, Search, TriangleAlert, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollReveal } from "@/components/scroll-reveal"
import { BioticIcon, BioticBadge } from "@/components/report/food-tool"
import { CARD_SHADOW, SectionHeader } from "@/components/report/report-section"
import {
  FoodSystemSection,
  FoodSystemClosing,
} from "@/components/report/food-system-section"
import { coerceBiotic } from "@/lib/report/visual-token"
import { PATHWAY_LABEL } from "@/lib/report/subscores"
import { heroTaglineFor } from "@/lib/report/framing"
import { FOOD_TOOL_COUNT } from "@/lib/report/build-food-system-report"
import { ScoreRing } from "./score-ring"
import { MissionNote } from "./mission-note"
import { ReportMembershipCTA } from "./report-membership-cta"
import { ReportPdfDownload } from "./report-pdf-download"
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
  freeScores?: {
    overall: number
    subScores: SubScores
    profile: AssessmentProfile
  }
  membershipTier?: string
  /** Fresh short-lived signed URL, minted server-side per authorised view.
   *  Never the persisted delivery-time URL — that one expires. */
  pdfUrl?: string | null
  /** The row's pdf_status, so the download area can be honest when the PDF
   *  is pending or failed rather than showing nothing or a dead link. */
  pdfStatus?: string | null
}

/* ── Sub-components ──────────────────────────────────────────────── */
/* SectionHeader + CARD_SHADOW moved to components/report/report-section.tsx so
 * the educational Food System sections share them rather than defining a second,
 * slightly-different heading style. The markup is unchanged. */

function TopTriggerCard({ trigger, explanation }: { trigger: string; explanation: string }) {
  return (
    <div
      className="rounded-3xl border border-[var(--icon-teal)]/20 border-l-4 border-l-[var(--icon-teal)] p-6"
      style={{ background: "color-mix(in srgb, var(--icon-teal) 8%, transparent)" }}
    >
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--icon-teal)] mb-3">
        <Search size={13} aria-hidden strokeWidth={2.5} /> Your Key Insight
      </p>
      <p className="text-lg font-semibold font-serif mb-3">"{trigger}"</p>
      <p className="text-muted-foreground leading-relaxed">{explanation}</p>
    </div>
  )
}

/**
 * Tier display names, shared by the eyebrow badge and the hero fallback title.
 *
 * `personal` — the only tier on sale — is mapped to `full` upstream by
 * displayTierForReport, so this component never sees it and the live €49 report
 * titled itself "Full Report". The product name is Personal Food System Report.
 *
 * The starter/premium keys keep their own names: those reports were delivered
 * under those titles and restating an old artefact in today's vocabulary would
 * misdescribe what that buyer received. Legacy `full` reports adopt the new
 * title because it describes the artefact rather than a retired SKU, and it is
 * accurate for every one of them.
 */
const TIER_LABEL: Record<"starter" | "full" | "premium", string> = {
  starter: "Starter Insights",
  full: "Personal Food System Report",
  premium: "Premium Report",
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
  freeScores,
  membershipTier,
  pdfUrl = null,
  pdfStatus = null,
}: PaidReportClientProps) {
  const [openWeek, setOpenWeek] = useState<number>(1)

  const r = reportJson as DeepStarterReport
  const rFull = tier === "full" || tier === "premium" ? (reportJson as DeepFullReport) : null
  const rPremium = tier === "premium" ? (reportJson as DeepPremiumReport) : null

  // The educational Food System block (Phase 2). Optional by design: reports
  // persisted before it shipped do not carry one, so every use below is guarded
  // rather than defaulted, and those reports keep the same sections, copy and
  // order they had.
  //
  // Not "exactly as before", though: the shared AA fixes that came with this
  // work — the section eyebrow moving to --icon-green-text, and BioticBadge
  // moving to accentTextOnTint — change colour tokens on every report,
  // deliberately, because both were failing WCAG AA on the live report already.
  const foodSystem = reportJson.foodSystem

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-12">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section>
          <div className="text-center py-8 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">
              {freeScores?.profile?.color && (
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: freeScores.profile.color }}
                />
              )}
              {TIER_LABEL[tier]}
            </div>

            {freeScores && (
              <div className="relative flex justify-center">
                {/* Vertical bleed only. -inset-6 put this 24px past its parent
                  * on both axes, and an oversized absolute child still counts
                  * toward document scrollWidth even though it is decorative and
                  * -z-10 — that was the whole of the 4px horizontal scroll at
                  * 390px (#218). blur-3xl spreads the paint well past the box, so
                  * constraining the horizontal edges costs nothing visually. Same
                  * reasoning, and the same fix, as the ring glow in
                  * components/report/food-system-section.tsx. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-y-6 inset-x-0 -z-10 rounded-full opacity-70 blur-3xl"
                  style={{
                    background:
                      "radial-gradient(60% 60% at 50% 45%, color-mix(in srgb, var(--icon-green) 28%, transparent), transparent 75%)",
                  }}
                />
                <ScoreRing
                  score={freeScores.overall}
                  color={freeScores.profile.color}
                  gradientId="paid-report-ring"
                  profileType={freeScores.profile.type}
                />
              </div>
            )}

            {/* Structurally distinct from the report body on purpose.
              *
              * This used to render `r.opening.split(".")[0]`, so the hero showed
              * the opening's first sentence and the "Your Pattern" card below
              * then repeated the whole opening — the same sentence twice, a few
              * hundred pixels apart. It was also brittle: any full stop in the
              * profile type or a decimal in the copy truncated the headline.
              *
              * The tagline is a different string from a different source, so the
              * hero states the profile and the chapter carries the full
              * educational opening, exactly once.
              *
              * It goes through heroTaglineFor rather than reading
              * freeScores.profile.tagline directly because getProfile keys purely
              * on the OVERALL score: its >= 80 branch claims "all three pathways
              * being well supported", which is reachable with a strained pathway
              * (pre 95 / pro 25 / post 95 = 81) and would contradict the opening
              * a few hundred pixels below. heroTaglineFor applies the same
              * Framing the report body uses. */}
            <h1 className="font-serif text-3xl font-semibold sm:text-4xl leading-snug text-balance">
              {(freeScores && heroTaglineFor(freeScores)) ?? `Your ${TIER_LABEL[tier]}`}
            </h1>

          </div>
        </section>

        {/* ── PDF download / delivery status ───────────────────────── */}
        <ReportPdfDownload pdfUrl={pdfUrl} pdfStatus={pdfStatus} />

        {/* ── Your Pattern ─────────────────────────────────────────── */}
        <section>
          <ScrollReveal>
            <SectionHeader eyebrow="The Big Picture" title="Your Pattern" />
            <div
              className="rounded-3xl border border-border bg-background p-6 space-y-4 transition-shadow hover:shadow-lg"
              style={{ boxShadow: CARD_SHADOW }}
            >
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
              eyebrow="Where You Stand"
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
                    className="rounded-2xl border border-[var(--icon-green)]/20 border-l-4 border-l-[var(--icon-green)] p-4"
                    style={{ background: "color-mix(in srgb, var(--icon-green) 8%, transparent)" }}
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
                    className="rounded-2xl border border-[var(--icon-orange)]/20 border-l-4 border-l-[var(--icon-orange)] p-4"
                    style={{ background: "color-mix(in srgb, var(--icon-orange) 8%, transparent)" }}
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
            <SectionHeader eyebrow="Key Insight" title="Your Key Insight" />
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
              eyebrow="Going Deeper"
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
              eyebrow="Start Here"
              title="Your 7-Day Starter Plan"
              subtitle="One small action each day to shift your food system health trajectory."
            />
            <div className="space-y-3">
              {r.sevenDayPlan.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-lg"
                  style={{ boxShadow: CARD_SHADOW }}
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
                <SectionHeader eyebrow="Your System" title="Your System Pattern" />
                <p className="text-base leading-relaxed text-foreground/80 whitespace-pre-line">
                  {rFull.habitAnalysis}
                </p>
              </ScrollReveal>
            </section>

            {/* Rhythm & Energy */}
            <section>
              <ScrollReveal>
                <SectionHeader
                  eyebrow="Rhythm & Energy"
                  title="Rhythm & Energy"
                  subtitle="How consistency and feeling combine in your system."
                />
                <div className="space-y-4">
                  <div
                    className="rounded-2xl border border-[var(--icon-teal)]/20 border-l-4 border-l-[var(--icon-teal)] p-5"
                    style={{ background: "color-mix(in srgb, var(--icon-teal) 8%, transparent)" }}
                  >
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
                <SectionHeader eyebrow="Lifestyle" title="Lifestyle Connection" />
                <p className="text-base leading-relaxed text-foreground/80">
                  {rFull.lifestyleConnection}
                </p>
              </ScrollReveal>
            </section>

            {/* Priority foods — count comes from FOOD_TOOL_COUNT, see below */}
            <section>
              <ScrollReveal>
                {/* Subtitle is honest about the mechanism. The previous one —
                  * "Selected specifically based on your answers — not generic
                  * recommendations" — implied per-person selection, but these come
                  * from a fixed catalogue ordered by the reader's priority pathway.
                  * That IS answer-driven, and it is not bespoke. */}
                <SectionHeader
                  eyebrow="Your Priority Foods"
                  // The count is a contract with buildFoodSystemReport, not a
                  // prose choice — interpolated so the heading cannot promise a
                  // number the builder does not produce.
                  title={`${FOOD_TOOL_COUNT} Foods Chosen For You`}
                  subtitle="A practical starting set chosen to support your current priority pathway."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  {rFull.specificFoodList.map((food, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-3 transition-shadow hover:shadow-lg"
                      style={{ boxShadow: CARD_SHADOW }}
                    >
                      <div className="flex items-center gap-3">
                        <BioticIcon food={food.food} biotic={coerceBiotic(food.biotic)} size={20} />
                        <p className="text-sm font-bold text-foreground">{food.food}</p>
                        <BioticBadge biotic={coerceBiotic(food.biotic)} />
                      </div>
                      {food.mechanism && (
                        <p className="text-xs leading-relaxed text-foreground">{food.mechanism}</p>
                      )}
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {food.whyForThem}
                      </p>
                      <div className="rounded-xl bg-[var(--icon-green)]/8 px-3 py-2">
                        <p className="text-[11px] leading-relaxed text-foreground/70">
                          <span className="font-semibold text-[var(--icon-green)]">How to use: </span>
                          {food.howToUse}
                        </p>
                      </div>
                      {food.swap && (
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          <span className="font-semibold text-foreground">Swap: </span>
                          {food.swap}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </section>

            {/* 30-Day Roadmap */}
            <section>
              <ScrollReveal>
                <SectionHeader
                  eyebrow="The Plan"
                  title="Your 30-Day Roadmap"
                  subtitle="Four weeks of focused actions built around your unique food system."
                />
                <div className="space-y-3">
                  {rFull.thirtyDayRoadmap.map((week) => (
                    <div
                      key={week.week}
                      className="rounded-3xl border border-border bg-background overflow-hidden transition-shadow hover:shadow-lg"
                      style={{ boxShadow: CARD_SHADOW }}
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
                  eyebrow="Priorities"
                  title="Priority Map"
                  subtitle="The blocker and the builder your answers point to right now."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div
                    className="rounded-2xl border border-destructive/20 border-l-4 border-l-destructive p-5"
                    style={{ background: "color-mix(in srgb, var(--destructive) 8%, transparent)" }}
                  >
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-destructive/70 mb-3">
                      <TriangleAlert size={13} aria-hidden strokeWidth={2.5} /> Biggest Blocker
                    </p>
                    <p className="text-base font-semibold font-serif text-foreground mb-2">
                      {rPremium.priorityMap.biggestBlocker}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {rPremium.priorityMap.blockerExplanation}
                    </p>
                  </div>
                  <div
                    className="rounded-2xl border border-[var(--icon-green)]/20 border-l-4 border-l-[var(--icon-green)] p-5"
                    style={{ background: "color-mix(in srgb, var(--icon-green) 8%, transparent)" }}
                  >
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
                <SectionHeader eyebrow="Diagnostic" title="Gut Diagnostic Analysis" />
                <div className="space-y-4">
                  <p className="text-base leading-relaxed text-foreground/80">
                    {rPremium.gutDiagnosticSummary}
                  </p>
                  <div
                    className="rounded-2xl border border-[var(--icon-orange)]/20 border-l-4 border-l-[var(--icon-orange)] p-5"
                    style={{ background: "color-mix(in srgb, var(--icon-orange) 8%, transparent)" }}
                  >
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
                <SectionHeader eyebrow="Your Story" title="Your System Story" />
                <blockquote
                  className="rounded-2xl border-l-4 border-[var(--icon-green)] py-5 pl-6 pr-5"
                  style={{ background: "color-mix(in srgb, var(--icon-green) 6%, transparent)" }}
                >
                  <p className="text-xl font-serif font-semibold leading-relaxed text-foreground italic">
                    "{rPremium.systemStory}"
                  </p>
                </blockquote>
              </ScrollReveal>
            </section>

            {/* System Interpretation */}
            <section>
              <ScrollReveal>
                <SectionHeader eyebrow="Interpretation" title="Your System Interpretation" />
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
                  eyebrow="The Strategy"
                  title="Phased Strategy"
                  subtitle="Three phases to systematically upgrade your food system health."
                />
                <div className="space-y-4">
                  {rPremium.phasedStrategy.map((phase, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-lg"
                      style={{ boxShadow: CARD_SHADOW }}
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

        {/* ── The educational Food System report ───────────────────── */}
        {foodSystem && <FoodSystemSection report={foodSystem} />}

        {/* ── Closing ──────────────────────────────────────────────── */}
        <section>
          <ScrollReveal>
            <SectionHeader eyebrow="Closing" title="Final Thoughts" />
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
            <div
              className="flex items-start gap-4 rounded-2xl border border-[var(--icon-teal)]/20 border-l-4 border-l-[var(--icon-teal)] p-5"
              style={{ background: "color-mix(in srgb, var(--icon-teal) 8%, transparent)" }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                style={{
                  background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
                }}
              >
                <CalendarDays size={17} aria-hidden strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Your 30-day cycle
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Follow the plan for 30 days, then review: which changes were practical on an
                  ordinary week, and which signals — digestion, comfort, energy — you noticed.
                  Then retake the assessment to reset your snapshot. Individual outcomes vary;
                  the cycle is the commitment, not a result by a date.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ── Membership CTA ───────────────────────────────────────── */}
        <section>
          <ScrollReveal>
            <ReportMembershipCTA
              overall={freeScores?.overall}
              priorityLabel={
                foodSystem
                  ? PATHWAY_LABEL[foodSystem.systemSnapshot.priorityPathway]
                  : undefined
              }
              membershipBridge={(reportJson as DeepStarterReport).membershipBridge}
              membershipTier={membershipTier}
            />
          </ScrollReveal>
        </section>

        {/* ── Mission note ─────────────────────────────────────────────
         * Only for reports that predate the educational block. An enriched
         * report gets the mission message and the fixed SAFETY_FOOTER from
         * FoodSystemClosing below, so rendering this as well would repeat the
         * mission and show two different disclaimers. */}
        {!foodSystem && (
          <section>
            <ScrollReveal>
              <MissionNote variant="inline" />
              <p className="mt-4 text-center text-xs text-muted-foreground/60">
                This report is for educational purposes and is not medical advice or a diagnosis.
              </p>
            </ScrollReveal>
          </section>
        )}

        {/* ── Closing mission page ─────────────────────────────────────
         * Last, deliberately. The brief's whole point is that the report ends
         * on "Build the Food System inside you — and help build the Food System
         * around you"; anything after it takes that ending away. */}
        {foodSystem && <FoodSystemClosing report={foodSystem} />}

      </div>
    </div>
  )
}
