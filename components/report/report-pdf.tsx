// No "use client" — this runs server-side only (in the API route)
import {
  Document,
  Page,
  View,
  Text,
  Svg,
  Circle,
  Rect,
  Line,
  StyleSheet,
} from "@react-pdf/renderer"
import type { DemoReportData } from "./demo-report"

/* ─── Brand palette ───────────────────────────────────────────────────── */
const C = {
  dark:      "#1a2e12",
  darkMid:   "#243a1a",
  green:     "#22c55e",
  lime:      "#84cc16",
  teal:      "#14b8a6",
  orange:    "#f97316",
  yellow:    "#eab308",
  text:      "#111827",
  muted:     "#6b7280",
  mutedLight:"#9ca3af",
  border:    "#e5e7eb",
  bg:        "#ffffff",
  bgLight:   "#f9fafb",
  bgGreen:   "#f0fdf4",
}

const pillarColor = (name: string) =>
  name === "Probiotics" ? C.orange : name === "Postbiotics" ? C.teal : C.green

/* ─── Page geometry ───────────────────────────────────────────────────── */
const MX = 44   // horizontal margin
const MY = 48   // vertical margin
const CW = 595 - MX * 2  // content width = 507

/* ─── StyleSheet ──────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingLeft: MX,
    paddingRight: MX,
    paddingTop: MY,
    paddingBottom: MY + 22,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.text,
  },
  coverPage: {
    backgroundColor: C.dark,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },

  /* Header / footer */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
    paddingBottom: 10,
    marginBottom: 26,
  },
  headerText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: MX,
    right: MX,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: "solid",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: C.mutedLight,
    fontFamily: "Helvetica",
  },

  /* Labels & headings */
  sectionLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  h1: { fontFamily: "Times-Bold", fontSize: 28, color: C.text, marginBottom: 6 },
  h2: { fontFamily: "Times-Bold", fontSize: 20, color: C.text, marginBottom: 5 },
  h3: { fontFamily: "Times-Bold", fontSize: 13, color: C.text, marginBottom: 4 },
  h4: { fontFamily: "Helvetica-Bold", fontSize: 10, color: C.text, marginBottom: 3 },
  body:  { fontSize: 9.5, lineHeight: 1.55, color: C.text },
  small: { fontSize: 8, lineHeight: 1.5, color: C.muted },
  tiny:  { fontSize: 7, lineHeight: 1.4, color: C.mutedLight },

  /* Layout */
  row:    { flexDirection: "row" },
  col:    { flex: 1 },
  spacer: { height: 14 },
  smallSpacer: { height: 8 },

  /* Cards */
  card: {
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
    borderRadius: 8,
    backgroundColor: C.bg,
    padding: 14,
  },
  cardLight: {
    backgroundColor: C.bgLight,
    borderRadius: 6,
    padding: 12,
  },
  accentCard: {
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftStyle: "solid",
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: "solid",
    borderRightWidth: 1,
    borderRightColor: C.border,
    borderRightStyle: "solid",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
    backgroundColor: C.bg,
  },
  darkBand: {
    backgroundColor: C.dark,
    padding: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
})

/* ─── Shared helpers ──────────────────────────────────────────────────── */

function Header({ label }: { label: string }) {
  return (
    <View style={s.header}>
      <Text style={s.headerText}>EatoBiotics</Text>
      <Text style={[s.headerText, { color: C.mutedLight }]}>{label}</Text>
    </View>
  )
}

function Footer({ page }: { page: number }) {
  return (
    <View style={s.footer}>
      <Text style={s.footerText}>eatobiotics.com</Text>
      <Text style={s.footerText}>{page}</Text>
    </View>
  )
}

function SectionLabel({ text, color }: { text: string; color: string }) {
  return <Text style={[s.sectionLabel, { color }]}>{text}</Text>
}

function ScoreRingLarge({ score, accent, size }: { score: number; accent: string; size: number }) {
  const r = size / 2 - 9
  const circ = 2 * Math.PI * r
  const fill = circ * score / 100
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={r}
        stroke="rgba(255,255,255,0.12)" strokeWidth={9} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r}
        stroke={accent} strokeWidth={9} fill="none"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  )
}

