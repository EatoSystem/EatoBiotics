// lib/pdf/food-system-pdf.tsx
// Server-only — the educational Food System chapters of the paid PDF.

import React from "react"
import {
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Circle,
  Path,
  Link,
} from "@react-pdf/renderer"
import { BRAND, accentFill, accentText, withAlpha, type BrandAccent } from "./pdf-brand"
import { FONT } from "./pdf-fonts"
import { PATHWAY_LABEL, type BioticScoreKey } from "@/lib/report/subscores"
import type {
  FoodSystemNode,
  FoodSystemReport,
} from "@/lib/report/food-system-report-types"

/**
 * The paid PDF's Food System chapters, rendering the same `FoodSystemReport`
 * the web report signed off in Phases 3–4.
 *
 * ── Why the body figure is vector ────────────────────────────────────────────
 *
 * The web version renders `visualTheme.bodyAssetPath` (`couple-hero.png`), but
 * `next.config.mjs` excludes `public/images/**` from serverless tracing, so that
 * file does not exist on disk inside the `/api/submit-deep-assessment` lambda.
 * Embedding it by path would throw at render time and take down every paid PDF —
 * the same failure mode Phase 1 fixed. Shipping it via tracingIncludes would add
 * ~1.6 MB to the lambda and to every generated PDF.
 *
 * So `bodyAssetPath` is used as the **selector** — individual vs family framing —
 * and the figure itself is drawn with react-pdf Svg primitives: no file
 * dependency, no bundle cost, and crisp at print resolution.
 *
 * ── Language ─────────────────────────────────────────────────────────────────
 *
 * Every string comes from the report object. This module adds no health copy of
 * its own, so it cannot weaken the builder's non-diagnostic framing.
 */

/* ── State presentation ──────────────────────────────────────────────────────
 * Print has no hover, no colour filters, and is often photocopied in mono. Every
 * state is written out, exactly as on the web. */

const STATE_LABEL: Record<FoodSystemNode["state"], string> = {
  strong: "Well supported",
  building: "Building",
  strained: "Room to grow",
  unknown: "Not enough to say",
}

const STATE_ACCENT: Record<FoodSystemNode["state"], BrandAccent> = {
  strong: "green",
  building: "teal",
  strained: "orange",
  unknown: "yellow",
}

const PATHWAY_ACCENT: Record<BioticScoreKey, BrandAccent> = {
  prebiotics: "lime",
  probiotics: "teal",
  postbiotics: "orange",
}

const INSIDE_OUT_LEVELS = [
  "You",
  "Family",
  "Community",
  "County",
  "Country",
  "The Food System",
] as const

