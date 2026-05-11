// No "use client" — server-side only (used in API route via renderToBuffer)
import path from "path"
import {
  Document, Page, View, Text, Svg, Defs,
  LinearGradient, Stop, Rect, Circle, Path, Line,
  StyleSheet, Font,
} from "@react-pdf/renderer"
import type { DemoReportData } from "./demo-report"

/* ─── Custom Font Registration ───────────────────────────────── */
// Variable TTF files from Google Fonts — each compound family name mirrors
// the built-in pattern (e.g. "DM-Sans-Bold") so a simple global find-replace
// upgrades the whole file without touching every fontWeight prop.
const FONTS_DIR = path.join(process.cwd(), "public", "fonts")

// Lora (serif) — replaces Times-Bold / Times-Italic
Font.register({ family: "Lora-Bold",   src: path.join(FONTS_DIR, "Lora.ttf"),        fontWeight: 700 })
Font.register({ family: "Lora-Italic", src: path.join(FONTS_DIR, "Lora-Italic.ttf"), fontWeight: 600 })

// DM Sans (sans-serif) — replaces Helvetica / Helvetica-Bold
Font.register({ family: "DM-Sans",         src: path.join(FONTS_DIR, "DMSans.ttf"), fontWeight: 400 })
Font.register({ family: "DM-Sans-Medium",  src: path.join(FONTS_DIR, "DMSans.ttf"), fontWeight: 500 })
Font.register({ family: "DM-Sans-SemiBold",src: path.join(FONTS_DIR, "DMSans.ttf"), fontWeight: 600 })
Font.register({ family: "DM-Sans-Bold",    src: path.join(FONTS_DIR, "DMSans.ttf"), fontWeight: 700 })

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
  page:      { backgroundColor: C.bg, paddingHorizontal: MX, paddingTop: 58, paddingBottom: 40, fontFamily: "DM-Sans", fontSize: 10, color: C.dark },
  darkPage:  { backgroundColor: C.dark, paddingHorizontal: MX, paddingTop: 58, paddingBottom: 40, fontFamily: "DM-Sans", fontSize: 10, color: "#FFFFFF" },
  greenPage: { backgroundColor: C.tintedGreen, paddingHorizontal: MX, paddingTop: 58, paddingBottom: 40, fontFamily: "DM-Sans", fontSize: 10, color: C.dark },
  warmPage:  { backgroundColor: C.tintedWarm, paddingHorizontal: MX, paddingTop: 58, paddingBottom: 40, fontFamily: "DM-Sans", fontSize: 10, color: C.dark },
  // Headers / footers
  pageHeader: { position: "absolute", top: 28, left: MX, right: MX, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pageFooter: { position: "absolute", bottom: 24, left: MX, right: MX, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: C.green },
  headerText: { fontSize: 7.5, fontFamily: "DM-Sans-Bold", letterSpacing: 1.4, textTransform: "uppercase", color: C.muted },
  footerText: { fontSize: 7.5, fontFamily: "DM-Sans", color: C.muted, letterSpacing: 0.5 },
  // Typography
  eyebrow:    { fontSize: 10, fontFamily: "DM-Sans-Bold", letterSpacing: 2, textTransform: "uppercase", color: C.green, marginBottom: 6 },
  eyebrowMuted:{ fontSize: 10, fontFamily: "DM-Sans-Bold", letterSpacing: 2, textTransform: "uppercase", color: C.muted },
  display:    { fontFamily: "Lora-Bold", fontSize: 48, lineHeight: 1.05, letterSpacing: -1, color: C.dark, margin: 0 },
  h1:         { fontFamily: "Lora-Bold", fontSize: 32, lineHeight: 1.1, color: C.dark, margin: 0 },
  h2:         { fontFamily: "Lora-Bold", fontSize: 24, lineHeight: 1.1, color: C.dark, margin: 0 },
  h3:         { fontFamily: "Lora-Bold", fontSize: 18, lineHeight: 1.15, color: C.dark, margin: 0 },
  h4:         { fontFamily: "Lora-Bold", fontSize: 14, lineHeight: 1.2, color: C.dark, margin: 0 },
  h5:         { fontFamily: "DM-Sans-Bold", fontSize: 12, lineHeight: 1.2, color: C.dark, margin: 0 },
  lead:       { fontFamily: "DM-Sans", fontSize: 14, lineHeight: 1.6, color: C.muted, margin: 0 },
  body:       { fontFamily: "DM-Sans", fontSize: 11.5, lineHeight: 1.6, color: C.dark, margin: 0 },
  bodySm:     { fontFamily: "DM-Sans", fontSize: 10.5, lineHeight: 1.55, color: C.muted, margin: 0 },
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
      <Text style={{ width: 80, fontSize: 10, fontFamily: "DM-Sans-Bold", color: C.dark }}>{label}</Text>
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
      <Text style={{ fontSize: 7.5, fontFamily: "DM-Sans-Bold", color, letterSpacing: 1 }}>{text}</Text>
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
   PAGE 01 — COVER (white)
═══════════════════════════════════════════════════ */
function CoverPage({ data }: { data: DemoReportData }) {
  const pre = data.pillarScores.find(p => p.name === "Prebiotics")?.score ?? 72
  const pro = data.pillarScores.find(p => p.name === "Probiotics")?.score ?? 45
  const pos = data.pillarScores.find(p => p.name === "Postbiotics")?.score ?? 78
  const ringSize = 220

  return (
    <Page size="A4" style={{ backgroundColor: C.bg, fontFamily: "DM-Sans", fontSize: 10, color: C.dark, paddingBottom: 0 }}>
      {/* Top gradient bar */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <GradBar h={4} w={PW}/>
      </View>

      {/* Logo row */}
      <View style={{
        paddingHorizontal: MX, paddingTop: 22,
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {/* Gradient circle */}
          <View style={{ width: 22, height: 22, borderRadius: 11, overflow: "hidden" }}>
            <GradBar h={22} w={22}/>
          </View>
          <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 13, letterSpacing: 0.4, color: C.dark }}>EatoBiotics</Text>
        </View>
        <Text style={{ fontFamily: "Courier", fontSize: 8, letterSpacing: 2.5, textTransform: "uppercase", color: C.muted }}>Sample · v1.0</Text>
      </View>

      {/* Title block */}
      <View style={{ paddingHorizontal: MX, paddingTop: 18, paddingBottom: 10 }}>
        <Text style={[s.eyebrow, { marginBottom: 8 }]}>Gut Intelligence Report</Text>
        <Text style={{ fontFamily: "Lora-Bold", fontSize: 48, lineHeight: 1.05, letterSpacing: -1.5, color: C.dark, marginBottom: 10 }}>
          The Food System{"\n"}Inside{" "}
          <Text style={{ color: C.green }}>You.</Text>
        </Text>
        <Text style={{ fontFamily: "DM-Sans", fontSize: 14, lineHeight: 1.6, color: C.muted, maxWidth: 400 }}>
          A personalised reading of your gut food system across three biological pillars — Prebiotics, Probiotics, Postbiotics — with a focused 30-day plan to close your single biggest gap.
        </Text>
      </View>

      {/* Two-column: score ring | description + pillar bars */}
      <View style={{ paddingHorizontal: MX, flexDirection: "row", gap: 24, alignItems: "center", paddingVertical: 12 }}>
        {/* Score ring with overlay */}
        <View style={{ width: ringSize, height: ringSize, alignItems: "center", justifyContent: "center" }}>
          <ScoreRingSvg score={data.score} size={ringSize}/>
          <View style={{ position: "absolute", top: 0, left: 0, width: ringSize, height: ringSize, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: "Lora-Bold", fontSize: 58, color: C.dark, lineHeight: 1, letterSpacing: -2 }}>{data.score}</Text>
            <Text style={{ fontFamily: "DM-Sans", fontSize: 11, color: C.muted, marginTop: 2 }}>/100</Text>
            <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 8, color: C.green, letterSpacing: 2, textTransform: "uppercase", marginTop: 6 }}>
              {data.profile}
            </Text>
          </View>
        </View>

        {/* Right col */}
        <View style={{ flex: 1 }}>
          {/* Solid badge */}
          <View style={{
            borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, alignSelf: "flex-start", marginBottom: 12,
            overflow: "hidden",
          }}>
            <GradBar h={26} w={180}/>
            <View style={{ position: "absolute", top: 0, left: 0, width: 180, height: 26, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 9, color: "#fff", letterSpacing: 0.5 }}>Top third of respondents</Text>
            </View>
          </View>

          <Text style={{ fontFamily: "Lora-Bold", fontSize: 19, lineHeight: 1.25, color: C.dark, marginBottom: 8 }}>
            Your food system is further along than most.
          </Text>
          <Text style={{ fontFamily: "DM-Sans", fontSize: 10.5, lineHeight: 1.6, color: C.dark, marginBottom: 14 }}>
            A score of {data.score} places you in the top third. Your{" "}
            <Text style={{ fontFamily: "DM-Sans-Bold" }}>Prebiotics</Text> and{" "}
            <Text style={{ fontFamily: "DM-Sans-Bold" }}>Postbiotics</Text> are particularly strong. The opportunity ahead is focused: closing the{" "}
            <Text style={{ fontFamily: "DM-Sans-Bold" }}>Probiotics</Text> gap will lift everything else.
          </Text>

          {/* Pillar bars */}
          <PillarBar label="Prebiotics"  score={pre} type="pre"/>
          <PillarBar label="Probiotics"  score={pro} type="pro"/>
          <PillarBar label="Postbiotics" score={pos} type="pos"/>
        </View>
      </View>

      {/* Identity strip */}
      <View style={{
        marginHorizontal: MX,
        borderTopWidth: 1, borderTopColor: C.border, borderTopStyle: "solid",
        borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid",
        flexDirection: "row",
      }}>
        {[
          { label: "Prepared for", value: (data as any).name ?? "Sample Reader" },
          { label: "Report date",  value: new Date().toLocaleDateString("en-GB", { month:"long", year:"numeric" }) },
          { label: "Assessment",   value: "15-question · deep" },
          { label: "Profile",      value: data.profile },
        ].map((item, i) => (
          <View key={i} style={{ flex: 1, borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: C.border, borderLeftStyle: "solid", padding: 12, paddingLeft: i > 0 ? 12 : 0 }}>
            <Text style={{ fontSize: 7.5, fontFamily: "DM-Sans-Bold", color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>{item.label}</Text>
            <Text style={{ fontSize: 11, fontFamily: "DM-Sans-Bold", color: C.dark }}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* Footer tagline */}
      <View style={{ paddingHorizontal: MX, paddingTop: 14, paddingBottom: 18 }}>
        <Text style={{ fontFamily: "Courier", fontSize: 8, letterSpacing: 2.5, textTransform: "uppercase", color: C.muted }}>
          eatobiotics.com  ·  Build the food system inside you — and help build the food system around you
        </Text>
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 02 — CONTENTS
═══════════════════════════════════════════════════ */
function ContentsPage() {
  const TOC = [
    ["01", "Your score at a glance",          "01"],
    ["02", "Contents",                         "02"],
    ["03", "Your gut profile",                 "03"],
    ["04", "Your three biotics",               "04"],
    ["05", "What your score means",            "05"],
    ["06", "Daily life — energy, digestion, sleep", "06"],
    ["07", "Symptom map",                      "07"],
    ["08", "Your 30-day projection",           "08"],
    ["09", "Strengths & opportunities",        "09"],
    ["10", "Your key insight",                 "10"],
    ["11", "Your food system in full",         "11"],
    ["12", "Your change timeline",             "12"],
    ["13", "Your 7-day starter plan",          "13"],
    ["14", "Your 30-day roadmap",              "14"],
    ["15", "Your 5 priority foods",            "15"],
    ["16", "Weekly gut-health shop",           "16"],
    ["17", "Power combinations",               "17"],
    ["18", "Where you go from here",           "18"],
  ]
  const half = Math.ceil(TOC.length / 2)
  const colA = TOC.slice(0, half)
  const colB = TOC.slice(half)

  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Contents" title="Your report" />
      <PageFooter section="Introduction" num={2}/>

      <Eyebrow text="Inside this report"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>A guided read of your{"\n"}gut food system.</Text>
      <Text style={[s.lead, { marginBottom: 20, maxWidth: 420 }]}>
        Eighteen pages, three biotics, one focused 30-day plan. Read it once front-to-back, then keep it on hand as your weekly reference.
      </Text>

      {/* TOC two-column */}
      <View style={{ flexDirection: "row", gap: 28, marginBottom: 24 }}>
        {[colA, colB].map((col, ci) => (
          <View key={ci} style={{ flex: 1 }}>
            {col.map(([num, title, page]) => (
              <View key={num} style={{
                flexDirection: "row", alignItems: "baseline", gap: 8,
                borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid",
                paddingVertical: 8,
              }}>
                <Text style={{ fontFamily: "Courier", fontSize: 9, color: C.muted, width: 20, letterSpacing: 0.5 }}>{num}</Text>
                <Text style={{ flex: 1, fontFamily: "Lora-Bold", fontSize: 12, color: C.dark }}>{title}</Text>
                <Text style={{ fontFamily: "Courier", fontSize: 9, color: C.muted }}>p.{page}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Three summary cards */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {[
          { eyebrow: "01 · Where you are",    eyeColor: C.green,  body: "Your score, your three pillars, and what they reveal about how you feel day-to-day." },
          { eyebrow: "02 · Why it matters",   eyeColor: C.teal,   body: "The biology behind the numbers — and the symptoms most likely linked to your profile." },
          { eyebrow: "03 · What to do",       eyeColor: C.orange, body: "A 7-day starter, a 30-day roadmap, 5 priority foods and a complete weekly shop." },
        ].map((card) => (
          <View key={card.eyebrow} style={[s.cardSoft, { flex: 1 }]}>
            <Text style={[s.eyebrow, { color: card.eyeColor, marginBottom: 6 }]}>{card.eyebrow}</Text>
            <Text style={[s.bodySm, { color: C.dark, lineHeight: 1.55 }]}>{card.body}</Text>
          </View>
        ))}
      </View>
    </Page>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE 03 — GUT PROFILE
═══════════════════════════════════════════════════ */
function GutProfilePage({ data }: { data: DemoReportData }) {
  // Horizontal progress bar width as percentage of content width
  const scorePct = data.score  // 0–100

  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: 0, left: 0 }}><GradBar h={4} w={PW}/></View>
      <PageHeader section="Section 01 · Where you are" title="Your gut profile"/>
      <PageFooter section="Section 01 · Where you are" num={3}/>

      <Eyebrow text="Your profile"/>
      <Text style={[s.h1, { marginBottom: 6 }]}>{data.profile}.</Text>
      <Text style={[s.lead, { marginBottom: 18, maxWidth: 420 }]}>
        Genuine positive habits are forming, but key biological inputs are still inconsistent. The foundation exists — it just needs specific additions.
      </Text>

      {/* Horizontal progress bar with "You" marker */}
      <View style={{ marginBottom: 22 }}>
        <Text style={[s.eyebrowMuted, { marginBottom: 10 }]}>Your trajectory</Text>

        {/* "You" badge marker — positioned above the bar at scorePct% */}
        <View style={{ position: "relative", height: 36, marginBottom: 0 }}>
          <View style={{
            position: "absolute",
            left: `${scorePct}%` as any,
            marginLeft: -30,
            top: 0,
            alignItems: "center",
            width: 60,
          }}>
            {/* Solid badge */}
            <View style={{ borderRadius: 99, overflow: "hidden", alignSelf: "center" }}>
              <GradBar h={20} w={56}/>
              <View style={{ position: "absolute", top: 0, left: 0, width: 56, height: 20, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 8, color: "#fff" }}>You · {data.score}</Text>
              </View>
            </View>
            {/* Stem line */}
            <View style={{ width: 2, height: 12, backgroundColor: C.dark, marginTop: 2 }}/>
          </View>
        </View>

        {/* Progress track */}
        <View style={{ height: 8, backgroundColor: "rgba(26,46,18,0.06)", borderRadius: 999, overflow: "hidden" }}>
          <View style={{ width: `${scorePct}%` as any, height: 8, borderRadius: 999, overflow: "hidden" }}>
            <GradBar h={8} w={CW * scorePct / 100}/>
          </View>
        </View>

        {/* Tick labels */}
        <View style={{ flexDirection: "row", marginTop: 8 }}>
          {[
            { val: "0",   label: "Start" },
            { val: "25",  label: "Building" },
            { val: "50",  label: "Emerging" },
            { val: "75",  label: "Strong" },
            { val: "100", label: "Optimal" },
          ].map((t, i) => (
            <View key={t.val} style={{ flex: 1, alignItems: i === 4 ? "flex-end" : i === 0 ? "flex-start" : "center" }}>
              <Text style={{ fontFamily: "Courier", fontSize: 8, color: C.muted }}>{t.val}</Text>
              <Text style={{ fontFamily: "DM-Sans", fontSize: 8.5, color: C.muted, marginTop: 1 }}>{t.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 2×2 grid — Working / Inconsistent */}
      <Text style={[s.eyebrowMuted, { marginBottom: 10 }]}>What's working — and what isn't</Text>
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        {[
          { badge: "Working",      badgeColor: "#4A7E1A", badgeBg: "rgba(168,224,99,0.18)", badgeBorder: "rgba(168,224,99,0.35)",
            title: data.strengths[0]?.title ?? "Some plant food variety",
            body:  data.strengths[0]?.explanation?.slice(0, 110) ?? "A reasonable range of vegetables, legumes, and whole grains across your week." },
          { badge: "Inconsistent", badgeColor: "#C57712", badgeBg: "rgba(245,166,35,0.12)", badgeBorder: "rgba(245,166,35,0.25)",
            title: data.opportunities[0]?.title ?? "Irregular fermented food intake",
            body:  data.opportunities[0]?.explanation?.slice(0, 110) ?? "Living foods appear occasionally — not as a daily, deliberate habit." },
          { badge: "Working",      badgeColor: "#4A7E1A", badgeBg: "rgba(168,224,99,0.18)", badgeBorder: "rgba(168,224,99,0.35)",
            title: data.strengths[1]?.title ?? "Partial gut rhythm established",
            body:  data.strengths[1]?.explanation?.slice(0, 110) ?? "Meal timing follows a workable pattern most days." },
          { badge: "Inconsistent", badgeColor: "#C57712", badgeBg: "rgba(245,166,35,0.12)", badgeBorder: "rgba(245,166,35,0.25)",
            title: data.opportunities[1]?.title ?? "Specific gaps to close",
            body:  data.opportunities[1]?.explanation?.slice(0, 110) ?? "Probiotic variety and ultra-processed food frequency both need attention." },
        ].map((card, i) => (
          <View key={i} style={{ width: C2, borderRadius: 10, borderWidth: 1, borderColor: C.border, borderStyle: "solid", backgroundColor: C.bg, padding: 14, marginBottom: 0 }}>
            {/* Badge */}
            <View style={{
              borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start",
              backgroundColor: card.badgeBg, borderWidth: 1, borderColor: card.badgeBorder, borderStyle: "solid", marginBottom: 8,
            }}>
              <Text style={{ fontSize: 8, fontFamily: "DM-Sans-Bold", color: card.badgeColor, letterSpacing: 0.5 }}>{card.badge}</Text>
            </View>
            <Text style={{ fontFamily: "Lora-Bold", fontSize: 14, color: C.dark, lineHeight: 1.2, marginBottom: 6 }}>{card.title}</Text>
            <Text style={{ fontFamily: "DM-Sans", fontSize: 9.5, color: C.dark, lineHeight: 1.55, opacity: 0.78 }}>{card.body}</Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }}/>

      {/* Next level card */}
      <View style={{ borderRadius: 10, backgroundColor: C.soft, borderWidth: 1, borderColor: C.darkAlpha06, borderStyle: "solid", borderLeftWidth: 4, borderLeftColor: C.green, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
        <View style={{ flex: 1 }}>
          <Text style={[s.eyebrow, { marginBottom: 5 }]}>Next level</Text>
          <Text style={{ fontFamily: "Lora-Bold", fontSize: 17, color: C.dark, lineHeight: 1.2, marginBottom: 6 }}>Strong Foundation.</Text>
          <Text style={{ fontFamily: "DM-Sans", fontSize: 9.5, color: C.dark, lineHeight: 1.55, opacity: 0.82 }}>
            A well-functioning gut with real momentum. The structural habits are in place and the microbiome is being actively supported. Your 30-day plan is designed to close this gap.
          </Text>
        </View>
        <Text style={{ fontFamily: "Courier", fontSize: 10, color: C.muted, marginLeft: 16, letterSpacing: 0.5 }}>
          {data.score} → {data.scoreProjection.projected} in 30 days
        </Text>
      </View>
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
                  <Text style={{ fontSize: 8, fontFamily: "DM-Sans-Bold", color: c1, letterSpacing: 1.5, textTransform: "uppercase" }}>{meta.eyebrow}</Text>
                  <Badge text={meta.badge} color={c1} bg={c1 + "18"}/>
                </View>
                {/* Big score */}
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                  <Text style={{ fontFamily: "Lora-Bold", fontSize: 48, lineHeight: 1, letterSpacing: -2, color: C.dark }}>{p.score}</Text>
                  <Text style={{ fontFamily: "Courier", fontSize: 9, color: C.muted }}>/100</Text>
                </View>
                <Text style={[s.bodySm, { color: C.dark, lineHeight: 1.55, marginBottom: 10 }]}>{p.description}</Text>
                <View style={s.divider}/>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={s.bodySm}>Role</Text>
                  <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 9, color: C.dark }}>{meta.role}</Text>
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
            A score of <Text style={{ fontFamily: "DM-Sans-Bold" }}>{data.score}</Text> reflects a gut system that functions reasonably well day-to-day but is operating below its potential. Your plant variety <Text style={{ fontFamily: "Courier" }}>(Pre {pre})</Text> and recovery rhythm <Text style={{ fontFamily: "Courier" }}>(Pos {pos})</Text> are strong, but your intake of fermented and probiotic-rich foods is noticeably low <Text style={{ fontFamily: "Courier" }}>(Pro {pro})</Text>.
          </Text>
          <Text style={[s.body, { lineHeight: 1.7, marginBottom: 12 }]}>
            This creates a <Text style={{ fontFamily: "DM-Sans-Bold" }}>one-sided system</Text> — you're feeding the microbiome but not actively seeding it with the bacterial diversity it needs to thrive. Probiotics is the most responsive pillar to targeted dietary change. Small, consistent additions can produce measurable shifts within <Text style={{ fontFamily: "DM-Sans-Bold" }}>2–4 weeks</Text>.
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
                    <Text style={{ fontFamily: "Lora-Bold", fontSize: 20, color: "#fff" }}>{item.score}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 10, color: C.dark }}>{item.label}</Text>
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
        <Text style={{ fontFamily: "Lora-Bold", fontSize: 52, color: C.green, lineHeight: 1, letterSpacing: -2 }}>2–4</Text>
        <View style={{ flex: 1 }}>
          <Eyebrow text="Weeks to a measurable shift" color="rgba(255,255,255,0.5)" mb={4}/>
          <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 13, color: "#fff", lineHeight: 1.35 }}>
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
            <Text style={{ fontFamily: "Lora-Bold", fontSize: 72, lineHeight: 1, letterSpacing: -3, color: C.green }}>90%</Text>
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
                <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 10, color: C.dark, flex: 1 }}>{sym.name}</Text>
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
                <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 10, color: C.dark, flex: 1 }}>{sym.name}</Text>
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
                <Text style={{ fontFamily: "Lora-Bold", fontSize: 12, color: "#fff" }}>0{i + 1}</Text>
              </View>
              <Text style={[s.body, { fontFamily: "DM-Sans-Bold", fontSize: 10 }]}>{driver}</Text>
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
        <Text style={{ fontFamily: "Lora-Bold", fontSize: 28, color: C.green, lineHeight: 1 }}>→</Text>
        <Text style={[s.body, { flex: 1, fontSize: 10 }]}>
          The fastest path forward is to <Text style={{ fontFamily: "DM-Sans-Bold" }}>protect the strengths</Text> with low maintenance, and direct all new effort at <Text style={{ fontFamily: "DM-Sans-Bold" }}>{data.opportunities[0]?.title ?? "fermented food frequency"}</Text> — your highest-leverage opportunity.
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
        <Text style={{ fontFamily: "Lora-Italic", fontSize: 30, lineHeight: 1.25, letterSpacing: -0.5, color: C.green }}>
          &ldquo;{data.keyInsight.trigger}&rdquo;
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 28, marginBottom: "auto" }}>
        <Text style={{ flex: 1, fontFamily: "DM-Sans", fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>
          {data.keyInsight.explanation}
        </Text>
        <Text style={{ flex: 1, fontFamily: "DM-Sans", fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>
          {data.deepInsight.slice(0, 320)}
        </Text>
      </View>

      <View style={{ flex: 1 }}/>

      {/* Bottom — quote + big number */}
      <View style={{ flexDirection: "row", gap: 28, alignItems: "flex-end", marginTop: 24 }}>
        <View style={{ flex: 1.5 }}>
          <Text style={{ fontFamily: "Lora-Italic", fontSize: 17, lineHeight: 1.45, color: "rgba(255,255,255,0.85)" }}>
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
          <Text style={{ fontFamily: "Lora-Bold", fontSize: 80, lineHeight: 1, letterSpacing: -4, color: C.green }}>+{gain}</Text>
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
                <Text style={{ fontSize: 8, fontFamily: "DM-Sans-Bold", color: sys.c1, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{sys.label}</Text>
                <Text style={{ fontFamily: "Lora-Bold", fontSize: 36, lineHeight: 1, color: C.dark, letterSpacing: -1, marginBottom: 4 }}>{sys.score}</Text>
                <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 9, color: C.dark, marginBottom: 3 }}>{sys.isGap ? "Your gap" : "Strong"}</Text>
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
              <Text style={{ fontSize: 8, fontFamily: "DM-Sans-Bold", color: stage.color, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, textAlign: "center" }}>{stage.period}</Text>
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
            <Text style={{ fontFamily: "Lora-Bold", fontSize: 64, lineHeight: 1, color: C.green, letterSpacing: -3 }}>30</Text>
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
    Pro:   [C.teal,   "rgba(45,170,110,0.10)"],
    Pre:   ["#4A7E1A", "rgba(168,224,99,0.18)"],
    Pos:   [C.orange, "rgba(245,166,35,0.12)"],
    Reset: ["rgba(255,255,255,0.7)", "rgba(255,255,255,0.12)"],
  }
  // All day numbers use same green (#4CB648) per design; day 7 card is dark
  const PILLAR_TAGS = ["Pro", "Pre", "Pro", "Pre", "Pos", "Pro", "Reset"]
  const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday · rest day"]

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
          const tag = PILLAR_TAGS[i] ?? "Pro"
          const [bc, bb] = BADGE_COLORS[tag] ?? BADGE_COLORS.Pro
          const cardW = Math.floor(C7)
          const dayName = DAY_NAMES[i] ?? item.day

          return (
            <View key={item.day} style={{
              width: cardW, borderRadius: 8,
              borderWidth: 1, borderColor: isDark ? C.dark : C.border, borderStyle: "solid",
              backgroundColor: isDark ? C.dark : C.bg,
              padding: 10, minHeight: 190,
            }}>
              {/* ALL day numbers use same C.green — only day 7 card background differs */}
              <Text style={{ fontFamily: "Lora-Bold", fontSize: 32, lineHeight: 1, color: C.green, letterSpacing: -1, marginBottom: 3 }}>
                {String(i + 1).padStart(2, "0")}
              </Text>
              <Text style={{ fontSize: 7.5, fontFamily: "DM-Sans-Bold", letterSpacing: 1.2, textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.45)" : C.muted, marginBottom: 8 }}>
                {dayName}
              </Text>
              <Text style={{ fontFamily: "DM-Sans", fontSize: 9, lineHeight: 1.45, color: isDark ? "rgba(255,255,255,0.85)" : C.dark, flex: 1 }}>
                {item.action}
              </Text>
              <View style={{ marginTop: 8 }}>
                <View style={{
                  borderRadius: 99, paddingHorizontal: 7, paddingVertical: 3, alignSelf: "flex-start",
                  backgroundColor: bb,
                  borderWidth: 1, borderColor: bc + "55", borderStyle: "solid",
                }}>
                  <Text style={{ fontSize: 7.5, fontFamily: "DM-Sans-Bold", color: bc, letterSpacing: 0.5 }}>{tag}</Text>
                </View>
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
                  <Text style={{ fontSize: 8, fontFamily: "DM-Sans-Bold", color: meta.color, letterSpacing: 1.5, textTransform: "uppercase" }}>Week {meta.num}</Text>
                  <Badge text={meta.badge} color={meta.gradient[0]} bg={meta.gradient[0] + "18"}/>
                </View>
                <Text style={[s.h3, { fontSize: 16, marginBottom: 3 }]}>{week.theme}</Text>
                <Text style={[s.bodySm, { fontSize: 9, marginBottom: 12 }]}>{week.focus}</Text>
                {week.actions.slice(0, 4).map((action, j) => (
                  <View key={j} style={{ flexDirection: "row", gap: 8, marginBottom: 7, alignItems: "flex-start" }}>
                    <Text style={{ fontFamily: "Courier", fontSize: 9, color: meta.color, fontWeight: 700, minWidth: 14 }}>{j + 1}.</Text>
                    <Text style={{ fontFamily: "DM-Sans", fontSize: 9.5, color: C.dark, flex: 1, lineHeight: 1.45 }}>{action}</Text>
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
            <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 8.5, color: C.dark, textAlign: "center" }}>{f.food.split(" ")[0]}</Text>
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
                <Text style={[s.h5, { flex: 1, fontSize: 11 }]}>{food.food} <Text style={{ fontFamily: "DM-Sans", fontWeight: 400, fontSize: 9, color: C.muted }}>· #{i + 1} priority</Text></Text>
                <View style={{ flexDirection: "row", gap: 3 }}>
                  {food.pillars.slice(0, 3).map(p => {
                    const pt = pillarType(p)
                    return <Badge key={p} text={p.slice(0, 3)} color={PILLAR_COLOR[pt]} bg={PILLAR_COLOR[pt] + "18"}/>
                  })}
                </View>
              </View>
              <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 7.5, color: C.green, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>KEY COMPOUND</Text>
              <Text style={[s.bodySm, { fontSize: 8.5, color: C.dark, marginBottom: 3 }]}>{food.why.slice(0, 100)}</Text>
              <Text style={[s.bodySm, { fontSize: 8.5, color: C.dark }]}><Text style={{ fontFamily: "DM-Sans-Bold" }}>How to use — </Text>{food.howTo.slice(0, 110)}</Text>
            </View>
            {/* Right: weekly target */}
            <View style={{ width: rightW, backgroundColor: C.soft, borderLeftWidth: 1, borderLeftColor: C.border, borderLeftStyle: "solid", alignItems: "center", justifyContent: "center", padding: 10 }}>
              <Text style={s.eyebrowMuted}>Weekly target</Text>
              <Text style={{ fontFamily: "Lora-Bold", fontSize: 28, lineHeight: 1, color: C.dark, marginTop: 4 }}>{food.servingsPerWeek}×</Text>
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
        <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 8, color: C.green, letterSpacing: 1.5, textTransform: "uppercase" }}>★ Priority picks</Text>
        {data.foods.slice(0, 5).map(f => (
          <Text key={f.food} style={{ fontFamily: "DM-Sans-Bold", fontSize: 9.5, color: C.dark }}>{f.emoji} {f.food.split(" ")[0]}</Text>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {STATIC_CATS.map((cat) => {
          const t = pillarType(cat.pillar)
          return (
            <View key={cat.title} style={{ width: colW2, borderRadius: 8, borderWidth: 1, borderColor: C.border, borderStyle: "solid", padding: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid", paddingBottom: 8, marginBottom: 8 }}>
                <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 10.5, color: C.dark }}>{cat.title}</Text>
                <Badge text={cat.pillar.slice(0, 3)} color={PILLAR_COLOR[t]} bg={PILLAR_COLOR[t] + "18"}/>
              </View>
              {cat.items.map(item => {
                const isPriority = topFoods.some(tf => item.toLowerCase().includes(tf) || tf.includes(item.toLowerCase().split(" ")[0]))
                return (
                  <View key={item} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.darkAlpha06, borderBottomStyle: "solid", backgroundColor: isPriority ? C.green + "06" : "transparent", paddingHorizontal: isPriority ? 4 : 0, ...(isPriority ? { borderRadius: 4 } : {}) }}>
                    <Text style={{ fontFamily: isPriority ? "DM-Sans-Bold" : "DM-Sans", fontSize: 8.5, color: C.dark, flex: 1 }}>{item}</Text>
                    {isPriority && <Text style={{ fontSize: 8, color: C.green, fontFamily: "DM-Sans-Bold" }}>★</Text>}
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
          <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 10.5 }}>🥚 Proteins & healthy fats</Text>
          <Badge text="Pos" color={C.orange} bg={C.orange + "18"}/>
        </View>
        <View style={{ flexDirection: "row" }}>
          {["Eggs — poached / soft-boiled", "Oily fish 3×/wk — DHA for gut", "Mixed seeds — flax, chia, pumpkin", "EVOO — polyphenols feed bacteria"].map(item => (
            <Text key={item} style={{ flex: 1, fontFamily: "DM-Sans", fontSize: 8.5, color: C.dark, paddingHorizontal: 6 }}>{item}</Text>
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
                <Text style={{ fontSize: 8, fontFamily: "DM-Sans-Bold", color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>Pairing 0{i + 1} · Synbiotic</Text>
                <Badge text="Synbiotic" color={C.green} bg={C.green + "18"}/>
              </View>
              {/* Food pair display */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 40, marginBottom: 4 }}>{pair.emoji1}</Text>
                  <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 9, color: C.dark }}>{pair.food1}</Text>
                </View>
                <Text style={{ fontFamily: "Lora-Bold", fontSize: 28, color: C.green }}>+</Text>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 40, marginBottom: 4 }}>{pair.emoji2}</Text>
                  <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 9, color: C.dark }}>{pair.food2}</Text>
                </View>
              </View>
              <Text style={[s.h4, { marginBottom: 8 }]}>{pair.food1} + {pair.food2}.</Text>
              <Text style={[s.body, { fontSize: 10, lineHeight: 1.65 }]}>{pair.reason}</Text>
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: C.border, borderTopStyle: "solid", padding: 12, backgroundColor: C.soft, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={s.bodySm}>Try it</Text>
              <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 9.5, color: C.dark, flex: 1, textAlign: "right" }}>
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
                <Text style={{ fontFamily: "Lora-Bold", fontSize: 11, color: step.color }}>{step.num}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 10, color: C.dark, marginBottom: 3 }}>{step.title}</Text>
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
            <Text style={{ fontFamily: "Lora-Bold", fontSize: 48, lineHeight: 1, color: C.dark, letterSpacing: -2, marginTop: 4 }}>{data.score}</Text>
            <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 8, color: C.green, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 3 }}>{data.profile}</Text>
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
                <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 9, color: "#fff" }}>+{proj - data.score} point potential gain</Text>
              </View>
            </View>
          </View>

          <View style={{ alignItems: "center" }}>
            <Text style={s.eyebrowMuted}>Projected score</Text>
            <Text style={{ fontFamily: "Lora-Bold", fontSize: 48, lineHeight: 1, color: C.green, letterSpacing: -2, marginTop: 4 }}>{proj}</Text>
            <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 8, color: C.teal, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 3 }}>Strong Foundation</Text>
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
                <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 8.5, color: C.muted, letterSpacing: 1.2, textTransform: "uppercase" }}>{p.label}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                <Text style={{ fontFamily: "Lora-Bold", fontSize: 22, color: C.dark, lineHeight: 1 }}>{p.score}</Text>
                <Text style={[s.bodySm, { fontSize: 8.5 }]}>
                  {p.t === "pre" || p.t === "pos" ? "Strong — protect & build on." : "Priority gap — focus here first."}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Three commitments — use soft cards (light bg on dark page, matching HTML .card.soft) */}
      <Text style={{ fontSize: 8, fontFamily: "DM-Sans-Bold", letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Your three commitments starting today</Text>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
        {[
          { num: "01", color: C.green,   title: "Start with one change.",        body: "Pick the single highest-impact action from your 7-day plan and do it today. One action builds the habit loop that makes the rest easier." },
          { num: "02", color: "#0F7345", title: "Stay consistent for 30 days.",  body: "The gut microbiome doesn't respond to occasional efforts. Consistency across 30 days is what produces the measurable shift your projection is based on." },
          { num: "03", color: "#C57712", title: "Retest after 30 days.",          body: "Your score is a baseline, not a verdict. Retaking the assessment after applying this plan gives you a real measurement of what changed — and a new starting point." },
        ].map(c => (
          <View key={c.num} style={{ flex: 1, borderRadius: 10, backgroundColor: C.soft, borderWidth: 1, borderColor: "rgba(26,46,18,0.06)", borderStyle: "solid", padding: 14 }}>
            <Text style={{ fontFamily: "Lora-Bold", fontSize: 28, lineHeight: 1, color: c.color, marginBottom: 7 }}>{c.num}</Text>
            <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 12, color: C.dark, marginBottom: 5 }}>{c.title}</Text>
            <Text style={{ fontFamily: "DM-Sans", fontSize: 9.5, color: C.dark, lineHeight: 1.55, opacity: 0.78 }}>{c.body}</Text>
          </View>
        ))}
      </View>

      {/* Closing gradient strip */}
      <View style={{ borderRadius: 12, overflow: "hidden" }}>
        <GradBar h={110} w={CW}/>
        <View style={{ position: "absolute", top: 0, left: 0, width: CW, height: 110, padding: 20, flexDirection: "row", gap: 28, alignItems: "flex-start" }}>
          <View style={{ flex: 1.4 }}>
            <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 7.5, color: "rgba(26,46,18,0.6)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>A note to close on</Text>
            <Text style={{ fontFamily: "Lora-Italic", fontSize: 16, lineHeight: 1.35, color: "#1A2E12" }}>
              &ldquo;Your gut system is more responsive to change than most people realise. The right inputs, consistently applied, produce results that are both measurable and felt.&rdquo;
            </Text>
          </View>
          <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: "rgba(26,46,18,0.15)", borderLeftStyle: "solid", paddingLeft: 20 }}>
            <Text style={{ fontFamily: "DM-Sans-Bold", fontSize: 7.5, color: "rgba(26,46,18,0.6)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Mark your Day 30</Text>
            <View style={{ borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "rgba(26,46,18,0.2)", borderStyle: "dashed", backgroundColor: "rgba(255,255,255,0.45)" }}>
              <Text style={{ fontSize: 8, color: "rgba(26,46,18,0.6)", marginBottom: 4 }}>Retest date</Text>
              <Text style={{ fontFamily: "Lora-Bold", fontSize: 18, color: "#1A2E12" }}>______ / ______ / ______</Text>
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
      <ContentsPage/>
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
