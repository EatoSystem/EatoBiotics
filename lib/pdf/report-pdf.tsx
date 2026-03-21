// lib/pdf/report-pdf.tsx
// Server-only — no "use client" directive
// Renders branded EatoBiotics PDF reports using @react-pdf/renderer

import React from "react"
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Rect,
} from "@react-pdf/renderer"
import type {
  DeepReport,
  DeepStarterReport,
  DeepFullReport,
  DeepPremiumReport,
} from "@/lib/claude-report"
import type { AssessmentProfile } from "@/lib/assessment-scoring"

/* ── Types ────────────────────────────────────────────────────────────── */

interface SubScores {
  diversity: number
  feeding: number
  adding: number
  consistency: number
  feeling: number
}

export interface ReportPDFProps {
  tier: "starter" | "full" | "premium"
  leadName: string
  generatedAt: string
  freeScores: {
    overall: number
    subScores: SubScores
    profile: AssessmentProfile
  }
  report: DeepReport
}

/* ── Brand constants ─────────────────────────────────────────────────── */

const BRAND = {
  lime: "#7fc47e",
  green: "#4caf7d",
  teal: "#3ab0a0",
  yellow: "#e6b84a",
  orange: "#e07b4a",
  white: "#ffffff",
  offWhite: "#f9f9f9",
  lightGrey: "#eeeeee",
  mutedGrey: "#999999",
  bodyText: "#444444",
  darkText: "#222222",
  subText: "#666666",
} as const

const PILLAR_COLORS: Record<keyof SubScores, string> = {
  diversity: BRAND.lime,
  feeding: BRAND.green,
  adding: BRAND.teal,
  consistency: BRAND.yellow,
  feeling: BRAND.orange,
}

const PILLAR_LABELS: Record<keyof SubScores, string> = {
  diversity: "Plant Diversity",
  feeding: "Feeding",
  adding: "Live Foods",
  consistency: "Consistency",
  feeling: "Feeling",
}

/* ── Styles ──────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  page: {
    backgroundColor: BRAND.white,
    paddingTop: 40,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    fontFamily: "Helvetica",
  },

  // Cover
  coverHeaderRect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  coverBrandLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  coverTitle: {
    fontSize: 22,
    color: BRAND.white,
    fontFamily: "Helvetica-Bold",
  },
  coverHeaderContent: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: BRAND.green,
  },
  scoreBadge: {
    backgroundColor: BRAND.green,
    borderRadius: 10,
    paddingTop: 18,
    paddingBottom: 18,
    paddingLeft: 32,
    paddingRight: 32,
    alignSelf: "center",
    marginTop: 32,
    marginBottom: 20,
  },
  scoreBadgeNumber: {
    fontSize: 56,
    fontFamily: "Helvetica-Bold",
    color: BRAND.white,
    textAlign: "center",
  },
  scoreBadgeLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    fontFamily: "Helvetica",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 4,
  },
  coverName: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: BRAND.darkText,
    textAlign: "center",
    marginTop: 24,
  },
  coverDate: {
    fontSize: 10,
    color: BRAND.subText,
    textAlign: "center",
    marginTop: 6,
  },
  coverProfileType: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: BRAND.green,
    textAlign: "center",
    marginTop: 18,
  },
  coverTagline: {
    fontSize: 12,
    fontFamily: "Helvetica",
    color: BRAND.subText,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },

  // Section headings
  sectionHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND.mutedGrey,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 14,
  },

  // Text sections
  textSectionHeading: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: BRAND.darkText,
    marginBottom: 8,
  },
  textSectionBody: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: BRAND.bodyText,
    lineHeight: 1.6,
  },
  accentBorderWrapper: {
    flexDirection: "row",
    marginBottom: 20,
  },
  accentBorder: {
    width: 3,
    marginRight: 14,
    borderRadius: 2,
  },
  accentContent: {
    flex: 1,
  },

  // Pillar row
  pillarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  pillarAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  pillarLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND.darkText,
    width: 100,
  },
  pillarBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: BRAND.lightGrey,
    borderRadius: 3,
    marginHorizontal: 10,
  },
  pillarBarFill: {
    height: 6,
    borderRadius: 3,
  },
  pillarScore: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    width: 36,
    textAlign: "right",
  },

  // Two-column list
  twoColRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  twoColItem: {
    flex: 1,
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingTop: 6,
    paddingBottom: 6,
  },
  twoColItemLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND.darkText,
    marginBottom: 3,
  },
  twoColItemText: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: BRAND.bodyText,
    lineHeight: 1.5,
  },

  // Day plan table
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: BRAND.green,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BRAND.white,
  },
  tableRow: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 4,
    marginBottom: 3,
  },
  tableDayCell: {
    width: 80,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BRAND.darkText,
  },
  tableActionCell: {
    flex: 1,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: BRAND.bodyText,
    lineHeight: 1.5,
  },

  // Pull quote
  pullQuoteWrapper: {
    flexDirection: "row",
    marginBottom: 16,
  },
  pullQuoteBorder: {
    width: 4,
    borderRadius: 2,
    marginRight: 16,
  },
  pullQuoteContent: {
    flex: 1,
  },
  pullQuoteText: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: BRAND.darkText,
    fontStyle: "italic",
    lineHeight: 1.5,
    marginBottom: 6,
  },
  pullQuoteSubtext: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: BRAND.bodyText,
    lineHeight: 1.6,
  },

  // Food card
  foodCardWrapper: {
    backgroundColor: BRAND.offWhite,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  foodCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  foodCardEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  foodCardName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: BRAND.darkText,
  },
  foodCardWhy: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: BRAND.bodyText,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  foodCardHow: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: BRAND.subText,
    lineHeight: 1.5,
  },

  // Week box
  weekBoxWrapper: {
    marginBottom: 14,
    borderRadius: 8,
    overflow: "hidden",
  },
  weekBoxHeader: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
  },
  weekBoxWeekLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BRAND.white,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  weekBoxFocus: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: BRAND.white,
  },
  weekBoxBody: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: BRAND.offWhite,
  },
  weekBoxTheme: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: BRAND.bodyText,
    fontStyle: "italic",
    marginBottom: 8,
  },
  weekBoxAction: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekBoxBullet: {
    fontSize: 10,
    color: BRAND.teal,
    marginRight: 6,
    fontFamily: "Helvetica-Bold",
  },
  weekBoxActionText: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: BRAND.bodyText,
    flex: 1,
    lineHeight: 1.5,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BRAND.lightGrey,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: BRAND.mutedGrey,
  },
  footerPageNumber: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND.mutedGrey,
  },

  // Utility
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND.lightGrey,
    marginBottom: 20,
    marginTop: 4,
  },
  spacer: {
    marginBottom: 20,
  },
  smallSpacer: {
    marginBottom: 12,
  },
})

/* ── Footer component ────────────────────────────────────────────────── */