/* ── Styles ──────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  page: {
    backgroundColor: BRAND.white,
    paddingTop: 40,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    fontFamily: FONT.sans,
  },
  chapterRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  chapterNumeral: {
    fontSize: 10,
    fontFamily: FONT.sansBold,
    color: BRAND.white,
    backgroundColor: BRAND.green,
    borderRadius: 9,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 7,
    paddingRight: 7,
    marginRight: 8,
  },
  eyebrow: {
    fontSize: 8,
    fontFamily: FONT.sansBold,
    color: BRAND.greenText,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: { fontSize: 19, fontFamily: FONT.serifBold, color: BRAND.darkText },
  subtitle: {
    fontSize: 10,
    fontFamily: FONT.sans,
    color: BRAND.subText,
    marginTop: 4,
    lineHeight: 1.5,
  },
  body: {
    fontSize: 10,
    fontFamily: FONT.sans,
    color: BRAND.bodyText,
    lineHeight: 1.55,
  },
  fieldLabel: {
    fontSize: 7.5,
    fontFamily: FONT.sansBold,
    color: BRAND.mutedGrey,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  card: {
    borderWidth: 1,
    borderColor: BRAND.lightGrey,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  /* Lens safety. A callout, not a footnote: for Glucose and Mind this is the
   * most important text on the page, and it must not read as small print. */
  safetyCallout: {
    borderWidth: 1,
    borderColor: BRAND.teal,
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  safetyCalloutLabel: {
    fontSize: 8,
    fontFamily: FONT.sansBold,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: BRAND.tealText,
    marginBottom: 5,
  },
  safetyCalloutBody: {
    fontSize: 10,
    lineHeight: 1.5,
    color: BRAND.darkText,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: FONT.serifBold,
    color: BRAND.darkText,
    marginBottom: 6,
  },
  field: { marginBottom: 6 },
  tint: { borderRadius: 6, padding: 9, marginTop: 6 },
  badge: {
    fontSize: 7.5,
    fontFamily: FONT.sansBold,
    borderRadius: 8,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 6,
    paddingRight: 6,
  },
  row: { flexDirection: "row", alignItems: "center" },
  scoreRow: { flexDirection: "row", marginTop: 14, marginBottom: 4 },
  scoreCell: { flex: 1, alignItems: "center" },
  scoreNumber: { fontSize: 20, fontFamily: FONT.serifBold },
  scoreLabel: {
    fontSize: 7.5,
    fontFamily: FONT.sansBold,
    color: BRAND.subText,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },
  scoreState: { fontSize: 8, fontFamily: FONT.sans, marginTop: 1 },
  spacer: { marginTop: 14 },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND.lightGrey,
    marginTop: 14,
    marginBottom: 14,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    fontSize: 7.5,
    fontFamily: FONT.sans,
    color: BRAND.mutedGrey,
    textAlign: "center",
  },
  missionLine: {
    fontSize: 21,
    fontFamily: FONT.serifBold,
    color: BRAND.darkText,
    textAlign: "center",
    lineHeight: 1.3,
  },
  levels: {
    fontSize: 9,
    fontFamily: FONT.sansBold,
    color: BRAND.darkText,
    textAlign: "center",
    marginTop: 12,
  },
  safety: {
    fontSize: 7.5,
    fontFamily: FONT.sans,
    color: BRAND.subText,
    lineHeight: 1.5,
    marginTop: 18,
    textAlign: "center",
  },
  evidenceClaim: {
    fontSize: 9,
    fontFamily: FONT.sans,
    color: BRAND.bodyText,
    lineHeight: 1.5,
  },
  evidenceSource: {
    fontSize: 8,
    fontFamily: FONT.sansBold,
    color: BRAND.tealText,
    marginTop: 3,
    textDecoration: "underline",
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  weekNumeral: {
    fontSize: 9,
    fontFamily: FONT.sansBold,
    color: BRAND.white,
    borderRadius: 8,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 7,
    paddingRight: 7,
    marginRight: 7,
  },
  bullet: { flexDirection: "row", marginBottom: 3 },
  bulletMark: {
    fontSize: 9,
    color: BRAND.tealText,
    marginRight: 5,
    fontFamily: FONT.sansBold,
  },
})

/* ── Shared bits ─────────────────────────────────────────────────────────── */

function ChapterHeading({
  number,
  eyebrow,
  title,
  subtitle,
}: {
  number?: string
  eyebrow: string
  title: string
  subtitle?: string
}) {
  return (
    <View>
      <View style={s.chapterRow}>
        {number && <Text style={s.chapterNumeral}>{number}</Text>}
        <Text style={s.eyebrow}>{eyebrow}</Text>
      </View>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.body}>{value}</Text>
    </View>
  )
}

function PdfFooter() {
  return (
    <Text style={s.footer} fixed>
      EatoBiotics · Your Food System Report
    </Text>
  )
}

function StateBadge({ state }: { state: FoodSystemNode["state"] }) {
  const accent = STATE_ACCENT[state]
  return (
    <Text
      style={[
        s.badge,
        { color: accentText(accent), backgroundColor: withAlpha(accentFill(accent), 0.15) },
      ]}
    >
      {STATE_LABEL[state]}
    </Text>
  )
}

function NodeCard({ node }: { node: FoodSystemNode }) {
  return (
    <View style={s.card} wrap={false}>
      <View style={s.row}>
        <Text style={[s.cardTitle, { marginBottom: 0, marginRight: 8, flex: 1 }]}>
          {node.label}
        </Text>
        <StateBadge state={node.state} />
      </View>
      {typeof node.score === "number" && (
        <Text style={[s.fieldLabel, { marginTop: 5 }]}>{node.score} / 100</Text>
      )}
      <Text style={[s.body, { marginTop: 5 }]}>{node.explanation}</Text>
    </View>
  )
}