function ScoreRingSmall({ score, color, size = 52 }: { score: number; color: string; size?: number }) {
  const r = size / 2 - 5
  const circ = 2 * Math.PI * r
  const fill = circ * score / 100
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={r}
        stroke={C.border} strokeWidth={5} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={5} fill="none"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  )
}

function PillarBar({ score, color, label, compact }: { score: number; color: string; label: string; compact?: boolean }) {
  return (
    <View style={{ marginBottom: compact ? 5 : 8 }}>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 3 }]}>
        <Text style={[s.tiny, { color: C.muted }]}>{label}</Text>
        <Text style={[s.tiny, { fontFamily: "Helvetica-Bold", color: C.text }]}>{score}</Text>
      </View>
      <View style={[s.row, { height: 4, borderRadius: 2, backgroundColor: C.border }]}>
        <View style={{ flex: score, backgroundColor: color, borderRadius: 2 }} />
        <View style={{ flex: 100 - score }} />
      </View>
    </View>
  )
}

function Chip({ text, color }: { text: string; color: string }) {
  return (
    <View style={{
      borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
      backgroundColor: color + "22", borderWidth: 1, borderColor: color + "55", borderStyle: "solid",
      marginRight: 5,
    }}>
      <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color }}>{text}</Text>
    </View>
  )
}

function CheckItem({ text, color }: { text: string; color: string }) {
  return (
    <View style={[s.row, { marginBottom: 5, alignItems: "flex-start" }]}>
      <View style={{
        width: 14, height: 14, borderRadius: 7,
        backgroundColor: color + "22", marginRight: 7, marginTop: 0.5,
        flexShrink: 0, alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: 7, color, fontFamily: "Helvetica-Bold" }}>✓</Text>
      </View>
      <Text style={[s.body, { flex: 1, fontSize: 9 }]}>{text}</Text>
    </View>
  )
}

