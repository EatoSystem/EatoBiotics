// No "use client" — server-side only (used in API route via renderToBuffer)
import {
  Document, Page, View, Text, Svg, Defs,
  LinearGradient, Stop, Rect, Circle, Path, Line,
  StyleSheet,
} from "@react-pdf/renderer"
import type { DemoReportData } from "./demo-report"

/* ─── Brand Palette ─────────────────────────────────────────── */
const C = {
  dark:        "#1A2E12",
  muted:       "#5A6E50",
  bg:          "#FFFFFF",
  border:      "#E5E5E5",
  lime:        "#A8E063",
  green:       "#4CB648",
  teal:        "#2DAA6E",
  yellow:      "#F5C518",
  orange:      "#F5A623",
  tintedGreen: "#F7F8F2",
  tintedWarm:  "#FBF7EE",
  soft:        "#FAFAF7",
  darkAlpha12: "rgba(26,46,18,0.12)",
  darkAlpha06: "rgba(26,46,18,0.06)",
}

/* ─── Geometry ──────────────────────────────────────────────── */
const PW = 595  // A4 pt width
const MX = 57   // left/right margin
const CW = PW - MX * 2   // 481pt content width
const C2 = (CW - 12) / 2 // ~234.5 two-col width
const C3 = (CW - 16) / 3 // ~155  three-col width
const C7 = (CW - 36) / 7 // ~63.6 seven-col width

/* ─── Helpers ───────────────────────────────────────────────── */
function resolveAccent(raw: string): string {
  if (raw.includes("teal"))   return C.teal
  if (raw.includes("lime"))   return C.lime
  if (raw.includes("yellow")) return C.yellow
  if (raw.includes("orange")) return C.orange
  return C.green
}

function pillarType(name: string): "pre" | "pro" | "pos" {
  if (name === "Prebiotics")  return "pre"
  if (name === "Probiotics")  return "pro"
  return "pos"
}
const PILLAR_COLOR = { pre: C.lime, pro: C.teal, pos: C.orange }
const PRE_GRAD = [C.lime, C.green]
const PRO_GRAD = [C.green, C.teal]
const POS_GRAD = [C.yellow, C.orange]
function pillarGrad(t: "pre"|"pro"|"pos") {
  return t === "pre" ? PRE_GRAD : t === "pro" ? PRO_GRAD : POS_GRAD
}

/* ─── StyleSheet ─────────────────────────────────────────────── */
const s = StyleSheet.create({
  // Pages
  page:      { backgroundColor: C.bg, paddingHorizontal: MX, paddingTop: 58, paddingBottom: 40, fontFamily: "Helvetica", fontSize: 10, color: C.dark },
  darkPage:  { backgroundColor: C.dark, paddingHorizontal: MX, paddingTop: 58, paddingBottom: 40, fontFamily: "Helvetica", fontSize: 10, color: "#FFFFFF" },
  greenPage: { backgroundColor: C.tintedGreen, paddingHorizontal: MX, paddingTop: 58, paddingBottom: 40, fontFamily: "Helvetica", fontSize: 10, color: C.dark },
  warmPage:  { backgroundColor: C.tintedWarm, paddingHorizontal: MX, paddingTop: 58, paddingBottom: 40, fontFamily: "Helvetica", fontSize: 10, color: C.dark },
  // Headers / footers
  pageHeader: { position: "absolute", top: 28, left: MX, right: MX, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pageFooter: { position: "absolute", bottom: 24, left: MX, right: MX, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: C.green },
  headerText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", letterSpacing: 1.4, textTransform: "uppercase", color: C.muted },
  footerText: { fontSize: 7.5, fontFamily: "Helvetica", color: C.muted, letterSpacing: 0.5 },
  // Typography
  eyebrow:    { fontSize: 8.5, fontFamily: "Helvetica-Bold", letterSpacing: 2, textTransform: "uppercase", color: C.green, marginBottom: 6 },
  eyebrowMuted:{ fontSize: 8.5, fontFamily: "Helvetica-Bold", letterSpacing: 2, textTransform: "uppercase", color: C.muted },
  display:    { fontFamily: "Times-Bold", fontSize: 44, lineHeight: 1.05, letterSpacing: -1, color: C.dark, margin: 0 },
  h1:         { fontFamily: "Times-Bold", fontSize: 32, lineHeight: 1.1, color: C.dark, margin: 0 },
  h2:         { fontFamily: "Times-Bold", fontSize: 24, lineHeight: 1.1, color: C.dark, margin: 0 },
  h3:         { fontFamily: "Times-Bold", fontSize: 18, lineHeight: 1.15, color: C.dark, margin: 0 },
  h4:         { fontFamily: "Times-Bold", fontSize: 14, lineHeight: 1.2, color: C.dark, margin: 0 },
  h5:         { fontFamily: "Helvetica-Bold", fontSize: 12, lineHeight: 1.2, color: C.dark, margin: 0 },
  lead:       { fontFamily: "Helvetica", fontSize: 12, lineHeight: 1.55, color: C.muted, margin: 0 },
  body:       { fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.6, color: C.dark, margin: 0 },
  bodySm:     { fontFamily: "Helvetica", fontSize: 9, lineHeight: 1.55, color: C.muted, margin: 0 },
  mono:       { fontFamily: "Courier", fontSize: 9, color: C.dark },
  // Layout
  row:        { flexDirection: "row" },
  spacer:     { height: 14 },
  smSpacer:   { height: 8 },
  divider:    { height: 1, backgroundColor: C.border, marginVertical: 12 },
  // Cards
  card: { borderWidth: 1, borderColor: C.border, borderStyle: "solid", borderRadius: 10, backgroundColor: C.bg, padding: 14 },
  cardSoft: { borderWidth: 1, borderColor: C.darkAlpha06, borderStyle: "solid", borderRadius: 10, backgroundColor: C.soft, padding: 14 },
  cardDark: { borderRadius: 10, backgroundColor: C.dark, padding: 16 },
})

/* ─── SVG Primitives ─────────────────────────────────────────── */
function GradBar({ h = 4, w = PW }: { h?: number; w?: number }) {
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <LinearGradient id="bH" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%"   stopColor={C.lime}/>
          <Stop offset="25%"  stopColor={C.green}/>
          <Stop offset="50%"  stopColor={C.teal}/>
          <Stop offset="75%"  stopColor={C.yellow}/>
          <Stop offset="100%" stopColor={C.orange}/>
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={w} height={h} fill="url(#bH)"/>
    </Svg>
  )
}

function ScoreRingSvg({ score, size = 220, dark = false }: { score: number; size?: number; dark?: boolean }) {
  const cx = size / 2
  const r  = size * 0.418   // ≈92 when size=220
  const circ = 2 * Math.PI * r
  const fill = circ * score / 100
  const trackColor = dark ? "rgba(255,255,255,0.1)" : C.darkAlpha06
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="rG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%"   stopColor={C.lime}/>
          <Stop offset="40%"  stopColor={C.teal}/>
          <Stop offset="100%" stopColor={C.orange}/>
        </LinearGradient>
      </Defs>
      <Circle cx={cx} cy={cx} r={r} fill="none" stroke={trackColor} strokeWidth={size === 220 ? 12 : 8}/>
      <Circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke="url(#rG)" strokeWidth={size === 220 ? 14 : 9}
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
    </Svg>
  )
}

/* ─── Shared Page Parts ──────────────────────────────────────── */
function PageHeader({ section, title, dark = false }: { section: string; title: string; dark?: boolean }) {
  const col = dark ? "rgba(255,255,255,0.5)" : C.muted
  const dotBg = dark ? "rgba(255,255,255,0.3)" : C.green
  return (
    <View style={s.pageHeader}>
      <View style={s.headerLeft}>
        <View style={[s.headerDot, { backgroundColor: dotBg }]}/>
        <Text style={[s.headerText, { color: col }]}>{section}</Text>
      </View>
      <Text style={[s.headerText, { color: col }]}>{title}</Text>
    </View>
  )
}

function PageFooter({ section, num, dark = false }: { section: string; num: number; dark?: boolean }) {
  const col = dark ? "rgba(255,255,255,0.4)" : C.muted
  return (
    <View style={s.pageFooter}>
      <Text style={[s.footerText, { color: col }]}>{section}</Text>
      <Text style={[s.footerText, { color: col, fontFamily: "Courier", fontSize: 9 }]}>
        {String(num).padStart(2, "0")}
      </Text>
    </View>
  )
}

function PillarBar({ label, score, type }: { label: string; score: number; type: "pre"|"pro"|"pos" }) {
  const color = PILLAR_COLOR[type]
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 9 }}>
      <Text style={{ width: 80, fontSize: 10, fontFamily: "Helvetica-Bold", color: C.dark }}>{label}</Text>
      <View style={{ flex: 1, height: 7, backgroundColor: C.darkAlpha06, borderRadius: 4, flexDirection: "row" }}>
        <View style={{ flex: score, backgroundColor: color, borderRadius: 4 }}/>
        <View style={{ flex: 100 - score }}/>
      </View>
      <Text style={{ width: 32, textAlign: "right", fontFamily: "Courier", fontSize: 11, fontWeight: 700, color: C.dark }}>{score}</Text>
    </View>
  )
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <View style={{ borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: bg, borderWidth: 1, borderColor: color, borderStyle: "solid" }}>
      <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color, letterSpacing: 1 }}>{text}</Text>
    </View>
  )
}

function Eyebrow({ text, color = C.green, mb = 6 }: { text: string; color?: string; mb?: number }) {
  return <Text style={[s.eyebrow, { color, marginBottom: mb }]}>{text}</Text>
}

// SVG text wrapper — react-pdf SVG Text types are incomplete (fontSize/fill missing in typedefs)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ST(props: Record<string, any>) { return <Text {...(props as any)} /> }