/* ── The body figure, drawn rather than embedded ─────────────────────────── */

/**
 * A simple brand figure with the three pathways ringed around it. `family`
 * draws a second, smaller figure alongside — the same distinction
 * visualTheme.bodyAssetPath encodes on the web (couple-hero vs family-hero).
 */
function BodyFigure({
  scores,
  states,
  family,
}: {
  scores: Record<BioticScoreKey, number>
  states: Partial<Record<BioticScoreKey, FoodSystemNode["state"]>>
  family: boolean
}) {
  const W = 300
  const H = 190
  const cx = W / 2
  const cy = H / 2 + 6

  const person = (x: number, scale: number, color: string) => (
    <>
      <Circle cx={x} cy={cy - 34 * scale} r={11 * scale} fill={color} />
      <Path
        d={`M ${x - 15 * scale} ${cy + 40 * scale}
            L ${x - 12 * scale} ${cy - 12 * scale}
            Q ${x} ${cy - 25 * scale} ${x + 12 * scale} ${cy - 12 * scale}
            L ${x + 15 * scale} ${cy + 40 * scale} Z`}
        fill={color}
      />
    </>
  )

  return (
    <View style={{ alignItems: "center", marginTop: 10 }}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Rings: outer to inner, so the figure sits on top. */}
        <Circle cx={cx} cy={cy} r={84} stroke={BRAND.orange} strokeWidth={1} fill="none" />
        <Circle cx={cx} cy={cy} r={70} stroke={BRAND.teal} strokeWidth={1} fill="none" />
        <Circle cx={cx} cy={cy} r={56} stroke={BRAND.lime} strokeWidth={1} fill="none" />

        {family ? (
          <>
            {person(cx - 16, 0.92, BRAND.green)}
            {person(cx + 20, 0.7, BRAND.lime)}
          </>
        ) : (
          person(cx, 1, BRAND.green)
        )}
      </Svg>

      {/* The scores and states as words and numbers, directly under the figure:
       * the rings are orientation, never the data. */}
      <View style={[s.scoreRow, { width: W }]}>
        {(["prebiotics", "probiotics", "postbiotics"] as BioticScoreKey[]).map((k) => {
          const accent = PATHWAY_ACCENT[k]
          const st = states[k]
          return (
            <View key={k} style={s.scoreCell}>
              <Text style={[s.scoreNumber, { color: accentText(accent) }]}>
                {scores[k]}
              </Text>
              <Text style={s.scoreLabel}>{PATHWAY_LABEL[k]}</Text>
              {st && (
                <Text style={[s.scoreState, { color: accentText(accent) }]}>
                  {STATE_LABEL[st]}
                </Text>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}

/* ── The chapters ────────────────────────────────────────────────────────── */

export function FoodSystemPages({ report }: { report: FoodSystemReport }) {
  let n = 0
  const ch = () => String(++n).padStart(2, "0")

  const family = report.visualTheme.bodyAssetPath.includes("family")
  const states: Partial<Record<BioticScoreKey, FoodSystemNode["state"]>> = {}
  for (const node of report.foodSystemMap) {
    if (node.id === "prebiotics" || node.id === "probiotics" || node.id === "postbiotics") {
      states[node.id] = node.state
    }
  }

  return (
    <>
      {/* Opener — the cover of the educational chapter. Unnumbered, matching
       * the web report, so the first teaching chapter is 01 on both surfaces. */}
      <Page size="A4" style={s.page}>
        <ChapterHeading
          eyebrow="Your Food System"
          title={report.title}
          subtitle={report.systemSnapshot.oneLine}
        />
        <BodyFigure scores={report.bioticScores} states={states} family={family} />
        <View style={s.divider} />
        <Text style={s.body}>{report.systemSnapshot.dominantPattern}</Text>
        <View style={[s.tint, { backgroundColor: withAlpha(BRAND.green, 0.08), marginTop: 12 }]}>
          <Text style={s.fieldLabel}>Your main lever</Text>
          <Text style={s.body}>{report.systemSnapshot.mainLever}</Text>
        </View>
        <PdfFooter />
      </Page>

      {/* Education modules */}
      <Page size="A4" style={s.page}>
        <ChapterHeading
          number={ch()}
          eyebrow="How It Works"
          title="Your 3-Biotics Engine"
          subtitle="What each pathway does, and what your answers suggest about yours."
        />
        <View style={s.spacer}>
          {report.educationModules.map((mod, i) => {
            const accent = mod.visualToken.accent as BrandAccent
            return (
              <View key={i} style={s.card} wrap={false}>
                <Text style={s.cardTitle}>{mod.title}</Text>
                <Field label="In plain English" value={mod.plainEnglish} />
                <Field label="Why it matters" value={mod.whyItMatters} />
                <Field
                  label="What your answers suggest"
                  value={mod.whatYourAnswersSuggest}
                />
                <View style={[s.tint, { backgroundColor: withAlpha(accentFill(accent), 0.08) }]}>
                  <Text style={[s.body, { color: accentText(accent) }]}>
                    Try this: {mod.actionBridge}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>
        <PdfFooter />
      </Page>

      {/* System map */}
      <Page size="A4" style={s.page}>
        <ChapterHeading
          number={ch()}
          eyebrow="The Map"
          title="Your Food System, Part by Part"
          subtitle="Where each pathway stands right now."
        />
        <View style={s.spacer}>
          {report.foodSystemMap.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </View>
        <PdfFooter />
      </Page>

      {/* Body signals */}
      <Page size="A4" style={s.page}>
        <ChapterHeading
          number={ch()}
          eyebrow="Body Signals"
          title="What To Notice"
          subtitle="Food-pattern clues, not diagnoses. Treat them as feedback on what you changed."
        />
        <View style={s.spacer}>
          {report.bodySignalMap.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </View>
        <PdfFooter />
      </Page>

      {/* Priority lever */}
      <Page size="A4" style={s.page}>
        <ChapterHeading number={ch()} eyebrow="Start Here" title="Your Priority Lever" />
        <View
          style={[
            s.card,
            s.spacer,
            { backgroundColor: withAlpha(BRAND.green, 0.06), borderColor: "#BFE3BE" },
          ]}
        >
          <Text style={s.cardTitle}>{report.priorityLever.title}</Text>
          <Field label="Why this first" value={report.priorityLever.whyThisFirst} />
          <Field label="Your first step" value={report.priorityLever.firstStep} />
          <Field label="What to notice" value={report.priorityLever.whatToNotice} />
        </View>
        <PdfFooter />
      </Page>

      {/* Food tools */}
      <Page size="A4" style={s.page}>
        <ChapterHeading
          number={ch()}
          eyebrow="Food Tools"
          title="Foods As Tools, Not A Shopping List"
          subtitle="What each one does inside your system — and why it suits your answers."
        />
        <View style={s.spacer}>
          {report.foodTools.map((tool, i) => (
            <View key={i} style={s.card} wrap={false}>
              <View style={s.row}>
                <Text style={[s.cardTitle, { marginBottom: 0, marginRight: 8, flex: 1 }]}>
                  {tool.food}
                </Text>
                <Text
                  style={[
                    s.badge,
                    {
                      color: accentText(tool.visualToken.accent as BrandAccent),
                      backgroundColor: withAlpha(
                        accentFill(tool.visualToken.accent as BrandAccent),
                        0.15,
                      ),
                    },
                  ]}
                >
                  {tool.biotic}
                </Text>
              </View>
              <Text style={[s.body, { marginTop: 5 }]}>{tool.mechanism}</Text>
              <Text style={[s.body, { marginTop: 4, color: BRAND.subText }]}>
                {tool.whyForThisCustomer}
              </Text>
              <Text style={[s.body, { marginTop: 4, color: BRAND.subText }]}>
                {tool.howToUse}
              </Text>
              {tool.swap ? (
                <Text style={[s.body, { marginTop: 4, color: BRAND.subText }]}>
                  Swap: {tool.swap}
                </Text>
              ) : null}
              {tool.familyAdaptation ? (
                <Text style={[s.body, { marginTop: 4, color: BRAND.subText }]}>
                  For a family: {tool.familyAdaptation}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
        <PdfFooter />
      </Page>

      {/* 30-day loop */}
      <Page size="A4" style={s.page}>
        <ChapterHeading
          number={ch()}
          eyebrow="The Loop"
          title="Your 30-Day Improvement Loop"
          subtitle="Four weeks, one focus each — built to survive an ordinary week."
        />
        <View style={s.spacer}>
          {report.thirtyDayLoop.map((week) => (
            <View key={week.week} style={s.card} wrap={false}>
              <View style={s.weekHeader}>
                <Text style={[s.weekNumeral, { backgroundColor: BRAND.teal }]}>
                  {week.week}
                </Text>
                <Text style={[s.cardTitle, { marginBottom: 0 }]}>{week.focus}</Text>
              </View>
              <Text style={s.body}>{week.action}</Text>
              <Text style={[s.body, { marginTop: 4, color: BRAND.subText }]}>
                {week.why}
              </Text>
            </View>
          ))}
        </View>
        <PdfFooter />
      </Page>

      {/* Family context — family reports only */}
      {report.familyContext && (
        <Page size="A4" style={s.page}>
          <ChapterHeading
            number={ch()}
            eyebrow="Your Household"
            title="The Family Table"
            subtitle="How this applies where more than one person eats."
          />
          <View style={[s.card, s.spacer, { backgroundColor: withAlpha(BRAND.teal, 0.06) }]}>
            <Text style={s.body}>{report.familyContext.householdPattern}</Text>
            {report.familyContext.constraints.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={s.fieldLabel}>Working around</Text>
                {report.familyContext.constraints.map((c, i) => (
                  <View key={i} style={s.bullet}>
                    <Text style={s.bulletMark}>-</Text>
                    <Text style={s.body}>{c}</Text>
                  </View>
                ))}
              </View>
            )}
            {report.familyContext.memberNotes.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={s.fieldLabel}>Notes per person</Text>
                {report.familyContext.memberNotes.map((m, i) => (
                  <View key={i} style={s.bullet}>
                    <Text style={s.bulletMark}>-</Text>
                    <Text style={s.body}>{m}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={{ marginTop: 8 }}>
              <Field label="Your shared lever" value={report.familyContext.sharedLever} />
            </View>
          </View>
          <PdfFooter />
        </Page>
      )}

      {/* The purchased lens. Same position as the web report — after the loop,
        * before Evidence, with the closing mission page still last — and it
        * shares the ch() counter so numbering matches the web exactly. */}
      {report.lens && (
        <Page size="A4" style={s.page}>
          <ChapterHeading
            number={ch()}
            eyebrow="Your Focus Area"
            title={report.lens.name}
            subtitle={`What this looks at: ${report.lens.examines}`}
          />

          <View style={s.spacer}>
            <View style={s.card} wrap={false}>
              <Text style={s.cardTitle}>What your answers describe</Text>
              <Text style={s.body}>{report.lens.patternSummary}</Text>
            </View>

            <Text style={[s.cardTitle, { marginTop: 14 }]}>
              How this connects to your Food System
            </Text>
            {report.lens.pathwayConnections.map((pc) => (
              <View key={pc.pathway} style={s.card} wrap={false}>
                <Text style={s.cardTitle}>{PATHWAY_LABEL[pc.pathway]}</Text>
                <Text style={s.body}>{pc.connection}</Text>
              </View>
            ))}

            <View style={[s.card, { marginTop: 14 }]} wrap={false}>
              <Text style={s.cardTitle}>
                Where it matters most: {PATHWAY_LABEL[report.lens.priorityConnection.pathway]}
              </Text>
              <Text style={s.body}>{report.lens.priorityConnection.why}</Text>
            </View>

            <Text style={[s.cardTitle, { marginTop: 14 }]}>What to notice</Text>
            {report.lens.signals.map((sig) => (
              <View key={sig.label} style={s.card} wrap={false}>
                <Text style={s.cardTitle}>{sig.label}</Text>
                <Text style={s.body}>{sig.whatToNotice}</Text>
              </View>
            ))}

            <Text style={[s.cardTitle, { marginTop: 14 }]}>Added to your 30-day loop</Text>
            {report.lens.loopAdditions.map((l) => (
              <View key={l.week} style={s.card} wrap={false}>
                <Text style={s.cardTitle}>Week {l.week}</Text>
                <Text style={s.body}>{l.action}</Text>
              </View>
            ))}
          </View>
          <PdfFooter />
        </Page>
      )}

      {/* Lens evidence — its own page so a long source list cannot push the
        * safety note onto an orphan page. */}
      {report.lens && (
        <Page size="A4" style={s.page}>
          <ChapterHeading
            number={ch()}
            eyebrow="Evidence & Safety"
            title="Evidence & Safety"
            subtitle={`The sources behind ${report.lens.shortLabel} — what each supports, and what it does not show.`}
          />
          <View style={s.spacer}>
            {/* Safety FIRST, above the citations. Placing it after the source
              * list buries the single most important sentence in the chapter —
              * for Glucose, that this does not measure blood glucose; for Mind,
              * that it does not diagnose. wrap={false} so it can never split
              * across a page break or be orphaned from its label. */}
            <View style={s.safetyCallout} wrap={false}>
              <Text style={s.safetyCalloutLabel}>What this lens does not do</Text>
              <Text style={s.safetyCalloutBody}>{report.lens.safetyNote}</Text>
            </View>

            {report.lens.evidenceNotes.map((note) => (
              <View key={note.url} style={s.card} wrap={false}>
                <Link src={note.url}>
                  <Text style={s.evidenceSource}>{note.title}</Text>
                </Link>
                <Text style={s.evidenceClaim}>
                  {note.organisation} · {note.year}
                </Text>
                <Text style={s.body}>What it supports: {note.whatItSupports}</Text>
                <Text style={s.evidenceClaim}>What it does not show: {note.limitation}</Text>
              </View>
            ))}
          </View>
          <PdfFooter />
        </Page>
      )}

      {/* Evidence */}
      <Page size="A4" style={s.page}>
        <ChapterHeading
          number={ch()}
          eyebrow="Evidence"
          title="Where This Comes From"
          subtitle="The sources behind the general claims in this report."
        />
        <View style={s.spacer}>
          {report.evidenceNotes.map((note, i) => (
            <View key={i} style={s.card} wrap={false}>
              <Text style={s.evidenceClaim}>{note.claim}</Text>
              <Link src={note.sourceUrl}>
                <Text style={s.evidenceSource}>{note.sourceTitle}</Text>
              </Link>
            </View>
          ))}
        </View>
        <PdfFooter />
      </Page>

      {/* Closing mission page — last, exactly as on the web. */}
      <Page size="A4" style={s.page}>
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Svg width={230} height={150} viewBox="0 0 230 150">
            <Circle cx={115} cy={75} r={70} stroke={BRAND.orange} strokeWidth={1} fill="none" />
            <Circle cx={115} cy={75} r={58} stroke={BRAND.yellow} strokeWidth={1} fill="none" />
            <Circle cx={115} cy={75} r={46} stroke={BRAND.teal} strokeWidth={1} fill="none" />
            <Circle cx={115} cy={75} r={34} stroke={BRAND.green} strokeWidth={1} fill="none" />
            <Circle cx={115} cy={75} r={22} stroke={BRAND.lime} strokeWidth={1} fill="none" />
            <Circle cx={115} cy={62} r={7} fill={BRAND.green} />
            <Path
              d="M 105 100 L 107 76 Q 115 68 123 76 L 125 100 Z"
              fill={BRAND.green}
            />
          </Svg>
          {/* Five rings, six levels: the figure at the centre is "You". The
           * levels are written out because the rings alone say nothing. */}
          <Text style={s.levels}>{INSIDE_OUT_LEVELS.join("  >  ")}</Text>
        </View>

        <View style={{ marginTop: 24 }}>
          {report.closingMissionPage.headlineLines.map((line) => (
            <Text key={line} style={s.missionLine}>
              {line}
            </Text>
          ))}
        </View>

        <View style={{ marginTop: 22 }}>
          <Text style={s.body}>{report.closingMissionPage.insideYou}</Text>
          <Text style={[s.body, { marginTop: 10 }]}>
            {report.closingMissionPage.aroundYou}
          </Text>
        </View>

        <View style={[s.tint, { backgroundColor: withAlpha(BRAND.green, 0.08), marginTop: 16 }]}>
          <Text style={s.fieldLabel}>Your next step</Text>
          <Text style={s.body}>{report.closingMissionPage.nextAction}</Text>
        </View>

        <Text style={s.safety}>{report.safetyFooter}</Text>
        <PdfFooter />
      </Page>
    </>
  )
}