function Footer({ pageNumber }: { pageNumber?: number }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        EatoBiotics · For educational purposes only, not medical advice · eatobiotics.com
      </Text>
      {pageNumber !== undefined && (
        <Text style={styles.footerPageNumber}>Page {pageNumber}</Text>
      )}
    </View>
  )
}

/* ── CoverPage ───────────────────────────────────────────────────────── */

function CoverPage({
  leadName,
  generatedAt,
  overall,
  profile,
}: {
  leadName: string
  generatedAt: string
  overall: number
  profile: AssessmentProfile
}) {
  return (
    <Page size="A4" style={styles.page}>
      {/* Green header band */}
      <View style={styles.coverHeaderContent}>
        <Text style={styles.coverBrandLabel}>EatoBiotics</Text>
        <Text style={styles.coverTitle}>Your Personalised Report</Text>
      </View>

      {/* Score badge */}
      <View style={styles.scoreBadge}>
        <Text style={styles.scoreBadgeNumber}>{overall}/100</Text>
        <Text style={styles.scoreBadgeLabel}>Your Score</Text>
      </View>

      {/* User details */}
      <Text style={styles.coverName}>{leadName}</Text>
      <Text style={styles.coverDate}>Generated {generatedAt}</Text>

      {/* Profile */}
      <Text style={styles.coverProfileType}>{profile.type}</Text>
      <Text style={styles.coverTagline}>{profile.tagline}</Text>

      <Footer />
    </Page>
  )
}

/* ── PillarScoresSection ─────────────────────────────────────────────── */

function PillarScoresSection({ subScores }: { subScores: SubScores }) {
  const pillars = Object.entries(subScores) as [keyof SubScores, number][]

  return (
    <View style={styles.spacer}>
      <Text style={styles.sectionHeading}>Your 5 Pillars</Text>
      {pillars.map(([key, score]) => {
        const color = PILLAR_COLORS[key]
        const label = PILLAR_LABELS[key]
        const barWidth = `${score}%` as `${number}%`
        return (
          <View key={key} style={styles.pillarRow}>
            <View style={[styles.pillarAccent, { backgroundColor: color }]} />
            <Text style={styles.pillarLabel}>{label}</Text>
            <View style={styles.pillarBarBg}>
              <View
                style={[
                  styles.pillarBarFill,
                  { backgroundColor: color, width: barWidth },
                ]}
              />
            </View>
            <Text style={[styles.pillarScore, { color }]}>{score}</Text>
          </View>
        )
      })}
    </View>
  )
}