/* ═══════════════════════════════════════════════════
   PAGE 01 — COVER (dark)
═══════════════════════════════════════════════════ */
function CoverPage({ data }: { data: DemoReportData }) {
  const pre = data.pillarScores.find(p => p.name === "Prebiotics")?.score ?? 72
  const pro = data.pillarScores.find(p => p.name === "Probiotics")?.score ?? 45
  const pos = data.pillarScores.find(p => p.name === "Postbiotics")?.score ?? 78

  return (
    <Page size="A4" style={{ backgroundColor: C.dark, fontFamily: "Helvetica", fontSize: 10, color: "#fff" }}>
      {/* Top gradient bar */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <GradBar h={5} w={PW}/>
      </View>

      {/* Identity bar */}
      <View style={{
        position: "absolute", top: 12, left: MX, right: MX,
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)", borderBottomStyle: "solid",
        paddingBottom: 10,
      }}>
        <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
          EatoBiotics
        </Text>
        <Text style={{ fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
          {data.theme.label}
        </Text>
      </View>

      {/* Main content — centered */}
      <View style={{ flex: 1, paddingHorizontal: MX, paddingTop: 50, paddingBottom: 40, justifyContent: "center", alignItems: "center" }}>

        {/* Score ring */}
        <View style={{ alignItems: "center", marginBottom: 0 }}>
          <ScoreRingSvg score={data.score} size={200} dark/>
          {/* Score overlay */}
          <View style={{ position: "absolute", top: 0, left: 0, width: 200, height: 200, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: "Times-Bold", fontSize: 58, color: "#fff", lineHeight: 1, letterSpacing: -2 }}>{data.score}</Text>
            <Text style={{ fontFamily: "Helvetica", fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>/100</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5, color: C.green, letterSpacing: 2, textTransform: "uppercase", marginTop: 5 }}>
              GUT SCORE
            </Text>
          </View>
        </View>

        <View style={{ height: 20 }}/>

        {/* Divider pill */}
        <View style={{ marginBottom: 16 }}>
          <GradBar h={3} w={56}/>
        </View>

        {/* Title */}
        <Text style={{ fontFamily: "Times-Bold", fontSize: 28, color: "#fff", textAlign: "center", lineHeight: 1.2, marginBottom: 10, maxWidth: 380 }}>
          {data.theme.title}
        </Text>

        {/* Profile badge */}
        <View style={{
          borderRadius: 99, paddingHorizontal: 16, paddingVertical: 6,
          backgroundColor: "rgba(76,182,72,0.18)",
          borderWidth: 1, borderColor: "rgba(76,182,72,0.4)", borderStyle: "solid",
          marginBottom: 12,
        }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: C.green, letterSpacing: 1 }}>{data.profile}</Text>
        </View>

        {/* Tagline */}
        <Text style={{ fontFamily: "Helvetica", fontSize: 10.5, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.55, maxWidth: 340, marginBottom: 28 }}>
          {data.tagline}
        </Text>

        {/* Pillar bars */}
        <View style={{ width: 340 }}>
          <PillarBar label="Prebiotics"  score={pre} type="pre"/>
          <PillarBar label="Probiotics"  score={pro} type="pro"/>
          <PillarBar label="Postbiotics" score={pos} type="pos"/>
        </View>
      </View>

      {/* Bottom identity strip */}
      <View style={{
        borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", borderTopStyle: "solid",
        paddingHorizontal: MX, paddingVertical: 14,
        flexDirection: "row",
      }}>
        {[
          { label: "Prepared for", value: (data as any).name ?? "You" },
          { label: "Report date",  value: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }) },
          { label: "Assessment",   value: data.theme.label },
          { label: "Profile",      value: data.profile },
        ].map((item, i) => (
          <View key={i} style={{ flex: 1, borderRightWidth: i < 3 ? 1 : 0, borderRightColor: "rgba(255,255,255,0.1)", borderRightStyle: "solid", paddingRight: 14, paddingLeft: i > 0 ? 14 : 0 }}>
            <Text style={{ fontSize: 7.5, color: "rgba(255,255,255,0.35)", marginBottom: 3, letterSpacing: 1, textTransform: "uppercase", fontFamily: "Helvetica-Bold" }}>{item.label}</Text>
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", fontFamily: "Helvetica-Bold" }}>{item.value}</Text>
          </View>
        ))}
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 02 — CONTENTS
═══════════════════════════════════════════════════ */
function ContentsPage({ data }: { data: DemoReportData }) {
  const SECTIONS = [
    { num: "01", title: "Where you are",    pages: "03–05", desc: "Your gut profile, three biotics breakdown, and what your score means for your biology." },
    { num: "02", title: "Why it matters",   pages: "06–11", desc: "Daily life impact, symptom map, 30-day projection, and your key insight." },
    { num: "03", title: "What to do",       pages: "12–17", desc: "Change timeline, 7-day plan, 30-day roadmap, food prescription, and shopping list." },
  ]
  return (
    <Page size="A4" style={s.page}>
      {/* Top bar */}
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Contents" title="Your report" />
      <PageFooter section="Introduction" num={2}/>

      <Eyebrow text="Inside this report"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>Your Gut Intelligence Report.</Text>
      <Text style={[s.lead, { marginBottom: 28, maxWidth: 380 }]}>
        18 pages of personalised analysis, science-backed insights, and a clear plan built around your exact scores.
      </Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        {SECTIONS.map((sec) => (
          <View key={sec.num} style={[s.card, { flex: 1, padding: 0, overflow: "hidden" }]}>
            <View style={{ height: 5 }}>
              <GradBar h={5} w={C3}/>
            </View>
            <View style={{ padding: 14 }}>
              <Text style={{ fontFamily: "Courier", fontSize: 22, color: C.green, lineHeight: 1, marginBottom: 4 }}>{sec.num}</Text>
              <Text style={[s.h4, { marginBottom: 6 }]}>{sec.title}</Text>
              <Text style={[s.bodySm, { color: C.dark, lineHeight: 1.5, marginBottom: 10 }]}>{sec.desc}</Text>
              <Text style={[s.eyebrowMuted, { fontSize: 7.5 }]}>Pages {sec.pages}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={s.spacer}/>

      {/* Score summary */}
      <View style={[s.cardDark, { flexDirection: "row", alignItems: "center", gap: 20 }]}>
        <View>
          <Text style={{ fontFamily: "Times-Bold", fontSize: 52, color: "#fff", lineHeight: 1, letterSpacing: -2 }}>{data.score}</Text>
          <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.green, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>YOUR SCORE</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, color: C.green, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{data.profile}</Text>
          <Text style={{ fontFamily: "Helvetica", fontSize: 10.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.55 }}>
            {data.scoreInterpretation.slice(0, 200)}
          </Text>
        </View>
        <View style={{ width: 120, gap: 6 }}>
          {data.pillarScores.map(p => {
            const t = pillarType(p.name)
            return (
              <View key={p.name} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ width: 26, fontFamily: "Courier", fontSize: 13, fontWeight: 700, color: PILLAR_COLOR[t] }}>{p.score}</Text>
                <View style={{ flex: 1, height: 5, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, flexDirection: "row" }}>
                  <View style={{ flex: p.score, backgroundColor: PILLAR_COLOR[t], borderRadius: 3 }}/>
                  <View style={{ flex: 100 - p.score }}/>
                </View>
              </View>
            )
          })}
        </View>
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 03 — GUT PROFILE
═══════════════════════════════════════════════════ */
function GutProfilePage({ data }: { data: DemoReportData }) {
  const TIERS = [
    { range: "80–100", label: "Gut Optimised",    color: C.green },
    { range: "70–79",  label: "Strong Foundation", color: C.teal },
    { range: "60–69",  label: "Emerging Balance",  color: C.lime },
    { range: "50–59",  label: "Building",          color: C.yellow },
    { range: "0–49",   label: "Starting Out",      color: C.orange },
  ]
  const currentTier = TIERS.find(t => {
    const [lo] = t.range.split("–").map(Number)
    return data.score >= lo
  }) ?? TIERS[4]
  const nextTier = TIERS[TIERS.findIndex(t => t.label === currentTier.label) - 1]

  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 01 · Where you are" title="Gut profile"/>
      <PageFooter section="Section 01 · Where you are" num={3}/>

      <Eyebrow text="Gut profile"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>Where you stand.</Text>
      <Text style={[s.lead, { marginBottom: 22, maxWidth: 400 }]}>Your score of {data.score} places you in the <Text style={{ fontFamily: "Helvetica-Bold", color: C.dark }}>{currentTier.label}</Text> tier.</Text>

      {/* Tier ladder + description */}
      <View style={{ flexDirection: "row", gap: 14 }}>
        <View style={{ width: 220 }}>
          {TIERS.map((t) => {
            const isActive = t.label === currentTier.label
            return (
              <View key={t.label} style={{
                flexDirection: "row", alignItems: "center", gap: 10,
                padding: 10, borderRadius: 8, marginBottom: 6,
                backgroundColor: isActive ? t.color + "18" : "transparent",
                borderWidth: isActive ? 1 : 1,
                borderColor: isActive ? t.color : C.border,
                borderStyle: "solid",
              }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.color }}/>
                <Text style={{ flex: 1, fontFamily: "Helvetica-Bold", fontSize: 10, color: isActive ? C.dark : C.muted }}>{t.label}</Text>
                <Text style={{ fontFamily: "Courier", fontSize: 8, color: isActive ? t.color : C.muted }}>{t.range}</Text>
              </View>
            )
          })}
        </View>

        <View style={{ flex: 1 }}>
          {/* Working well */}
          <View style={[s.card, { marginBottom: 10, borderLeftWidth: 3, borderLeftColor: C.lime, borderLeftStyle: "solid", padding: 12 }]}>
            <Eyebrow text="Working well" color={C.green} mb={4}/>
            {data.strengths.slice(0, 2).map((item, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                <Text style={{ color: C.green, fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 1 }}>✓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: C.dark, marginBottom: 2 }}>{item.title}</Text>
                  <Text style={[s.bodySm, { color: C.dark, fontSize: 8.5 }]}>{item.explanation.slice(0, 100)}</Text>
                </View>
              </View>
            ))}
          </View>
          {/* Gaps */}
          <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: C.orange, borderLeftStyle: "solid", padding: 12 }]}>
            <Eyebrow text="Key gaps" color={C.orange} mb={4}/>
            {data.opportunities.slice(0, 2).map((item, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                <Text style={{ color: C.orange, fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 1 }}>→</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: C.dark, marginBottom: 2 }}>{item.title}</Text>
                  <Text style={[s.bodySm, { color: C.dark, fontSize: 8.5 }]}>{item.explanation.slice(0, 100)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={s.spacer}/>

      {/* Next level card */}
      {nextTier && (
        <View style={[s.cardSoft, { flexDirection: "row", alignItems: "center", gap: 16 }]}>
          <View>
            <Text style={{ fontFamily: "Times-Bold", fontSize: 36, color: nextTier.color, lineHeight: 1 }}>→</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow text="Your next level" color={nextTier.color} mb={4}/>
            <Text style={[s.h4, { marginBottom: 5 }]}>{nextTier.label} · {nextTier.range}</Text>
            <Text style={[s.body, { fontSize: 9.5 }]}>
              {data.scoreProjection.projected - data.score} points separates you from the next tier. Your 30-day plan is built precisely to close this gap.
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontFamily: "Times-Bold", fontSize: 40, color: nextTier.color, lineHeight: 1 }}>+{data.scoreProjection.projected - data.score}</Text>
            <Text style={{ fontSize: 7.5, color: C.muted, textAlign: "center" }}>projected{"\n"}gain</Text>
          </View>
        </View>
      )}
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 04 — THREE BIOTICS
═══════════════════════════════════════════════════ */
function ThreeBioticsPage({ data }: { data: DemoReportData }) {
  const DESCRIPTIONS: Record<string, { eyebrow: string; badge: string; role: string }> = {
    Prebiotics:  { eyebrow: "Prebiotic · Feed",    badge: "Strong",   role: "Feeds the bacteria" },
    Probiotics:  { eyebrow: "Probiotic · Add",     badge: "Your gap", role: "Adds diversity" },
    Postbiotics: { eyebrow: "Postbiotic · Produce", badge: "Strong",   role: "Produces compounds" },
  }
  const CARD_GRADS: [string, string][] = [[C.lime, C.green], [C.green, C.teal], [C.yellow, C.orange]]

  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 01 · Where you are" title="Your three biotics"/>
      <PageFooter section="Section 01 · Where you are" num={4}/>

      <Eyebrow text="Your three biotics"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>Prebiotics · Probiotics · Postbiotics.</Text>
      <Text style={[s.lead, { marginBottom: 22, maxWidth: 400 }]}>Three interconnected systems that determine the health of your gut microbiome.</Text>

      {/* Three cards */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {data.pillarScores.map((p, i) => {
          const t = pillarType(p.name)
          const meta = DESCRIPTIONS[p.name] ?? { eyebrow: p.name, badge: "", role: "" }
          const [c1] = CARD_GRADS[i]
          return (
            <View key={p.name} style={{ flex: 1, borderRadius: 10, borderWidth: 1, borderColor: C.border, borderStyle: "solid", backgroundColor: C.bg, overflow: "hidden" }}>
              {/* Gradient top bar */}
              <View style={{ height: 6 }}>
                <GradBar h={6} w={C3}/>
              </View>
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: c1, letterSpacing: 1.5, textTransform: "uppercase" }}>{meta.eyebrow}</Text>
                  <Badge text={meta.badge} color={c1} bg={c1 + "18"}/>
                </View>
                {/* Big score */}
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                  <Text style={{ fontFamily: "Times-Bold", fontSize: 48, lineHeight: 1, letterSpacing: -2, color: C.dark }}>{p.score}</Text>
                  <Text style={{ fontFamily: "Courier", fontSize: 9, color: C.muted }}>/100</Text>
                </View>
                <Text style={[s.bodySm, { color: C.dark, lineHeight: 1.55, marginBottom: 10 }]}>{p.description}</Text>
                <View style={s.divider}/>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={s.bodySm}>Role</Text>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: C.dark }}>{meta.role}</Text>
                </View>
              </View>
            </View>
          )
        })}
      </View>

      <View style={s.spacer}/>

      {/* Explainer band */}
      <View style={[s.cardSoft, { flexDirection: "row", gap: 20, alignItems: "center" }]}>
        <View style={{ flex: 1 }}>
          <Eyebrow text="How they fit together" mb={4}/>
          <Text style={s.h4}>Feed. Add. Produce.</Text>
        </View>
        <View style={{ flex: 2 }}>
          <Text style={[s.body, { fontSize: 9.5 }]}>
            Prebiotics feed the bacteria already living in your gut. Probiotics add new strains. Postbiotics are the beneficial compounds — short-chain fatty acids, vitamins, peptides — those bacteria then produce. A balanced system needs all three.
          </Text>
        </View>
      </View>

      <View style={s.smSpacer}/>

      {/* Pattern line */}
      <View>
        <Eyebrow text="Your pattern in one line" mb={4}/>
        <Text style={[s.h3, { maxWidth: 400 }]}>{data.keyInsight.trigger}</Text>
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 05 — WHAT YOUR SCORE MEANS
═══════════════════════════════════════════════════ */
function ScoreMeaningPage({ data }: { data: DemoReportData }) {
  const pre = data.pillarScores.find(p => p.name === "Prebiotics")?.score ?? 72
  const pro = data.pillarScores.find(p => p.name === "Probiotics")?.score ?? 45
  const pos = data.pillarScores.find(p => p.name === "Postbiotics")?.score ?? 78
  const colL = Math.floor(CW * 0.6)
  const colR = CW - colL - 12

  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 01 · Where you are" title="Your pattern"/>
      <PageFooter section="Section 01 · Where you are" num={5}/>

      <Eyebrow text="Your pattern"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>What your score means.</Text>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
        {/* Left column — text */}
        <View style={{ width: colL }}>
          <Text style={[s.body, { lineHeight: 1.7, marginBottom: 12 }]}>
            A score of <Text style={{ fontFamily: "Helvetica-Bold" }}>{data.score}</Text> reflects a gut system that functions reasonably well day-to-day but is operating below its potential. Your plant variety <Text style={{ fontFamily: "Courier" }}>(Pre {pre})</Text> and recovery rhythm <Text style={{ fontFamily: "Courier" }}>(Pos {pos})</Text> are strong, but your intake of fermented and probiotic-rich foods is noticeably low <Text style={{ fontFamily: "Courier" }}>(Pro {pro})</Text>.
          </Text>
          <Text style={[s.body, { lineHeight: 1.7, marginBottom: 12 }]}>
            This creates a <Text style={{ fontFamily: "Helvetica-Bold" }}>one-sided system</Text> — you're feeding the microbiome but not actively seeding it with the bacterial diversity it needs to thrive. Probiotics is the most responsive pillar to targeted dietary change. Small, consistent additions can produce measurable shifts within <Text style={{ fontFamily: "Helvetica-Bold" }}>2–4 weeks</Text>.
          </Text>
          {/* Garden analogy */}
          <View style={[s.cardSoft, { borderLeftWidth: 3, borderLeftColor: C.green, borderLeftStyle: "solid" }]}>
            <Eyebrow text="The garden analogy" mb={4}/>
            <Text style={[s.body, { fontSize: 9.5 }]}>
              Think of your gut like a garden: you're watering regularly and the soil is in good condition (Prebiotics + Postbiotics), but you haven't been planting seeds (Probiotics). The structure is there — the flora just needs to be populated.
            </Text>
          </View>
        </View>

        {/* Right column — system diagram */}
        <View style={{ width: colR }}>
          <Text style={s.eyebrowMuted}>Your system</Text>
          <View style={[s.card, { padding: 14, marginTop: 8 }]}>
            {[
              { score: pre, label: "Prebiotics",  sub: "Feeds the bacteria",  c1: C.lime, c2: C.green },
              { score: pro, label: "Probiotics",  sub: "Your gap",            c1: C.green, c2: C.teal, isGap: true },
              { score: pos, label: "Postbiotics", sub: "Produces compounds",  c1: C.yellow, c2: C.orange },
            ].map((item, i) => (
              <View key={item.label}>
                {i > 0 && (
                  <View style={{ alignItems: "center", marginVertical: 6 }}>
                    <Text style={{ color: C.muted, fontSize: 12 }}>↓</Text>
                  </View>
                )}
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 10,
                  padding: 10, borderRadius: 8,
                  backgroundColor: item.c1 + "18",
                  borderWidth: item.isGap ? 2 : 1,
                  borderColor: item.isGap ? C.teal : C.border,
                  borderStyle: "solid",
                }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 8,
                    backgroundColor: item.c1,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ fontFamily: "Times-Bold", fontSize: 20, color: "#fff" }}>{item.score}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: C.dark }}>{item.label}</Text>
                    <Text style={{ fontSize: 8.5, color: item.isGap ? C.orange : C.muted }}>{item.sub}</Text>
                  </View>
                </View>
              </View>
            ))}
            <View style={s.divider}/>
            <Text style={s.bodySm}>A bottleneck at any one pillar limits the output of all three.</Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: "auto" }}/>

      {/* Dark callout */}
      <View style={[s.cardDark, { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 14 }]}>
        <Text style={{ fontFamily: "Times-Bold", fontSize: 52, color: C.green, lineHeight: 1, letterSpacing: -2 }}>2–4</Text>
        <View style={{ flex: 1 }}>
          <Eyebrow text="Weeks to a measurable shift" color="rgba(255,255,255,0.5)" mb={4}/>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 13, color: "#fff", lineHeight: 1.35 }}>
            Probiotics is the most responsive pillar to targeted change — the fastest dial to move on your whole food system.
          </Text>
        </View>
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 06 — DAILY LIFE
═══════════════════════════════════════════════════ */
function DailyLifePage({ data }: { data: DemoReportData }) {
  const pro = data.pillarScores.find(p => p.name === "Probiotics")?.score ?? 45
  const CARDS = [
    { title: "Energy levels.", icon: "⚡", color: C.yellow, bg: C.yellow + "18",
      body: `Your mid-afternoon energy dip is directly linked to your Probiotics gap (${pro}). A low-diversity microbiome produces less butyrate — the short-chain fatty acid that stabilises blood sugar between meals.`,
      badges: ["Pro " + pro, "Pre " + (data.pillarScores.find(p=>p.name==="Prebiotics")?.score ?? 72)] },
    { title: "Digestive comfort.", icon: "💚", color: C.teal, bg: C.teal + "18",
      body: "Occasional bloating or sluggish digestion after meals is a common signal of an under-seeded gut. Adding fermented foods reduces this noticeably within 2–3 weeks for most people.",
      badges: ["Pro " + pro] },
    { title: "Sleep quality.", icon: "🌙", color: C.green, bg: C.green + "18",
      body: "Your gut produces 90% of your body's serotonin — the precursor to melatonin. A stronger Probiotics score means better serotonin production, better melatonin, and deeper sleep.",
      badges: ["Pro " + pro] },
  ]

  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 02 · Why it matters" title="Daily life"/>
      <PageFooter section="Section 02 · Why it matters" num={6}/>

      <Eyebrow text="Daily life"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>What this means for you, every day.</Text>
      <Text style={[s.lead, { marginBottom: 22, maxWidth: 440 }]}>Your scores translate directly into how you feel, function, and recover — day to day.</Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        {CARDS.map((card) => (
          <View key={card.title} style={[s.card, { flex: 1, padding: 16 }]}>
            <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: card.bg, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 18 }}>{card.icon}</Text>
            </View>
            <Text style={[s.h4, { marginBottom: 8 }]}>{card.title}</Text>
            <Text style={[s.bodySm, { color: C.dark, lineHeight: 1.55, marginBottom: 12 }]}>{card.body}</Text>
            <View style={s.divider}/>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {card.badges.map(b => (
                <Badge key={b} text={b} color={card.color} bg={card.bg}/>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={s.spacer}/>

      {/* Big stat */}
      <View style={[s.card, { padding: 0 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 18, gap: 24 }}>
          <View>
            <Text style={{ fontFamily: "Times-Bold", fontSize: 72, lineHeight: 1, letterSpacing: -3, color: C.green }}>90%</Text>
            <Eyebrow text="Of your serotonin made in your gut" mb={0}/>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.h3, { marginBottom: 8, fontSize: 17 }]}>Your gut writes more of your mood than your brain does.</Text>
            <Text style={[s.bodySm, { color: C.dark, lineHeight: 1.6 }]}>
              The bacteria in your gut synthesise the neurotransmitters that regulate mood, sleep, and mental clarity. Your Probiotics score is the single strongest dietary lever for this production.
            </Text>
          </View>
        </View>
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 07 — SYMPTOM MAP
═══════════════════════════════════════════════════ */
function SymptomMapPage({ data }: { data: DemoReportData }) {
  const pre = data.pillarScores.find(p => p.name === "Prebiotics")?.score ?? 72
  const pro = data.pillarScores.find(p => p.name === "Probiotics")?.score ?? 45
  const pos = data.pillarScores.find(p => p.name === "Postbiotics")?.score ?? 78

  const SYMPTOMS = [
    { name: "Brain fog & poor focus",  border: C.teal,   badge: "Likely affecting you", likely: true,
      body: "Low microbial diversity reduces butyrate production, which crosses the blood-brain barrier and impairs cognitive clarity.", via: [`Pro ${pro}`, `Pos ${pos}`] },
    { name: "Afternoon energy crash",  border: C.yellow, badge: "Likely affecting you", likely: true,
      body: "An under-seeded gut destabilises blood sugar between meals. Less butyrate means less stable energy — the 3pm dip is a gut signal.", via: [`Pro ${pro}`, `Pre ${pre}`] },
    { name: "Poor sleep quality",      border: C.teal,   badge: "Likely affecting you", likely: true,
      body: "90% of serotonin is produced in the gut. Low Probiotics directly reduces sleep onset speed and deep-sleep duration.", via: [`Pro ${pro}`] },
    { name: "Mood instability",        border: C.teal,   badge: "Likely affecting you", likely: true,
      body: "The vagus nerve carries gut signals to the brain. A disrupted microbiome generates inflammatory signals that destabilise mood baseline.", via: [`Pro ${pro}`, `Pos ${pos}`] },
    { name: "Frequent illness",        border: C.teal,   badge: "Likely affecting you", likely: true,
      body: "70% of immune cells reside in the gut lining. Low probiotic intake weakens the mucosal barrier that keeps pathogens out.", via: [`Pre ${pre}`, `Pro ${pro}`] },
    { name: "Sugar & junk cravings",   border: C.teal,   badge: "Likely affecting you", likely: true,
      body: "Opportunistic bacteria that thrive on sugar send signals via the vagus nerve, creating cravings for ultra-processed foods.", via: [`Pre ${pre}`, `Pro ${pro}`] },
    { name: "Bloating after meals",    border: C.border, badge: "Low risk", likely: false,
      body: "Insufficient fibre variety creates imbalanced fermentation. Your Prebiotics score suggests this is unlikely.", via: [`Pre ${pre}`] },
    { name: "Slow recovery",           border: C.border, badge: "Low risk", likely: false,
      body: "Short-chain fatty acids reduce systemic inflammation. Your Postbiotics score suggests this system is intact.", via: [`Pos ${pos}`] },
  ]
  const colW = (CW - 10) / 2

  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 02 · Why it matters" title="Symptom map"/>
      <PageFooter section="Section 02 · Why it matters" num={7}/>

      <Eyebrow text="Symptom map"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>How your scores connect to how you feel.</Text>
      <Text style={[s.lead, { marginBottom: 16, maxWidth: 440 }]}>Each symptom is directly linked to one or more of your pillar scores.</Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ width: colW }}>
          {SYMPTOMS.slice(0, 4).map(sym => (
            <View key={sym.name} style={[s.card, { marginBottom: 8, padding: 11, borderLeftWidth: 3, borderLeftColor: sym.border, borderLeftStyle: "solid" }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: C.dark, flex: 1 }}>{sym.name}</Text>
                <Badge text={sym.badge} color={sym.likely ? C.teal : C.muted} bg={sym.likely ? C.teal + "14" : C.border}/>
              </View>
              <Text style={[s.bodySm, { color: C.dark, fontSize: 8.5, lineHeight: 1.5, marginBottom: 6 }]}>{sym.body}</Text>
              <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                <Text style={{ fontFamily: "Courier", fontSize: 7.5, color: C.muted, letterSpacing: 1 }}>VIA</Text>
                {sym.via.map(v => <Badge key={v} text={v} color={C.teal} bg={C.teal + "12"}/>)}
              </View>
            </View>
          ))}
        </View>
        <View style={{ width: colW }}>
          {SYMPTOMS.slice(4).map(sym => (
            <View key={sym.name} style={[s.card, { marginBottom: 8, padding: 11, borderLeftWidth: 3, borderLeftColor: sym.border, borderLeftStyle: "solid", opacity: sym.likely ? 1 : 0.72 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: C.dark, flex: 1 }}>{sym.name}</Text>
                <Badge text={sym.badge} color={sym.likely ? C.teal : C.muted} bg={sym.likely ? C.teal + "14" : C.border}/>
              </View>
              <Text style={[s.bodySm, { color: C.dark, fontSize: 8.5, lineHeight: 1.5, marginBottom: 6 }]}>{sym.body}</Text>
              <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                <Text style={{ fontFamily: "Courier", fontSize: 7.5, color: C.muted, letterSpacing: 1 }}>VIA</Text>
                {sym.via.map(v => <Badge key={v} text={v} color={sym.likely ? C.teal : C.muted} bg={sym.likely ? C.teal + "12" : C.border}/>)}
              </View>
            </View>
          ))}
        </View>
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 08 — PROJECTION (tinted green)
═══════════════════════════════════════════════════ */
function ProjectionPage({ data }: { data: DemoReportData }) {
  const proj = data.scoreProjection.projected
  const gain = proj - data.score
  const chartW = CW
  const chartH = 180
  // Map score 0-100 to y coords (inverted, top = 100)
  const sy = (score: number) => chartH - (score / 100) * chartH

  return (
    <Page size="A4" style={s.greenPage}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 02 · Why it matters" title="Your 30-day projection"/>
      <PageFooter section="Section 02 · Why it matters" num={8}/>

      <Eyebrow text="Your projection"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>Where you could be in 30 days.</Text>

      {/* Chart */}
      <View style={[s.card, { padding: 14, marginTop: 16 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <View>
            <Text style={s.eyebrowMuted}>Score projection · today to day 30</Text>
            <Text style={[s.h4, { marginTop: 3 }]}>{data.score} → {proj} · a {gain}-point gain</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: C.border }}/>
              <Text style={s.bodySm}>Today</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: C.green }}/>
              <Text style={s.bodySm}>Projected</Text>
            </View>
          </View>
        </View>

        <Svg width={chartW} height={chartH + 24} viewBox={`0 0 ${chartW} ${chartH + 24}`}>
          <Defs>
            <LinearGradient id="chartG" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%"   stopColor={C.lime}/>
              <Stop offset="50%"  stopColor={C.teal}/>
              <Stop offset="100%" stopColor={C.orange}/>
            </LinearGradient>
          </Defs>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(v => (
            <Line key={v} x1="36" y1={sy(v)} x2={chartW} y2={sy(v)} stroke={C.darkAlpha06} strokeWidth="1"/>
          ))}
          {/* Y labels */}
          {[100, 75, 50, 25, 0].map(v => (
            <ST key={v} x="30" y={sy(v) + 4} textAnchor="end" fontSize="8" fill={C.muted}>{v}</ST>
          ))}
          {/* Target band */}
          <Rect x="36" y={sy(80)} width={chartW - 36} height={sy(70) - sy(80)} fill={C.green + "14"}/>
          {/* Dashed baseline */}
          <Line x1="36" y1={sy(data.score)} x2={chartW} y2={sy(data.score)} stroke={C.darkAlpha12} strokeWidth="1.5" strokeDasharray="4,5"/>
          {/* Projection curve (approximated as line) */}
          <Path
            d={`M 36 ${sy(data.score)} C ${chartW * 0.3} ${sy(data.score)}, ${chartW * 0.6} ${sy(proj * 0.92)}, ${chartW} ${sy(proj)}`}
            stroke="url(#chartG)" strokeWidth="3" fill="none" strokeLinecap="round"
          />
          {/* Start marker */}
          <Circle cx="36" cy={sy(data.score)} r="5" fill="#fff" stroke={C.dark} strokeWidth="2"/>
          <ST x="44" y={sy(data.score) - 5} fontSize="11" fill={C.dark}>{data.score}</ST>
          <ST x="44" y={sy(data.score) + 11} fontSize="7" fill={C.muted}>TODAY</ST>
          {/* End marker */}
          <Circle cx={chartW} cy={sy(proj)} r="6" fill={C.green} stroke="#fff" strokeWidth="2"/>
          <ST x={chartW - 4} y={sy(proj) - 9} textAnchor="end" fontSize="12" fill={C.dark}>{proj}</ST>
          <ST x={chartW - 4} y={sy(proj) + 16} textAnchor="end" fontSize="7" fill={C.green}>DAY 30</ST>
          {/* X axis labels */}
          {["Day 1", "Day 7", "Day 14", "Day 21", "Day 30"].map((label, i) => {
            const x = 36 + (i / 4) * (chartW - 36)
            return <ST key={label} x={x} y={chartH + 20} textAnchor="middle" fontSize="8" fill={C.muted}>{label}</ST>
          })}
        </Svg>

        <Text style={[s.bodySm, { marginTop: 8 }]}>This projection is based on your current pattern and typical improvement rates for your profile type.</Text>
      </View>

      <View style={s.spacer}/>

      {/* Three habits */}
      <Text style={s.eyebrowMuted}>The three habits powering this projection</Text>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
        {data.scoreProjection.drivers.slice(0, 3).map((driver, i) => {
          const colors = [[C.lime, C.green], [C.green, C.teal], [C.yellow, C.orange]] as const
          const [c1] = colors[i] ?? colors[0]
          return (
            <View key={driver} style={[s.cardSoft, { flex: 1, gap: 8 }]}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c1, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: "Times-Bold", fontSize: 12, color: "#fff" }}>0{i + 1}</Text>
              </View>
              <Text style={[s.body, { fontFamily: "Helvetica-Bold", fontSize: 10 }]}>{driver}</Text>
            </View>
          )
        })}
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 09 — STRENGTHS & OPPORTUNITIES
═══════════════════════════════════════════════════ */
function StrengthsPage({ data }: { data: DemoReportData }) {
  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 02 · Why it matters" title="Strengths & opportunities"/>
      <PageFooter section="Section 02 · Why it matters" num={9}/>

      <Eyebrow text="Where you stand"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>Strengths & opportunities.</Text>
      <Text style={[s.lead, { marginBottom: 22, maxWidth: 400 }]}>Your three biggest strengths, and the three areas with the most growth potential.</Text>

      <View style={{ flexDirection: "row", gap: 14 }}>
        {/* Strengths */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid", paddingBottom: 8, marginBottom: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.lime }}/>
            <Eyebrow text="Three strengths" color="#4A7E1A" mb={0}/>
          </View>
          {data.strengths.slice(0, 3).map((item) => (
            <View key={item.title} style={[s.card, { marginBottom: 9, borderLeftWidth: 3, borderLeftColor: C.lime, borderLeftStyle: "solid" }]}>
              <Text style={[s.h5, { marginBottom: 5 }]}>{item.title}</Text>
              <Text style={[s.bodySm, { color: C.dark, lineHeight: 1.5 }]}>{item.explanation}</Text>
            </View>
          ))}
        </View>

        {/* Opportunities */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid", paddingBottom: 8, marginBottom: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.orange }}/>
            <Eyebrow text="Three opportunities" color="#C57712" mb={0}/>
          </View>
          {data.opportunities.slice(0, 3).map((item) => (
            <View key={item.title} style={[s.card, { marginBottom: 9, borderLeftWidth: 3, borderLeftColor: C.orange, borderLeftStyle: "solid" }]}>
              <Text style={[s.h5, { marginBottom: 5 }]}>{item.title}</Text>
              <Text style={[s.bodySm, { color: C.dark, lineHeight: 1.5 }]}>{item.explanation}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }}/>

      {/* Footer note */}
      <View style={[s.cardSoft, { flexDirection: "row", alignItems: "center", gap: 14 }]}>
        <Text style={{ fontFamily: "Times-Bold", fontSize: 28, color: C.green, lineHeight: 1 }}>→</Text>
        <Text style={[s.body, { flex: 1, fontSize: 10 }]}>
          The fastest path forward is to <Text style={{ fontFamily: "Helvetica-Bold" }}>protect the strengths</Text> with low maintenance, and direct all new effort at <Text style={{ fontFamily: "Helvetica-Bold" }}>{data.opportunities[0]?.title ?? "fermented food frequency"}</Text> — your highest-leverage opportunity.
        </Text>
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 10 — KEY INSIGHT (dark)
═══════════════════════════════════════════════════ */
function KeyInsightPage({ data }: { data: DemoReportData }) {
  const gain = data.scoreProjection.projected - data.score

  return (
    <Page size="A4" style={s.darkPage}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 02 · Why it matters" title="Your key insight" dark/>
      <PageFooter section="Section 02 · Why it matters" num={10} dark/>

      <Eyebrow text="Your key insight" color={C.lime}/>
      <Text style={[s.h1, { color: "#fff", marginBottom: 28 }]}>The single biggest discovery.</Text>

      {/* Big pull quote */}
      <View style={{ maxWidth: CW * 0.92, marginBottom: 28 }}>
        <Text style={{ fontFamily: "Times-Italic", fontSize: 30, lineHeight: 1.25, letterSpacing: -0.5, color: C.green }}>
          &ldquo;{data.keyInsight.trigger}&rdquo;
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 28, marginBottom: "auto" }}>
        <Text style={{ flex: 1, fontFamily: "Helvetica", fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>
          {data.keyInsight.explanation}
        </Text>
        <Text style={{ flex: 1, fontFamily: "Helvetica", fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>
          {data.deepInsight.slice(0, 320)}
        </Text>
      </View>

      <View style={{ flex: 1 }}/>

      {/* Bottom — quote + big number */}
      <View style={{ flexDirection: "row", gap: 28, alignItems: "flex-end", marginTop: 24 }}>
        <View style={{ flex: 1.5 }}>
          <Text style={{ fontFamily: "Times-Italic", fontSize: 17, lineHeight: 1.45, color: "rgba(255,255,255,0.85)" }}>
            &ldquo;Your gut system is more responsive to change than most people realise. The right inputs, consistently applied, produce results that are both measurable and felt.&rdquo;
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10 }}>
              <GradBar h={20} w={20}/>
            </View>
            <Text style={{ fontFamily: "Courier", fontSize: 8, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>EatoBiotics Research</Text>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text style={{ fontFamily: "Times-Bold", fontSize: 80, lineHeight: 1, letterSpacing: -4, color: C.green }}>+{gain}</Text>
          <Eyebrow text="Projected score gain · 30 days" color="rgba(255,255,255,0.5)" mb={0}/>
        </View>
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 11 — DEEP INSIGHT
═══════════════════════════════════════════════════ */
function DeepInsightPage({ data }: { data: DemoReportData }) {
  const pre = data.pillarScores.find(p => p.name === "Prebiotics")?.score ?? 72
  const pro = data.pillarScores.find(p => p.name === "Probiotics")?.score ?? 45
  const pos = data.pillarScores.find(p => p.name === "Postbiotics")?.score ?? 78

  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 02 · Why it matters" title="Your food system in full"/>
      <PageFooter section="Section 02 · Why it matters" num={11}/>

      <Eyebrow text="Deep insight"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>Your food system in full.</Text>
      <Text style={[s.lead, { marginBottom: 18, maxWidth: 400 }]}>A complete picture of how your three scores interact — and what that means for your biology.</Text>

      {/* Three-system flow */}
      <View style={[s.card, { padding: 14, marginBottom: 14 }]}>
        <Text style={s.eyebrowMuted}>How your three systems connect</Text>
        <View style={{ flexDirection: "row", alignItems: "stretch", gap: 0, marginTop: 12 }}>
          {[
            { score: pre, label: "Prebiotics",  sub: "Feeds the bacteria",  c1: C.lime,   c2: C.green },
            { score: pro, label: "Probiotics",  sub: "Your gap",            c1: C.green,  c2: C.teal, isGap: true },
            { score: pos, label: "Postbiotics", sub: "Produces compounds",  c1: C.yellow, c2: C.orange },
          ].map((sys, i) => (
            <View key={sys.label} style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              <View style={{
                flex: 1, padding: 14, borderRadius: 10,
                backgroundColor: sys.c1 + "18",
                borderWidth: sys.isGap ? 2 : 1,
                borderColor: sys.isGap ? C.teal : C.border,
                borderStyle: "solid",
              }}>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: sys.c1, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{sys.label}</Text>
                <Text style={{ fontFamily: "Times-Bold", fontSize: 36, lineHeight: 1, color: C.dark, letterSpacing: -1, marginBottom: 4 }}>{sys.score}</Text>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: C.dark, marginBottom: 3 }}>{sys.isGap ? "Your gap" : "Strong"}</Text>
                <Text style={s.bodySm}>{sys.sub}</Text>
              </View>
              {i < 2 && (
                <View style={{ width: 24, alignItems: "center" }}>
                  <Text style={{ fontSize: 16, color: C.muted }}>→</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <Text style={[s.body, { lineHeight: 1.7, marginBottom: 14 }]}>
        {data.deepInsight.slice(0, 400)}
      </Text>

      {/* Biology cards */}
      <Text style={[s.eyebrowMuted, { marginBottom: 8 }]}>The biology behind your scores</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {[
          { title: "The gut-brain highway",      body: "The vagus nerve carries 80% of signals upward — from gut to brain. The quality of your microbiome determines the quality of those signals." },
          { title: "Microbiome by numbers",       body: "100 trillion bacteria live in your gut. Diversity is the single most important metric for long-term health." },
          { title: `Why your Pro ${pro} matters`, body: `At ${pro}, Probiotics is your most correctable score — and the one that creates a bottleneck for everything else. Targeted change here has the highest return.` },
        ].map((card) => (
          <View key={card.title} style={[s.card, { flex: 1 }]}>
            <Text style={[s.h5, { marginBottom: 6 }]}>{card.title}</Text>
            <Text style={[s.bodySm, { color: C.dark, lineHeight: 1.55 }]}>{card.body}</Text>
          </View>
        ))}
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 12 — CHANGE TIMELINE (tinted warm)
═══════════════════════════════════════════════════ */
function ChangeTimelinePage() {
  const STAGES = [
    { period: "Days 1–7",  title: "First effects",             color: C.lime,   items: ["Digestive rhythm begins to improve", "Reduced bloating after meals", "Slightly better energy on waking"] },
    { period: "Weeks 2–4", title: "Microbiome shift",          color: C.teal,   items: ["Measurable bacterial diversity increase", "Energy levels stabilise across the day", "Fewer cravings for ultra-processed foods"] },
    { period: "Month 2+",  title: "Brain-gut recalibration",   color: C.orange, items: ["Mood baseline shifts noticeably", "Sleep depth and onset improves", "Sharper focus and mental clarity"] },
  ]

  return (
    <Page size="A4" style={s.warmPage}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 03 · What to do" title="Your change timeline"/>
      <PageFooter section="Section 03 · What to do" num={12}/>

      <Eyebrow text="What you'll notice — and when"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>Your change timeline.</Text>
      <Text style={[s.lead, { marginBottom: 24, maxWidth: 400 }]}>What changes when, based on typical response rates for your profile. Real results in three stages.</Text>

      {/* Timeline track + columns */}
      <View style={{ position: "relative", marginBottom: 10 }}>
        {/* Connecting bar */}
        <View style={{ position: "absolute", top: 34, left: MX * 0.6, right: MX * 0.6, height: 3 }}>
          <GradBar h={3} w={CW - MX * 1.2}/>
        </View>
        <View style={{ flexDirection: "row", gap: 16 }}>
          {STAGES.map((stage, i) => (
            <View key={stage.period} style={{ flex: 1, alignItems: "center" }}>
              {/* Circle */}
              <View style={{
                width: 68, height: 68, borderRadius: 34,
                backgroundColor: C.bg, borderWidth: 3, borderColor: stage.color, borderStyle: "solid",
                alignItems: "center", justifyContent: "center", marginBottom: 12,
              }}>
                <Text style={{ fontSize: 22, lineHeight: 1 }}>{["⚡","🌱","🌟"][i]}</Text>
              </View>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: stage.color, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, textAlign: "center" }}>{stage.period}</Text>
              <Text style={[s.h4, { textAlign: "center", marginBottom: 10 }]}>{stage.title}</Text>
              {stage.items.map(item => (
                <View key={item} style={{ flexDirection: "row", gap: 7, paddingVertical: 5, alignItems: "flex-start" }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: stage.color, marginTop: 3, flexShrink: 0 }}/>
                  <Text style={[s.bodySm, { color: C.dark, fontSize: 9.5, flex: 1 }]}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }}/>

      {/* Big stat */}
      <View style={[s.card, { padding: 0 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 20 }}>
          <View style={{ alignItems: "center", width: 100 }}>
            <Text style={{ fontFamily: "Times-Bold", fontSize: 64, lineHeight: 1, color: C.green, letterSpacing: -3 }}>30</Text>
            <Text style={s.eyebrowMuted}>Days to a measurable shift</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.h4, { fontSize: 16, marginBottom: 8 }]}>Targeted dietary change works on a 30-day clock.</Text>
            <Text style={[s.bodySm, { color: C.dark, lineHeight: 1.6 }]}>
              Clinical research consistently shows measurable changes in gut bacterial diversity within 3–4 weeks of applying targeted dietary changes. Your plan ahead is built precisely around this window.
            </Text>
          </View>
        </View>
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 13 — 7-DAY PLAN
═══════════════════════════════════════════════════ */
function SevenDayPlanPage({ data }: { data: DemoReportData }) {
  const BADGE_COLORS: Record<string, [string, string]> = {
    Pro:   [C.teal,   C.teal + "18"],
    Pre:   [C.lime,   C.lime + "18"],
    Pos:   [C.orange, C.orange + "18"],
    Reset: ["rgba(255,255,255,0.6)", "rgba(255,255,255,0.1)"],
  }
  const CARD_COLORS = [C.lime, C.green, C.teal, C.teal, C.yellow, C.orange, C.dark]
  const PILLAR_TAGS = ["Pro", "Pre", "Pro", "Pre", "Pos", "Pro", "Reset"]

  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 03 · What to do" title="Your 7-day starter plan"/>
      <PageFooter section="Section 03 · What to do" num={13}/>

      <Eyebrow text="Your starter plan"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>Your first 7 days.</Text>
      <Text style={[s.lead, { marginBottom: 16, maxWidth: 400 }]}>One focused action for each day of your first week. Simple, specific, achievable.</Text>

      <View style={{ flexDirection: "row", gap: 6 }}>
        {data.sevenDayPlan.slice(0, 7).map((item, i) => {
          const isDark = i === 6
          const cardColor = CARD_COLORS[i]
          const tag = PILLAR_TAGS[i] ?? "Pro"
          const [bc, bb] = BADGE_COLORS[tag] ?? BADGE_COLORS.Pro
          const cardW = Math.floor(C7)

          return (
            <View key={item.day} style={{
              width: cardW, borderRadius: 8, overflow: "hidden",
              borderWidth: 1, borderColor: isDark ? C.dark : C.border, borderStyle: "solid",
              backgroundColor: isDark ? C.dark : C.bg,
              padding: 10, minHeight: 190,
            }}>
              <Text style={{ fontFamily: "Times-Bold", fontSize: 28, lineHeight: 1, color: isDark ? C.green : cardColor, letterSpacing: -1, marginBottom: 2 }}>
                {String(i + 1).padStart(2, "0")}
              </Text>
              <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.45)" : C.muted, marginBottom: 8 }}>
                {item.day.slice(0, 3)}
              </Text>
              <Text style={{ fontFamily: "Helvetica", fontSize: 8.5, lineHeight: 1.45, color: isDark ? "rgba(255,255,255,0.82)" : C.dark, flex: 1 }}>
                {item.action}
              </Text>
              <View style={{ marginTop: 8 }}>
                <Badge text={tag} color={bc} bg={bb}/>
              </View>
            </View>
          )
        })}
      </View>

      <View style={s.spacer}/>

      {/* Tracker strip */}
      <View style={[s.cardSoft, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
        <View>
          <Eyebrow text="Daily tracker · what to notice" mb={4}/>
          <Text style={[s.h5, { marginBottom: 4 }]}>Energy · Sleep · Digestion · Mood · Focus</Text>
          <Text style={[s.bodySm, { fontSize: 9 }]}>Track these five each evening — by Day 7 you'll start to see your own pattern.</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[C.yellow, C.green, C.teal, C.orange, C.lime].map((col, i) => (
            <View key={i} style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1.5, borderColor: col, borderStyle: "solid", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 14 }}>{["⚡","🌙","💚","😊","🎯"][i]}</Text>
            </View>
          ))}
        </View>
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 14 — 30-DAY ROADMAP
═══════════════════════════════════════════════════ */
function RoadmapPage({ data }: { data: DemoReportData }) {
  const WEEK_META = [
    { num: "01", badge: "Foundation", gradient: [C.lime, C.green]   as [string,string], color: "#4A7E1A" },
    { num: "02", badge: "Variety",    gradient: [C.green, C.teal]   as [string,string], color: "#0F7345" },
    { num: "03", badge: "Rhythm",     gradient: [C.teal, C.yellow]  as [string,string], color: "#B0890A" },
    { num: "04", badge: "Retest",     gradient: [C.yellow, C.orange] as [string,string], color: "#C57712" },
  ]

  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 03 · What to do" title="Your 30-day roadmap"/>
      <PageFooter section="Section 03 · What to do" num={14}/>

      <Eyebrow text="30-day roadmap"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>Your month of change.</Text>
      <Text style={[s.lead, { marginBottom: 20, maxWidth: 400 }]}>Four themed weeks, each building on the last. Every action is specific and achievable.</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {data.roadmap.slice(0, 4).map((week, i) => {
          const meta = WEEK_META[i]
          return (
            <View key={week.week} style={{ width: C2, borderRadius: 10, borderWidth: 1, borderColor: C.border, borderStyle: "solid", overflow: "hidden", backgroundColor: C.bg }}>
              {/* Gradient top bar */}
              <View style={{ height: 6 }}>
                <GradBar h={6} w={C2}/>
              </View>
              <View style={{ padding: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: meta.color, letterSpacing: 1.5, textTransform: "uppercase" }}>Week {meta.num}</Text>
                  <Badge text={meta.badge} color={meta.gradient[0]} bg={meta.gradient[0] + "18"}/>
                </View>
                <Text style={[s.h3, { fontSize: 16, marginBottom: 3 }]}>{week.theme}</Text>
                <Text style={[s.bodySm, { fontSize: 9, marginBottom: 12 }]}>{week.focus}</Text>
                {week.actions.slice(0, 4).map((action, j) => (
                  <View key={j} style={{ flexDirection: "row", gap: 8, marginBottom: 7, alignItems: "flex-start" }}>
                    <Text style={{ fontFamily: "Courier", fontSize: 9, color: meta.color, fontWeight: 700, minWidth: 14 }}>{j + 1}.</Text>
                    <Text style={{ fontFamily: "Helvetica", fontSize: 9.5, color: C.dark, flex: 1, lineHeight: 1.45 }}>{action}</Text>
                  </View>
                ))}
              </View>
            </View>
          )
        })}
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 15 — FOOD PRESCRIPTION
═══════════════════════════════════════════════════ */
function FoodPrescriptionPage({ data }: { data: DemoReportData }) {
  const FOOD_GRADS: [string, string][] = [
    [C.green, C.teal], [C.lime, C.green], [C.lime, C.teal],
    [C.yellow, C.lime], [C.orange, C.yellow],
  ]
  const leftW = 56
  const rightW = 92
  const centerW = CW - leftW - rightW - 2

  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 03 · What to do" title="Your 5 priority foods"/>
      <PageFooter section="Section 03 · What to do" num={15}/>

      <Eyebrow text="Food prescription"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>Five foods chosen for you.</Text>
      <Text style={[s.lead, { marginBottom: 12, maxWidth: 440 }]}>Based on your pillar scores, these five foods will have the highest impact. Each is chosen for a specific biological reason.</Text>

      {/* At-a-glance strip */}
      <View style={[s.cardSoft, { flexDirection: "row", justifyContent: "space-around", padding: 10, marginBottom: 12 }]}>
        {data.foods.slice(0, 5).map((f) => (
          <View key={f.food} style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, marginBottom: 3 }}>{f.emoji}</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5, color: C.dark, textAlign: "center" }}>{f.food.split(" ")[0]}</Text>
            <Text style={{ fontFamily: "Courier", fontSize: 7.5, color: C.muted }}>{f.servingsPerWeek}×/wk</Text>
          </View>
        ))}
      </View>

      {/* Food detail cards */}
      {data.foods.slice(0, 5).map((food, i) => {
        const [c1] = FOOD_GRADS[i] ?? FOOD_GRADS[0]
        const t = food.pillars[0] ? pillarType(food.pillars[0]) : "pre"
        return (
          <View key={food.food} style={{ borderRadius: 8, borderWidth: 1, borderColor: C.border, borderStyle: "solid", overflow: "hidden", marginBottom: 8, flexDirection: "row" }}>
            {/* Left: gradient icon col */}
            <View style={{ width: leftW, backgroundColor: c1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 22, marginBottom: 4 }}>{food.emoji}</Text>
              <Text style={{ fontFamily: "Courier", fontSize: 7.5, color: "rgba(255,255,255,0.8)", letterSpacing: 1 }}>#{String(i + 1).padStart(2, "0")}</Text>
            </View>
            {/* Center: content */}
            <View style={{ width: centerW, padding: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                <Text style={[s.h5, { flex: 1, fontSize: 11 }]}>{food.food} <Text style={{ fontFamily: "Helvetica", fontWeight: 400, fontSize: 9, color: C.muted }}>· #{i + 1} priority</Text></Text>
                <View style={{ flexDirection: "row", gap: 3 }}>
                  {food.pillars.slice(0, 3).map(p => {
                    const pt = pillarType(p)
                    return <Badge key={p} text={p.slice(0, 3)} color={PILLAR_COLOR[pt]} bg={PILLAR_COLOR[pt] + "18"}/>
                  })}
                </View>
              </View>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5, color: C.green, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>KEY COMPOUND</Text>
              <Text style={[s.bodySm, { fontSize: 8.5, color: C.dark, marginBottom: 3 }]}>{food.why.slice(0, 100)}</Text>
              <Text style={[s.bodySm, { fontSize: 8.5, color: C.dark }]}><Text style={{ fontFamily: "Helvetica-Bold" }}>How to use — </Text>{food.howTo.slice(0, 110)}</Text>
            </View>
            {/* Right: weekly target */}
            <View style={{ width: rightW, backgroundColor: C.soft, borderLeftWidth: 1, borderLeftColor: C.border, borderLeftStyle: "solid", alignItems: "center", justifyContent: "center", padding: 10 }}>
              <Text style={s.eyebrowMuted}>Weekly target</Text>
              <Text style={{ fontFamily: "Times-Bold", fontSize: 28, lineHeight: 1, color: C.dark, marginTop: 4 }}>{food.servingsPerWeek}×</Text>
              <Text style={s.bodySm}>per week</Text>
            </View>
          </View>
        )
      })}
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 16 — SHOPPING LIST
═══════════════════════════════════════════════════ */
function ShoppingListPage({ data }: { data: DemoReportData }) {
  // Group foods by shop category
  const STATIC_CATS = [
    { title: "Fermented & live cultures", pillar: "Probiotics", color: C.teal,
      items: ["Plain live-culture yoghurt", "Kefir — dairy or goat's, plain", "Sauerkraut — refrigerated, unpasteurised", "Kimchi — traditional ferment", "Miso paste — add after cooking", "Tempeh — firm fermented soy", "Kombucha — under 5g sugar/100ml"] },
    { title: "Prebiotic produce", pillar: "Prebiotics", color: C.lime,
      items: ["Garlic", "Onions & shallots", "Leeks", "Asparagus", "Jerusalem artichoke — highest inulin", "Banana — slightly underripe", "Chicory / endive"] },
    { title: "Polyphenol-rich produce", pillar: "Prebiotics", color: C.green,
      items: ["Blueberries — frozen is fine", "Spinach", "Broccoli — lightly steamed", "Red cabbage — raw", "Walnuts — raw", "Dark chocolate 70%+", "Pomegranate seeds"] },
    { title: "Wholegrains & legumes", pillar: "Prebiotics", color: C.yellow,
      items: ["Rolled oats", "Lentils", "Chickpeas — canned, rinse well", "Black beans", "Barley — beta-glucan", "Quinoa"] },
  ]
  const topFoods = data.foods.slice(0, 5).map(f => f.food.toLowerCase())
  const colW2 = C2

  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 03 · What to do" title="Weekly gut-health shop"/>
      <PageFooter section="Section 03 · What to do" num={16}/>

      <Eyebrow text="Weekly shopping list"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>Your standing weekly shop.</Text>
      <Text style={[s.lead, { marginBottom: 10, maxWidth: 440 }]}>31 items across 5 categories — your 5 priority picks are highlighted. Built to be your standing weekly list.</Text>

      {/* Priority strip */}
      <View style={{ borderRadius: 8, padding: 10, backgroundColor: C.green + "0C", borderWidth: 1, borderColor: C.green + "33", borderStyle: "solid", flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, color: C.green, letterSpacing: 1.5, textTransform: "uppercase" }}>★ Priority picks</Text>
        {data.foods.slice(0, 5).map(f => (
          <Text key={f.food} style={{ fontFamily: "Helvetica-Bold", fontSize: 9.5, color: C.dark }}>{f.emoji} {f.food.split(" ")[0]}</Text>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {STATIC_CATS.map((cat) => {
          const t = pillarType(cat.pillar)
          return (
            <View key={cat.title} style={{ width: colW2, borderRadius: 8, borderWidth: 1, borderColor: C.border, borderStyle: "solid", padding: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid", paddingBottom: 8, marginBottom: 8 }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10.5, color: C.dark }}>{cat.title}</Text>
                <Badge text={cat.pillar.slice(0, 3)} color={PILLAR_COLOR[t]} bg={PILLAR_COLOR[t] + "18"}/>
              </View>
              {cat.items.map(item => {
                const isPriority = topFoods.some(tf => item.toLowerCase().includes(tf) || tf.includes(item.toLowerCase().split(" ")[0]))
                return (
                  <View key={item} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.darkAlpha06, borderBottomStyle: "solid", backgroundColor: isPriority ? C.green + "06" : "transparent", paddingHorizontal: isPriority ? 4 : 0, ...(isPriority ? { borderRadius: 4 } : {}) }}>
                    <Text style={{ fontFamily: isPriority ? "Helvetica-Bold" : "Helvetica", fontSize: 8.5, color: C.dark, flex: 1 }}>{item}</Text>
                    {isPriority && <Text style={{ fontSize: 8, color: C.green, fontFamily: "Helvetica-Bold" }}>★</Text>}
                  </View>
                )
              })}
            </View>
          )
        })}
      </View>

      {/* Proteins row */}
      <View style={[s.card, { marginTop: 10, padding: 10 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid", paddingBottom: 8, marginBottom: 8 }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10.5 }}>🥚 Proteins & healthy fats</Text>
          <Badge text="Pos" color={C.orange} bg={C.orange + "18"}/>
        </View>
        <View style={{ flexDirection: "row" }}>
          {["Eggs — poached / soft-boiled", "Oily fish 3×/wk — DHA for gut", "Mixed seeds — flax, chia, pumpkin", "EVOO — polyphenols feed bacteria"].map(item => (
            <Text key={item} style={{ flex: 1, fontFamily: "Helvetica", fontSize: 8.5, color: C.dark, paddingHorizontal: 6 }}>{item}</Text>
          ))}
        </View>
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 17 — POWER COMBINATIONS
═══════════════════════════════════════════════════ */
function PowerCombinationsPage({ data }: { data: DemoReportData }) {
  const pairs = data.foodPairings?.length > 0 ? data.foodPairings : [
    { food1: "Kefir",     emoji1: "🥛", food2: "Jerusalem artichoke", emoji2: "🌱", reason: "The bacteria in kefir feed on the inulin in artichoke, multiplying and diversifying your microbiome far beyond what either food achieves alone. A clinically-recognised synbiotic pairing." },
    { food1: "Chickpeas", emoji1: "🫘", food2: "Sauerkraut",          emoji2: "🫙", reason: "Resistant starch + live cultures — chickpeas provide the fermentable fuel; sauerkraut supplies the bacteria to ferment it. Together they maximise butyrate production for gut lining repair." },
  ]

  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 03 · What to do" title="Power combinations"/>
      <PageFooter section="Section 03 · What to do" num={17}/>

      <Eyebrow text="Power combinations"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>Synbiotic pairings.</Text>
      <Text style={[s.lead, { marginBottom: 22, maxWidth: 440 }]}>These food pairings produce significantly greater benefits than each food alone — a concept known as synbiotics.</Text>

      <View style={{ flexDirection: "row", gap: 14 }}>
        {pairs.slice(0, 2).map((pair, i) => (
          <View key={i} style={[s.card, { flex: 1, padding: 0, overflow: "hidden" }]}>
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>Pairing 0{i + 1} · Synbiotic</Text>
                <Badge text="Synbiotic" color={C.green} bg={C.green + "18"}/>
              </View>
              {/* Food pair display */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 40, marginBottom: 4 }}>{pair.emoji1}</Text>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: C.dark }}>{pair.food1}</Text>
                </View>
                <Text style={{ fontFamily: "Times-Bold", fontSize: 28, color: C.green }}>+</Text>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 40, marginBottom: 4 }}>{pair.emoji2}</Text>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: C.dark }}>{pair.food2}</Text>
                </View>
              </View>
              <Text style={[s.h4, { marginBottom: 8 }]}>{pair.food1} + {pair.food2}.</Text>
              <Text style={[s.body, { fontSize: 10, lineHeight: 1.65 }]}>{pair.reason}</Text>
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: C.border, borderTopStyle: "solid", padding: 12, backgroundColor: C.soft, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={s.bodySm}>Try it</Text>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9.5, color: C.dark, flex: 1, textAlign: "right" }}>
                {i === 0 ? "Kefir + roasted artichoke breakfast bowl" : "Chickpea salad with 1 tbsp sauerkraut"}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={s.spacer}/>

      {/* Mechanism */}
      <View style={[s.card, { padding: 14 }]}>
        <Eyebrow text="How synbiotics work" mb={10}/>
        <View style={{ flexDirection: "row", gap: 14 }}>
          {[
            { num: "01", color: C.lime, title: "Prebiotic arrives first",    body: "Fibre passes intact into the colon — the bacterial pantry." },
            { num: "02", color: C.teal, title: "Probiotic feeds on it",       body: "Live bacteria from the paired food multiply rapidly on the fuel source." },
            { num: "03", color: C.orange, title: "Postbiotic compounds form", body: "Short-chain fatty acids (especially butyrate) are produced in larger quantities." },
          ].map((step) => (
            <View key={step.num} style={{ flex: 1, flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
              <View style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: step.color + "22", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Text style={{ fontFamily: "Times-Bold", fontSize: 11, color: step.color }}>{step.num}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: C.dark, marginBottom: 3 }}>{step.title}</Text>
                <Text style={s.bodySm}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 18 — FINAL THOUGHTS (dark)
═══════════════════════════════════════════════════ */
function FinalThoughtsPage({ data }: { data: DemoReportData }) {
  const pre = data.pillarScores.find(p => p.name === "Prebiotics")?.score ?? 72
  const pro = data.pillarScores.find(p => p.name === "Probiotics")?.score ?? 45
  const pos = data.pillarScores.find(p => p.name === "Postbiotics")?.score ?? 78
  const proj = data.scoreProjection.projected

  return (
    <Page size="A4" style={s.darkPage}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Final thoughts" title="Where you go from here" dark/>
      <PageFooter section="Final thoughts · End of report" num={18} dark/>

      <Eyebrow text="Final thoughts" color={C.lime}/>
      <Text style={[s.h1, { color: "#fff", marginBottom: 18 }]}>Where you go from here.</Text>

      {/* At-a-glance card */}
      <View style={{ borderRadius: 10, backgroundColor: C.bg, padding: 16, marginBottom: 16 }}>
        <Text style={s.eyebrowMuted}>Your report at a glance</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 20, marginTop: 12 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={s.eyebrowMuted}>Starting score</Text>
            <Text style={{ fontFamily: "Times-Bold", fontSize: 48, lineHeight: 1, color: C.dark, letterSpacing: -2, marginTop: 4 }}>{data.score}</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, color: C.green, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 3 }}>{data.profile}</Text>
          </View>

          {/* Mini chart */}
          <View style={{ flex: 1, alignItems: "center" }}>
            <Svg width={200} height={60} viewBox="0 0 200 60">
              <Defs>
                <LinearGradient id="mG" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor={C.lime}/>
                  <Stop offset="100%" stopColor={C.green}/>
                </LinearGradient>
              </Defs>
              <Line x1="10" y1="45" x2="190" y2="15" stroke="url(#mG)" strokeWidth="3" strokeLinecap="round"/>
              <Circle cx="10" cy="45" r="5" fill="#fff" stroke={C.dark} strokeWidth="2"/>
              <Circle cx="190" cy="15" r="6" fill={C.green} stroke="#fff" strokeWidth="2"/>
              <ST x="10" y="58" fontSize="8" fill={C.muted}>NOW · {data.score}</ST>
              <ST x="190" y="58" textAnchor="end" fontSize="8" fill={C.muted}>DAY 30 · {proj}</ST>
            </Svg>
            <View style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 }}>
              <GradBar h={18} w={140}/>
              <View style={{ position: "absolute", top: 0, left: 0, width: 140, height: 18, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: "#fff" }}>+{proj - data.score} point potential gain</Text>
              </View>
            </View>
          </View>

          <View style={{ alignItems: "center" }}>
            <Text style={s.eyebrowMuted}>Projected score</Text>
            <Text style={{ fontFamily: "Times-Bold", fontSize: 48, lineHeight: 1, color: C.green, letterSpacing: -2, marginTop: 4 }}>{proj}</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, color: C.teal, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 3 }}>Strong Foundation</Text>
          </View>
        </View>
        <View style={s.divider}/>
        <View style={{ flexDirection: "row", gap: 14 }}>
          {[
            { label: "Prebiotics",  score: pre,  t: "pre" as const },
            { label: "Probiotics",  score: pro,  t: "pro" as const },
            { label: "Postbiotics", score: pos,  t: "pos" as const },
          ].map(p => (
            <View key={p.label} style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 3 }}>
                <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: PILLAR_COLOR[p.t] }}/>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5, color: C.muted, letterSpacing: 1.2, textTransform: "uppercase" }}>{p.label}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                <Text style={{ fontFamily: "Times-Bold", fontSize: 22, color: C.dark, lineHeight: 1 }}>{p.score}</Text>
                <Text style={[s.bodySm, { fontSize: 8.5 }]}>
                  {p.t === "pre" || p.t === "pos" ? "Strong — protect & build on." : "Priority gap — focus here first."}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Three commitments */}
      <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Your three commitments starting today</Text>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
        {[
          { num: "01", color: C.green,  title: "Start with one change.",        body: "Pick the single highest-impact action from your 7-day plan and do it today. One action builds the habit loop that makes the rest easier." },
          { num: "02", color: "#0F7345", title: "Stay consistent for 30 days.",  body: "The gut microbiome doesn't respond to occasional efforts. Consistency across 30 days produces the measurable shift your projection is based on." },
          { num: "03", color: C.orange, title: "Retest after 30 days.",          body: "Your score is a baseline, not a verdict. Retaking the assessment after applying this plan gives you a real measurement of what changed." },
        ].map(c => (
          <View key={c.num} style={{ flex: 1, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", padding: 14 }}>
            <Text style={{ fontFamily: "Times-Bold", fontSize: 28, lineHeight: 1, color: c.color, marginBottom: 7 }}>{c.num}</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11, color: "#fff", marginBottom: 5 }}>{c.title}</Text>
            <Text style={{ fontFamily: "Helvetica", fontSize: 9, color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>{c.body}</Text>
          </View>
        ))}
      </View>

      {/* Closing gradient strip */}
      <View style={{ borderRadius: 12, overflow: "hidden" }}>
        <GradBar h={110} w={CW}/>
        <View style={{ position: "absolute", top: 0, left: 0, width: CW, height: 110, padding: 20, flexDirection: "row", gap: 28, alignItems: "flex-start" }}>
          <View style={{ flex: 1.4 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "rgba(26,46,18,0.6)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>A note to close on</Text>
            <Text style={{ fontFamily: "Times-Italic", fontSize: 16, lineHeight: 1.35, color: "#1A2E12" }}>
              &ldquo;Your gut system is more responsive to change than most people realise. The right inputs, consistently applied, produce results that are both measurable and felt.&rdquo;
            </Text>
          </View>
          <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: "rgba(26,46,18,0.15)", borderLeftStyle: "solid", paddingLeft: 20 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "rgba(26,46,18,0.6)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Mark your Day 30</Text>
            <View style={{ borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "rgba(26,46,18,0.2)", borderStyle: "dashed", backgroundColor: "rgba(255,255,255,0.45)" }}>
              <Text style={{ fontSize: 8, color: "rgba(26,46,18,0.6)", marginBottom: 4 }}>Retest date</Text>
              <Text style={{ fontFamily: "Times-Bold", fontSize: 18, color: "#1A2E12" }}>______ / ______ / ______</Text>
            </View>
          </View>
        </View>
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════ */
export function ReportPDF({ data }: { data: DemoReportData }) {
  return (
    <Document title={data.theme.title} author="EatoBiotics" subject="Gut Intelligence Report" creator="EatoBiotics">
      <CoverPage         data={data}/>
      <ContentsPage      data={data}/>
      <GutProfilePage    data={data}/>
      <ThreeBioticsPage  data={data}/>
      <ScoreMeaningPage  data={data}/>
      <DailyLifePage     data={data}/>
      <SymptomMapPage    data={data}/>
      <ProjectionPage    data={data}/>
      <StrengthsPage     data={data}/>
      <KeyInsightPage    data={data}/>
      <DeepInsightPage   data={data}/>
      <ChangeTimelinePage/>
      <SevenDayPlanPage  data={data}/>
      <RoadmapPage       data={data}/>
      <FoodPrescriptionPage data={data}/>
      <ShoppingListPage  data={data}/>
      <PowerCombinationsPage data={data}/>
      <FinalThoughtsPage data={data}/>
    </Document>
  )
}