/* ─── PAGE 1: COVER ───────────────────────────────────────────────────── */
function CoverPage({ data }: { data: DemoReportData }) {
  const accent = data.theme.accent.replace("var(--icon-teal)", C.teal)
    .replace("var(--icon-green)", C.green)
    .replace("var(--icon-yellow)", C.yellow)

  const resolvedAccent = accent.startsWith("var") ? C.green : accent

  return (
    <Page size="A4" style={s.coverPage}>
      {/* Top identity bar */}
      <View style={{
        borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)", borderBottomStyle: "solid",
        paddingHorizontal: MX, paddingVertical: 14,
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      }}>
        <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
          EatoBiotics
        </Text>
        <Text style={{ fontSize: 8, fontFamily: "Helvetica", letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
          {data.theme.label}
        </Text>
      </View>

      {/* Main cover content */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: MX }}>

        {/* Score ring + score number */}
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <View style={{ position: "relative", width: 180, height: 180 }}>
            <ScoreRingLarge score={data.score} accent={resolvedAccent} size={180} />
            {/* Score text centered - positioned absolutely via outer view */}
          </View>
          {/* Score number below ring - overlaid via negative margin */}
          <View style={{
            marginTop: -116, marginBottom: 102,
            alignItems: "center",
          }}>
            <Text style={{ fontFamily: "Times-Bold", fontSize: 52, color: "#ffffff", lineHeight: 1 }}>
              {data.score}
            </Text>
            <Text style={{ fontFamily: "Helvetica", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              / 100
            </Text>
          </View>
        </View>

        {/* Thin divider */}
        <View style={{ width: 48, height: 2, backgroundColor: resolvedAccent, borderRadius: 2, marginBottom: 22 }} />

        {/* Report title */}
        <Text style={{
          fontFamily: "Times-Bold", fontSize: 30,
          color: "#ffffff", textAlign: "center",
          lineHeight: 1.25, marginBottom: 8, maxWidth: 400,
        }}>
          {data.theme.title}
        </Text>

        {/* Profile badge */}
        <View style={{
          borderRadius: 30, paddingHorizontal: 16, paddingVertical: 6,
          backgroundColor: resolvedAccent + "25",
          borderWidth: 1, borderColor: resolvedAccent + "55", borderStyle: "solid",
          marginBottom: 18,
        }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9.5, color: resolvedAccent, letterSpacing: 0.5 }}>
            {data.profile}
          </Text>
        </View>

        {/* Tagline */}
        <Text style={{
          fontFamily: "Helvetica", fontSize: 10.5,
          color: "rgba(255,255,255,0.55)", textAlign: "center",
          lineHeight: 1.6, maxWidth: 360, marginBottom: 36,
        }}>
          {data.tagline}
        </Text>

        {/* Pillar chips */}
        <View style={[s.row, { justifyContent: "center" }]}>
          {data.pillarScores.map((p) => (
            <Chip key={p.name} text={`${p.name.slice(0, 3).toUpperCase()}  ${p.score}`} color={pillarColor(p.name)} />
          ))}
        </View>
      </View>

      {/* Bottom footer */}
      <View style={{
        borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", borderTopStyle: "solid",
        paddingHorizontal: MX, paddingVertical: 14,
        flexDirection: "row", justifyContent: "space-between",
      }}>
        <Text style={{ fontSize: 7.5, color: "rgba(255,255,255,0.2)", fontFamily: "Helvetica" }}>
          eatobiotics.com
        </Text>
        <Text style={{ fontSize: 7.5, color: "rgba(255,255,255,0.2)", fontFamily: "Helvetica" }}>
          Sample Report — {new Date().getFullYear()}
        </Text>
      </View>
    </Page>
  )
}

/* ─── PAGE 2: THREE BIOTICS ───────────────────────────────────────────── */
function BioticsPage({ data }: { data: DemoReportData }) {
  const accent = resolveAccent(data.theme.accent)
  const colW = (CW - 10) / 3

  return (
    <Page size="A4" style={s.page}>
      <Header label={data.theme.label} />

      <SectionLabel text="Your Three Biotics" color={accent} />
      <Text style={[s.h2, { marginBottom: 4 }]}>Prebiotics · Probiotics · Postbiotics</Text>
      <Text style={[s.small, { marginBottom: 18 }]}>{data.scoreInterpretation.slice(0, 180)}…</Text>

      {/* Three pillar cards */}
      <View style={[s.row, { gap: 8 }]}>
        {data.pillarScores.map((p) => {
          const pc = pillarColor(p.name)
          return (
            <View key={p.name} style={[s.card, {
              width: colW, padding: 12,
              borderTopWidth: 4, borderTopColor: pc, borderTopStyle: "solid",
            }]}>
              {/* Ring + score */}
              <View style={{ alignItems: "center", marginBottom: 10 }}>
                <View style={{ position: "relative", width: 52, height: 52 }}>
                  <ScoreRingSmall score={p.score} color={pc} />
                </View>
                <View style={{ marginTop: -38, marginBottom: 34, alignItems: "center" }}>
                  <Text style={{ fontFamily: "Times-Bold", fontSize: 18, color: C.text }}>{p.score}</Text>
                </View>
              </View>
              <Text style={[s.h4, { textAlign: "center", marginBottom: 6 }]}>{p.name}</Text>
              <Text style={[s.tiny, { textAlign: "center", lineHeight: 1.5 }]}>{p.description}</Text>
            </View>
          )
        })}
      </View>

      <View style={s.spacer} />

      {/* Score projection */}
      <View style={[s.accentCard, { borderLeftColor: C.teal }]}>
        <SectionLabel text="Score Projection" color={C.teal} />
        <View style={[s.row, { alignItems: "center", marginBottom: 10 }]}>
          <Text style={{ fontFamily: "Times-Bold", fontSize: 36, color: C.text }}>{data.score}</Text>
          <Text style={{ fontFamily: "Helvetica", fontSize: 16, color: C.muted, marginHorizontal: 10 }}>→</Text>
          <Text style={{ fontFamily: "Times-Bold", fontSize: 36, color: C.green }}>{data.scoreProjection.projected}</Text>
          <View style={{ marginLeft: 14 }}>
            <Text style={[s.h4, { color: C.green }]}>+{data.scoreProjection.projected - data.score} points</Text>
            <Text style={s.small}>in {data.scoreProjection.timeline}</Text>
          </View>
        </View>
        <Text style={[s.small, { marginBottom: 10 }]}>{data.scoreProjection.note}</Text>
        <View style={[s.row, { flexWrap: "wrap" }]}>
          {data.scoreProjection.drivers.map((d) => (
            <View key={d} style={{
              borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
              backgroundColor: C.teal + "18", marginRight: 5, marginBottom: 4,
            }}>
              <Text style={{ fontSize: 7.5, color: C.teal }}>✓  {d}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.spacer} />

      {/* Daily impact */}
      <SectionLabel text="Daily Impact" color={accent} />
      <View style={[s.row, { gap: 8 }]}>
        {data.dailyImpact.map((item) => (
          <View key={item.title} style={[s.cardLight, { flex: 1 }]}>
            <Text style={{ fontSize: 18, marginBottom: 5 }}>{item.icon}</Text>
            <Text style={s.h4}>{item.title}</Text>
            <Text style={s.small}>{item.body}</Text>
          </View>
        ))}
      </View>

      <Footer page={2} />
    </Page>
  )
}

/* ─── PAGE 3: STRENGTHS + OPPORTUNITIES ─────────────────────────────── */
function InsightsPage({ data }: { data: DemoReportData }) {
  const accent = resolveAccent(data.theme.accent)
  const colW = (CW - 12) / 2

  return (
    <Page size="A4" style={s.page}>
      <Header label={data.theme.label} />

      <View style={[s.row, { gap: 12 }]}>
        {/* Strengths */}
        <View style={{ width: colW }}>
          <SectionLabel text="Strengths" color={C.green} />
          {data.strengths.map((item, i) => (
            <View key={i} style={[s.card, { marginBottom: 8, padding: 12, borderTopWidth: 3, borderTopColor: C.green, borderTopStyle: "solid" }]}>
              <Text style={[s.h4, { marginBottom: 5 }]}>{item.title}</Text>
              <Text style={s.small}>{item.explanation}</Text>
            </View>
          ))}
        </View>

        {/* Opportunities */}
        <View style={{ width: colW }}>
          <SectionLabel text="Opportunities" color={C.orange} />
          {data.opportunities.map((item, i) => (
            <View key={i} style={[s.card, { marginBottom: 8, padding: 12, borderTopWidth: 3, borderTopColor: C.orange, borderTopStyle: "solid" }]}>
              <Text style={[s.h4, { marginBottom: 5 }]}>{item.title}</Text>
              <Text style={s.small}>{item.explanation}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.spacer} />

      {/* Pull quote — dark band */}
      <View style={s.darkBand}>
        <Text style={{ fontFamily: "Helvetica", fontSize: 7.5, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
          Key fact
        </Text>
        <Text style={{ fontFamily: "Times-Bold", fontSize: 15, color: "#ffffff", lineHeight: 1.5, marginBottom: 0 }}>
          "{data.pullQuote}"
        </Text>
      </View>

      <View style={s.smallSpacer} />

      {/* Key insight */}
      <SectionLabel text="Key Insight" color={accent} />
      <View style={[s.accentCard, { borderLeftColor: accent }]}>
        <Text style={[s.h3, { marginBottom: 8 }]}>{data.keyInsight.trigger}</Text>
        <Text style={s.body}>{data.keyInsight.explanation}</Text>
      </View>

      <Footer page={3} />
    </Page>
  )
}

/* ─── PAGE 4: DEEP INSIGHT ────────────────────────────────────────────── */
function DeepInsightPage({ data }: { data: DemoReportData }) {
  const accent = resolveAccent(data.theme.accent)

  return (
    <Page size="A4" style={s.page}>
      <Header label={data.theme.label} />

      <SectionLabel text="Deep Insight" color={accent} />
      <Text style={[s.h2, { marginBottom: 14 }]}>The bigger picture</Text>

      {data.deepInsight.split("\n\n").map((para, i) => (
        <Text key={i} style={[s.body, { marginBottom: 13, lineHeight: 1.7 }]}>
          {para.trim()}
        </Text>
      ))}

      <View style={s.spacer} />

      {/* Food pairings callout */}
      {data.foodPairings && data.foodPairings.length > 0 && (
        <>
          <SectionLabel text="Power Pairings" color={C.teal} />
          <View style={[s.row, { gap: 10 }]}>
            {data.foodPairings.map((pair, i) => (
              <View key={i} style={[s.card, { flex: 1, borderTopWidth: 3, borderTopColor: C.teal, borderTopStyle: "solid" }]}>
                <Text style={{ fontSize: 20, marginBottom: 6 }}>{pair.emoji1}  {pair.emoji2}</Text>
                <Text style={[s.h4, { marginBottom: 5 }]}>{pair.food1} + {pair.food2}</Text>
                <Text style={s.small}>{pair.reason}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Footer page={4} />
    </Page>
  )
}

/* ─── PAGE 5: 7-DAY PLAN ──────────────────────────────────────────────── */
function PlanPage({ data }: { data: DemoReportData }) {
  const accent = resolveAccent(data.theme.accent)
  const DAY_COLORS = [C.lime, C.green, C.teal, C.teal, C.yellow, C.orange, C.green]

  return (
    <Page size="A4" style={s.page}>
      <Header label={data.theme.label} />

      <SectionLabel text="Your Starter Plan" color={accent} />
      <Text style={[s.h2, { marginBottom: 4 }]}>7-day action plan</Text>
      <Text style={[s.small, { marginBottom: 18 }]}>
        One targeted action each day — specific, achievable, and chosen for your exact score pattern.
      </Text>

      <View style={{ gap: 6 }}>
        {data.sevenDayPlan.map((item, i) => {
          const dc = DAY_COLORS[i] ?? C.green
          return (
            <View key={item.day} style={[s.row, {
              alignItems: "stretch",
              borderRadius: 8,
              overflow: "hidden",
              borderWidth: 1, borderColor: C.border, borderStyle: "solid",
            }]}>
              {/* Day label panel */}
              <View style={{
                width: 72, backgroundColor: dc + "18",
                borderRightWidth: 1, borderRightColor: dc + "44", borderRightStyle: "solid",
                alignItems: "center", justifyContent: "center", paddingVertical: 12,
              }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, color: dc, letterSpacing: 1, textTransform: "uppercase" }}>
                  {item.day.slice(0, 3)}
                </Text>
                <View style={{ width: 20, height: 2, backgroundColor: dc, borderRadius: 1, marginTop: 4 }} />
              </View>
              {/* Action */}
              <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 11, justifyContent: "center" }}>
                <Text style={[s.body, { lineHeight: 1.5 }]}>{item.action}</Text>
              </View>
            </View>
          )
        })}
      </View>

      <Footer page={5} />
    </Page>
  )
}

/* ─── PAGE 6–7: FOOD PRESCRIPTION ────────────────────────────────────── */
function FoodPage({ data, pageNum }: { data: DemoReportData; pageNum: number }) {
  const accent = resolveAccent(data.theme.accent)
  // 2 foods per page across 2 pages, but 5 foods total (2+2+1)
  const offset = (pageNum - 6) * 2
  const foods = data.foods.slice(offset, offset + 2)
  const isFirstFoodPage = pageNum === 6

  return (
    <Page size="A4" style={s.page}>
      <Header label={data.theme.label} />

      {isFirstFoodPage && (
        <>
          <SectionLabel text="Food Prescription" color={accent} />
          <Text style={[s.h2, { marginBottom: 4 }]}>5 foods chosen specifically for you</Text>
          <Text style={[s.small, { marginBottom: 16 }]}>
            Each food is chosen for a specific biological reason based on your pillar scores — not generic health advice.
          </Text>

          {/* At-a-glance strip */}
          <View style={[s.row, {
            marginBottom: 20, borderRadius: 8,
            borderWidth: 1, borderColor: C.border, borderStyle: "solid", overflow: "hidden",
          }]}>
            {data.foods.map((f, i) => (
              <View key={f.food} style={{
                flex: 1, alignItems: "center", paddingVertical: 10, paddingHorizontal: 6,
                borderRightWidth: i < 4 ? 1 : 0, borderRightColor: C.border, borderRightStyle: "solid",
              }}>
                <Text style={{ fontSize: 20, marginBottom: 4 }}>{f.emoji}</Text>
                <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", textAlign: "center", color: C.text }}>
                  {f.food.split(" ")[0]}
                </Text>
                <Text style={{ fontSize: 6.5, color: C.muted, marginTop: 2 }}>{f.servingsPerWeek}×/wk</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Food cards */}
      {foods.map((food) => {
        const pc = resolveAccent(data.theme.accent)
        return (
          <View key={food.food} style={[s.card, {
            marginBottom: 14, padding: 0, overflow: "hidden",
            borderTopWidth: 4, borderTopColor: pc, borderTopStyle: "solid",
          }]}>
            {/* Top row: emoji + name + meta */}
            <View style={[s.row, {
              padding: 14, paddingBottom: 12,
              borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid",
              alignItems: "flex-start",
            }]}>
              <Text style={{ fontSize: 32, marginRight: 14, marginTop: 2 }}>{food.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.h3}>{food.food}</Text>
                <View style={[s.row, { flexWrap: "wrap", marginTop: 4 }]}>
                  {food.pillars.map((p) => (
                    <Chip key={p} text={p} color={pillarColor(p)} />
                  ))}
                  <View style={{ borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: C.bgLight, marginRight: 5 }}>
                    <Text style={{ fontSize: 7.5, color: C.muted }}>{food.compound}</Text>
                  </View>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 16, color: pc }}>{food.servingsPerWeek}×</Text>
                <Text style={{ fontSize: 7, color: C.muted }}>per week</Text>
              </View>
            </View>

            {/* Why + How */}
            <View style={[s.row]}>
              <View style={{ flex: 1, padding: 12, borderRightWidth: 1, borderRightColor: C.border, borderRightStyle: "solid" }}>
                <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>
                  Why this food
                </Text>
                <Text style={[s.small, { lineHeight: 1.6 }]}>{food.why}</Text>
              </View>
              <View style={{ flex: 1, padding: 12, backgroundColor: accent + "08" }}>
                <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: pc, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>
                  How to eat it
                </Text>
                <Text style={[s.small, { lineHeight: 1.6 }]}>{food.howTo}</Text>
              </View>
            </View>
          </View>
        )
      })}

      <Footer page={pageNum} />
    </Page>
  )
}

/* Remaining food (5th food) on its own partial page, before roadmap */
function FoodPage3({ data }: { data: DemoReportData }) {
  const accent = resolveAccent(data.theme.accent)
  const food = data.foods[4]
  if (!food) return null

  return (
    <Page size="A4" style={s.page}>
      <Header label={data.theme.label} />

      <SectionLabel text="Food Prescription — continued" color={accent} />
      <View style={s.smallSpacer} />

      <View style={[s.card, {
        marginBottom: 14, padding: 0, overflow: "hidden",
        borderTopWidth: 4, borderTopColor: accent, borderTopStyle: "solid",
      }]}>
        <View style={[s.row, { padding: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid", alignItems: "flex-start" }]}>
          <Text style={{ fontSize: 32, marginRight: 14, marginTop: 2 }}>{food.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.h3}>{food.food}</Text>
            <View style={[s.row, { flexWrap: "wrap", marginTop: 4 }]}>
              {food.pillars.map((p) => <Chip key={p} text={p} color={pillarColor(p)} />)}
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 16, color: accent }}>{food.servingsPerWeek}×</Text>
            <Text style={{ fontSize: 7, color: C.muted }}>per week</Text>
          </View>
        </View>
        <View style={s.row}>
          <View style={{ flex: 1, padding: 12, borderRightWidth: 1, borderRightColor: C.border, borderRightStyle: "solid" }}>
            <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>Why this food</Text>
            <Text style={[s.small, { lineHeight: 1.6 }]}>{food.why}</Text>
          </View>
          <View style={{ flex: 1, padding: 12, backgroundColor: accent + "08" }}>
            <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: accent, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>How to eat it</Text>
            <Text style={[s.small, { lineHeight: 1.6 }]}>{food.howTo}</Text>
          </View>
        </View>
      </View>

      <Footer page={8} />
    </Page>
  )
}

/* ─── PAGE 9: 30-DAY ROADMAP ──────────────────────────────────────────── */
function RoadmapPage({ data }: { data: DemoReportData }) {
  const accent = resolveAccent(data.theme.accent)
  const WEEK_COLORS = [C.lime, C.green, C.teal, C.orange]
  const colW = (CW - 10) / 2

  return (
    <Page size="A4" style={s.page}>
      <Header label={data.theme.label} />

      <SectionLabel text="30-Day Roadmap" color={accent} />
      <Text style={[s.h2, { marginBottom: 4 }]}>Your month of change</Text>
      <Text style={[s.small, { marginBottom: 18 }]}>
        Four themed weeks, each building on the last. Every action is specific and achievable.
      </Text>

      {/* 2×2 grid */}
      <View style={[s.row, { gap: 10, marginBottom: 10 }]}>
        {data.roadmap.slice(0, 2).map((week, i) => (
          <WeekCard key={week.week} week={week} color={WEEK_COLORS[i]} index={i} width={colW} />
        ))}
      </View>
      <View style={[s.row, { gap: 10 }]}>
        {data.roadmap.slice(2, 4).map((week, i) => (
          <WeekCard key={week.week} week={week} color={WEEK_COLORS[i + 2]} index={i + 2} width={colW} />
        ))}
      </View>

      <Footer page={9} />
    </Page>
  )
}

function WeekCard({ week, color, index, width }: {
  week: DemoReportData["roadmap"][0]; color: string; index: number; width: number
}) {
  return (
    <View style={[s.card, { width, padding: 0, overflow: "hidden", borderTopWidth: 4, borderTopColor: color, borderTopStyle: "solid" }]}>
      {/* Header */}
      <View style={{ padding: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid", backgroundColor: color + "0c" }}>
        <View style={[s.row, { alignItems: "center", marginBottom: 6 }]}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: color, alignItems: "center", justifyContent: "center", marginRight: 8 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: "#ffffff" }}>{index + 1}</Text>
          </View>
          <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>
            {week.week}
          </Text>
        </View>
        <Text style={{ fontFamily: "Times-Bold", fontSize: 13, color: C.text, marginBottom: 3 }}>{week.theme}</Text>
        <Text style={[s.tiny, { fontFamily: "Helvetica-Oblique", color: C.muted }]}>{week.focus}</Text>
      </View>
      {/* Actions */}
      <View style={{ padding: 12 }}>
        {week.actions.map((action, j) => (
          <CheckItem key={j} text={action} color={color} />
        ))}
      </View>
    </View>
  )
}

/* ─── PAGE 10: FINAL THOUGHTS ─────────────────────────────────────────── */
function FinalPage({ data }: { data: DemoReportData }) {
  const accent = resolveAccent(data.theme.accent)

  return (
    <Page size="A4" style={s.page}>
      <Header label={data.theme.label} />

      <SectionLabel text="Final Thoughts" color={accent} />
      <Text style={[s.h2, { marginBottom: 16 }]}>Your starting point</Text>

      {/* Score summary row */}
      <View style={[s.card, { marginBottom: 16, padding: 16 }]}>
        <View style={[s.row, { alignItems: "center', gap: 20" }]}>
          <View style={{ alignItems: "center", marginRight: 20 }}>
            <Text style={{ fontFamily: "Times-Bold", fontSize: 44, color: accent, lineHeight: 1 }}>{data.score}</Text>
            <Text style={s.tiny}>Your score</Text>
          </View>
          <View style={{ flex: 1 }}>
            {data.pillarScores.map((p) => (
              <PillarBar key={p.name} score={p.score} color={pillarColor(p.name)} label={p.name} compact />
            ))}
          </View>
          <View style={{ alignItems: "center", marginLeft: 20 }}>
            <Text style={{ fontFamily: "Times-Bold", fontSize: 44, color: C.green, lineHeight: 1 }}>{data.scoreProjection.projected}</Text>
            <Text style={s.tiny}>30-day target</Text>
          </View>
        </View>
      </View>

      {/* Closing paragraph */}
      <View style={[s.accentCard, { borderLeftColor: accent, marginBottom: 16 }]}>
        <SectionLabel text="Our assessment" color={accent} />
        <Text style={[s.body, { lineHeight: 1.7 }]}>{data.closing}</Text>
      </View>

      {/* Three commitments */}
      <SectionLabel text="Your three commitments" color={C.muted} />
      <View style={{ gap: 8 }}>
        {[
          { n: "01", label: "Start with one change", color: accent },
          { n: "02", label: "Stay consistent for 30 days", color: C.teal },
          { n: "03", label: "Retest after 30 days", color: C.green },
        ].map((c) => (
          <View key={c.n} style={[s.row, {
            alignItems: "center", padding: 12, borderRadius: 8,
            backgroundColor: c.color + "0c",
            borderWidth: 1, borderColor: c.color + "33", borderStyle: "solid",
          }]}>
            <Text style={{ fontFamily: "Times-Bold", fontSize: 26, color: c.color + "55", marginRight: 14, lineHeight: 1 }}>
              {c.n}
            </Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: C.text }}>{c.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.spacer} />

      {/* Final CTA band */}
      <View style={[s.darkBand, { alignItems: "center" }]}>
        <Text style={{ fontFamily: "Times-Bold", fontSize: 16, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
          This is a sample report.
        </Text>
        <Text style={{ fontFamily: "Helvetica", fontSize: 9.5, color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 14, maxWidth: 340, lineHeight: 1.6 }}>
          Your personalised report is built from your own answers — unique scores, unique insights, unique plan.
        </Text>
        <View style={{ borderRadius: 30, backgroundColor: C.green, paddingHorizontal: 22, paddingVertical: 9 }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: "#ffffff", letterSpacing: 0.5 }}>
            Take the free assessment → eatobiotics.com
          </Text>
        </View>
      </View>

      <Footer page={10} />
    </Page>
  )
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function resolveAccent(raw: string): string {
  const map: Record<string, string> = {
    "var(--icon-green)":  C.green,
    "var(--icon-lime)":   C.lime,
    "var(--icon-teal)":   C.teal,
    "var(--icon-orange)": C.orange,
    "var(--icon-yellow)": C.yellow,
  }
  for (const [k, v] of Object.entries(map)) {
    if (raw.includes(k)) return v
  }
  return C.green
}

/* ─── Main Document ───────────────────────────────────────────────────── */
export function ReportPDF({ data }: { data: DemoReportData }) {
  return (
    <Document
      title={data.theme.title}
      author="EatoBiotics"
      subject="Gut Health Sample Report"
      creator="EatoBiotics"
    >
      <CoverPage data={data} />
      <BioticsPage data={data} />
      <InsightsPage data={data} />
      <DeepInsightPage data={data} />
      <PlanPage data={data} />
      <FoodPage data={data} pageNum={6} />
      <FoodPage data={data} pageNum={7} />
      {data.foods[4] && <FoodPage3 data={data} />}
      <RoadmapPage data={data} />
      <FinalPage data={data} />
    </Document>
  )
}