/* ── TextSection ─────────────────────────────────────────────────────── */

function TextSection({
  heading,
  body,
  accentColor,
}: {
  heading: string
  body: string
  accentColor?: string
}) {
  if (accentColor) {
    return (
      <View style={[styles.accentBorderWrapper, styles.smallSpacer]}>
        <View style={[styles.accentBorder, { backgroundColor: accentColor }]} />
        <View style={styles.accentContent}>
          <Text style={styles.textSectionHeading}>{heading}</Text>
          <Text style={styles.textSectionBody}>{body}</Text>
        </View>
      </View>
    )
  }
  return (
    <View style={styles.smallSpacer}>
      <Text style={styles.textSectionHeading}>{heading}</Text>
      <Text style={styles.textSectionBody}>{body}</Text>
    </View>
  )
}

/* ── TwoColumnList ───────────────────────────────────────────────────── */

function TwoColumnList({
  heading,
  leftItems,
  leftLabel,
  rightItems,
  rightLabel,
  leftColor,
  rightColor,
}: {
  heading: string
  leftItems: { label: string; explanation: string }[]
  leftLabel: string
  rightItems: { label: string; explanation: string }[]
  rightLabel: string
  leftColor: string
  rightColor: string
}) {
  const maxRows = Math.max(leftItems.length, rightItems.length)

  return (
    <View style={styles.spacer}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {Array.from({ length: maxRows }).map((_, i) => {
        const left = leftItems[i]
        const right = rightItems[i]
        return (
          <View key={i} style={styles.twoColRow}>
            {left ? (
              <View
                style={[
                  styles.twoColItem,
                  { borderLeftColor: leftColor },
                ]}
              >
                <Text style={styles.twoColItemLabel}>
                  {leftLabel}: {left.label}
                </Text>
                <Text style={styles.twoColItemText}>{left.explanation}</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {right ? (
              <View
                style={[
                  styles.twoColItem,
                  { borderLeftColor: rightColor },
                ]}
              >
                <Text style={styles.twoColItemLabel}>
                  {rightLabel}: {right.label}
                </Text>
                <Text style={styles.twoColItemText}>{right.explanation}</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
        )
      })}
    </View>
  )
}

/* ── DayPlanTable ────────────────────────────────────────────────────── */

function DayPlanTable({
  plan,
}: {
  plan: Array<{ day: string; action: string }>
}) {
  return (
    <View style={styles.spacer}>
      <Text style={styles.sectionHeading}>Your 7-Day Starter Plan</Text>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, { width: 80 }]}>Day</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Action</Text>
      </View>
      {plan.map((item, i) => (
        <View
          key={i}
          style={[
            styles.tableRow,
            { backgroundColor: i % 2 === 0 ? BRAND.offWhite : BRAND.white },
          ]}
        >
          <Text style={styles.tableDayCell}>{item.day}</Text>
          <Text style={styles.tableActionCell}>{item.action}</Text>
        </View>
      ))}
    </View>
  )
}

/* ── PullQuote ───────────────────────────────────────────────────────── */

function PullQuote({
  text,
  subtext,
  color,
}: {
  text: string
  subtext: string
  color: string
}) {
  return (
    <View style={[styles.pullQuoteWrapper, styles.smallSpacer]}>
      <View style={[styles.pullQuoteBorder, { backgroundColor: color }]} />
      <View style={styles.pullQuoteContent}>
        <Text style={[styles.pullQuoteText, { color }]}>{text}</Text>
        <Text style={styles.pullQuoteSubtext}>{subtext}</Text>
      </View>
    </View>
  )
}

/* ── FoodCard ────────────────────────────────────────────────────────── */

function FoodCard({
  food,
  emoji,
  whyForThem,
  howToUse,
}: {
  food: string
  emoji: string
  whyForThem: string
  howToUse: string
}) {
  return (
    <View style={styles.foodCardWrapper}>
      <View style={styles.foodCardHeader}>
        <Text style={styles.foodCardEmoji}>{emoji}</Text>
        <Text style={styles.foodCardName}>{food}</Text>
      </View>
      <Text style={styles.foodCardWhy}>{whyForThem}</Text>
      <Text style={styles.foodCardHow}>How to use: {howToUse}</Text>
    </View>
  )
}

/* ── WeekBox ─────────────────────────────────────────────────────────── */

function WeekBox({
  week,
  focus,
  theme,
  actions,
}: {
  week: number
  focus: string
  theme: string
  actions: string[]
}) {
  // Cycle through brand colors for each week
  const weekColors = [BRAND.teal, BRAND.green, BRAND.lime, BRAND.yellow]
  const color = weekColors[(week - 1) % weekColors.length]

  return (
    <View style={styles.weekBoxWrapper}>
      <View style={[styles.weekBoxHeader, { backgroundColor: color }]}>
        <Text style={styles.weekBoxWeekLabel}>Week {week}</Text>
        <Text style={styles.weekBoxFocus}>{focus}</Text>
      </View>
      <View style={styles.weekBoxBody}>
        <Text style={styles.weekBoxTheme}>{theme}</Text>
        {actions.map((action, i) => (
          <View key={i} style={styles.weekBoxAction}>
            <Text style={styles.weekBoxBullet}>•</Text>
            <Text style={styles.weekBoxActionText}>{action}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

/* ── RetestNote ──────────────────────────────────────────────────────── */

function RetestNote({ retestDate }: { retestDate: string }) {
  return (
    <View
      style={{
        backgroundColor: BRAND.offWhite,
        borderRadius: 8,
        padding: 14,
        borderLeftWidth: 3,
        borderLeftColor: BRAND.teal,
        marginBottom: 16,
      }}
    >
      <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: BRAND.darkText, marginBottom: 4 }}>
        Recommended Retest
      </Text>
      <Text style={{ fontSize: 10, fontFamily: "Helvetica", color: BRAND.bodyText, lineHeight: 1.5 }}>
        Retest on {retestDate} to measure your progress after 75 days of consistent change.
      </Text>
    </View>
  )
}

/* ── Utility: compute retest date ────────────────────────────────────── */

function getRetestDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 75)
  return d.toLocaleDateString("en-IE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/* ── Main ReportPDF component ────────────────────────────────────────── */

export function ReportPDF({
  tier,
  leadName,
  generatedAt,
  freeScores,
  report,
}: ReportPDFProps) {
  const { overall, subScores, profile } = freeScores
  const retestDate = getRetestDate()

  // Type narrowing
  const isFullOrPremium = tier === "full" || tier === "premium"
  const isPremium = tier === "premium"
  const starterReport = report as DeepStarterReport
  const fullReport = isFullOrPremium ? (report as DeepFullReport) : null
  const premiumReport = isPremium ? (report as DeepPremiumReport) : null

  return (
    <Document
      title={`EatoBiotics Report — ${leadName}`}
      author="EatoBiotics"
      subject={`Personalised ${tier} gut health report`}
      creator="EatoBiotics"
    >
      {/* ── Page 1: Cover ── */}
      <CoverPage
        leadName={leadName}
        generatedAt={generatedAt}
        overall={overall}
        profile={profile}
      />

      {/* ── Page 2: Pillar scores + Opening + Score interpretation ── */}
      <Page size="A4" style={styles.page}>
        <PillarScoresSection subScores={subScores} />
        <View style={styles.divider} />
        <TextSection
          heading="Your Assessment"
          body={starterReport.opening}
          accentColor={BRAND.green}
        />
        <TextSection
          heading="What Your Score Means"
          body={starterReport.scoreInterpretation}
        />
        <Footer />
      </Page>

      {/* ── Page 3: Strengths + Opportunities + Top Trigger ── */}
      <Page size="A4" style={styles.page}>
        <TwoColumnList
          heading="Strengths &amp; Opportunities"
          leftLabel="Strength"
          leftItems={starterReport.strengths.map((label, i) => ({
            label,
            explanation: starterReport.strengthExplanations[i] ?? "",
          }))}
          leftColor={BRAND.green}
          rightLabel="Focus"
          rightItems={starterReport.opportunities.map((label, i) => ({
            label,
            explanation: starterReport.opportunityExplanations[i] ?? "",
          }))}
          rightColor={BRAND.orange}
        />
        <View style={styles.divider} />
        <Text style={styles.sectionHeading}>Your Top Trigger</Text>
        <PullQuote
          text={starterReport.topTrigger}
          subtext={starterReport.topTriggerExplanation}
          color={BRAND.teal}
        />
        <Footer />
      </Page>

      {/* ── Page 4: Deep Insight + 7-Day Plan ── */}
      <Page size="A4" style={styles.page}>
        <TextSection
          heading="Your Deep Insight"
          body={starterReport.deepInsight}
          accentColor={BRAND.teal}
        />
        <View style={styles.divider} />
        <DayPlanTable plan={starterReport.sevenDayPlan} />
        <Footer />
      </Page>

      {/* ── Page 5: Closing + Retest ── */}
      <Page size="A4" style={styles.page}>
        <TextSection
          heading="Closing Thoughts"
          body={starterReport.closing}
          accentColor={BRAND.lime}
        />
        <View style={styles.divider} />
        <RetestNote retestDate={retestDate} />
        <Footer />
      </Page>

      {/* ── Full + Premium: Habit Analysis, Rhythm, Lifestyle, Foods, Roadmap ── */}
      {fullReport && (
        <>
          <Page size="A4" style={styles.page}>
            <TextSection
              heading="Habit Analysis"
              body={fullReport.habitAnalysis}
              accentColor={BRAND.green}
            />
            <View style={styles.divider} />
            <TextSection
              heading="Your Rhythm &amp; Energy"
              body={`${fullReport.rhythmInsight}\n\n${fullReport.energyBreakdown}`}
              accentColor={BRAND.yellow}
            />
            <Footer />
          </Page>

          <Page size="A4" style={styles.page}>
            <TextSection
              heading="Lifestyle Connection"
              body={fullReport.lifestyleConnection}
              accentColor={BRAND.teal}
            />
            <Footer />
          </Page>

          <Page size="A4" style={styles.page}>
            <Text style={styles.sectionHeading}>Your 5 Priority Foods</Text>
            {fullReport.specificFoodList.map((item, i) => (
              <FoodCard
                key={i}
                food={item.food}
                emoji={item.emoji}
                whyForThem={item.whyForThem}
                howToUse={item.howToUse}
              />
            ))}
            <Footer />
          </Page>

          <Page size="A4" style={styles.page}>
            <Text style={styles.sectionHeading}>Your 30-Day Roadmap</Text>
            {fullReport.thirtyDayRoadmap.map((week) => (
              <WeekBox
                key={week.week}
                week={week.week}
                focus={week.focus}
                theme={week.theme}
                actions={week.actions}
              />
            ))}
            <Footer />
          </Page>
        </>
      )}

      {/* ── Premium only: Priority Map, Gut Diagnostic, System Story, Phased Strategy ── */}
      {premiumReport && (
        <>
          <Page size="A4" style={styles.page}>
            <Text style={styles.sectionHeading}>Your Priority Map</Text>
            <TwoColumnList
              heading=""
              leftLabel="Biggest Blocker"
              leftItems={[
                {
                  label: premiumReport.priorityMap.biggestBlocker,
                  explanation: premiumReport.priorityMap.blockerExplanation,
                },
              ]}
              leftColor={BRAND.orange}
              rightLabel="Biggest Builder"
              rightItems={[
                {
                  label: premiumReport.priorityMap.biggestBuilder,
                  explanation: premiumReport.priorityMap.builderExplanation,
                },
              ]}
              rightColor={BRAND.green}
            />
            <View style={styles.divider} />
            <TextSection
              heading="Gut Diagnostic Summary"
              body={premiumReport.gutDiagnosticSummary}
              accentColor={BRAND.teal}
            />
            <View style={styles.smallSpacer} />
            <TextSection
              heading="Symptom Pattern"
              body={premiumReport.symptomPattern}
            />
            <Footer />
          </Page>

          <Page size="A4" style={styles.page}>
            <TextSection
              heading="System Interpretation"
              body={premiumReport.systemInterpretation}
              accentColor={BRAND.green}
            />
            <View style={styles.divider} />
            <Text style={styles.sectionHeading}>Your System Story</Text>
            <PullQuote
              text={premiumReport.systemStory}
              subtext=""
              color={BRAND.teal}
            />
            <Footer />
          </Page>

          <Page size="A4" style={styles.page}>
            <Text style={styles.sectionHeading}>Your 90-Day Strategy</Text>
            {premiumReport.phasedStrategy.map((phase, i) => (
              <View key={i} style={styles.weekBoxWrapper}>
                <View
                  style={[
                    styles.weekBoxHeader,
                    {
                      backgroundColor:
                        i === 0
                          ? BRAND.teal
                          : i === 1
                          ? BRAND.green
                          : BRAND.lime,
                    },
                  ]}
                >
                  <Text style={styles.weekBoxWeekLabel}>
                    {phase.phase} · {phase.duration}
                  </Text>
                  <Text style={styles.weekBoxFocus}>{phase.milestone}</Text>
                </View>
                <View style={styles.weekBoxBody}>
                  {phase.actions.map((action, j) => (
                    <View key={j} style={styles.weekBoxAction}>
                      <Text style={styles.weekBoxBullet}>•</Text>
                      <Text style={styles.weekBoxActionText}>{action}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            <Footer />
          </Page>
        </>
      )}
    </Document>
  )
}
