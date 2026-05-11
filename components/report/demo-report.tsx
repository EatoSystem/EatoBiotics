"use client"
// v8
import Link from "next/link"
import Image from "next/image"
import { Check, ArrowRight, TrendingUp, Mail, Loader2, CheckCircle2 } from "lucide-react"
import { useState } from "react"

const DAY_COLORS = [
  "var(--icon-lime)",
  "var(--icon-green)",
  "var(--icon-teal)",
  "var(--icon-teal)",
  "var(--icon-yellow)",
  "var(--icon-orange)",
  "var(--icon-green)",
]

const WEEK_COLORS = [
  "var(--icon-lime)",
  "var(--icon-green)",
  "var(--icon-teal)",
  "var(--icon-orange)",
]

const PILLAR_ICONS: Record<string, string> = {
  Prebiotics: "🌿",
  Probiotics: "🦠",
  Postbiotics: "✨",
}

const PROFILE_TIERS = [
  {
    min: 80,
    label: "Gut Optimised",
    description: "High-diversity, well-balanced gut with strong outputs across all three pillars. The microbiome is actively supported and producing optimal compounds.",
    characteristics: ["30+ plant foods per week", "Daily fermented food habit", "Strong gut barrier integrity", "Consistent meal rhythm"],
  },
  {
    min: 70,
    label: "Strong Foundation",
    description: "A well-functioning gut with real momentum. The structural habits are in place and the microbiome is being actively supported.",
    characteristics: ["Regular probiotic food intake", "Good plant food variety", "Consistent eating rhythm", "Low inflammatory load"],
  },
  {
    min: 60,
    label: "Emerging Balance",
    description: "Genuine positive habits are forming, but key biological inputs are still inconsistent. The foundation exists — it needs specific additions.",
    characteristics: ["Some plant food variety", "Irregular fermented food intake", "Partial gut rhythm established", "Specific gaps to close"],
  },
  {
    min: 50,
    label: "Building",
    description: "Early-stage habits with meaningful gaps. The microbiome has significant potential that targeted dietary change can unlock quickly.",
    characteristics: ["Some healthy habits present", "Low bacterial diversity", "Inconsistent eating patterns", "High impact opportunity"],
  },
  {
    min: 0,
    label: "Starting Out",
    description: "Significant gaps across multiple pillars — but this is exactly the starting point the assessment and plan are designed for.",
    characteristics: ["Low plant food variety", "Minimal fermented food intake", "Irregular meal timing", "Maximum improvement potential"],
  },
]

const SYMPTOMS = [
  { name: "Brain fog & poor focus", emoji: "🌫️", pillars: ["Probiotics", "Postbiotics"], detail: "Low microbial diversity reduces butyrate production, which crosses the blood-brain barrier and impairs cognitive clarity and recall speed." },
  { name: "Afternoon energy crash", emoji: "⚡", pillars: ["Probiotics", "Prebiotics"], detail: "An under-seeded gut destabilises blood sugar between meals. Less butyrate means less stable energy — the 3pm dip is a gut signal." },
  { name: "Bloating after meals", emoji: "💨", pillars: ["Prebiotics", "Postbiotics"], detail: "Insufficient fibre variety creates imbalanced fermentation. The wrong bacterial species produce gas rather than beneficial short-chain fatty acids." },
  { name: "Poor sleep quality", emoji: "🌙", pillars: ["Probiotics"], detail: "90% of serotonin — the direct precursor to melatonin — is produced in the gut. Low Probiotics directly reduces sleep onset speed and deep-sleep duration." },
  { name: "Mood instability", emoji: "🌊", pillars: ["Probiotics", "Postbiotics"], detail: "The vagus nerve carries gut signals directly to the brain. A disrupted microbiome generates inflammatory signals that destabilise mood baseline." },
  { name: "Slow recovery", emoji: "🔄", pillars: ["Postbiotics"], detail: "Short-chain fatty acids produced by the gut are essential for reducing systemic inflammation after physical or cognitive stress." },
  { name: "Frequent illness", emoji: "🛡️", pillars: ["Prebiotics", "Probiotics"], detail: "70% of immune cells reside in the gut lining. Low prebiotic and probiotic intake weakens the mucosal barrier that keeps pathogens out." },
  { name: "Sugar & junk cravings", emoji: "🍬", pillars: ["Prebiotics", "Probiotics"], detail: "Opportunistic bacteria that thrive on sugar send signals via the vagus nerve creating cravings for the ultra-processed foods that sustain them." },
]

const SHOP_CATEGORY_ICONS: Record<string, string> = {
  Fermented: "🧫",
  Produce: "🥦",
  Grains: "🌾",
  Proteins: "🥚",
  "Nuts & Seeds": "🥜",
  "Tins & Pulses": "🥫",
  Pantry: "🫙",
}

const IDEAL_SHOPPING_LIST = [
  {
    category: "Fermented & Live Cultures",
    icon: "🧫",
    pillar: "Probiotics",
    color: "var(--icon-orange)",
    items: [
      { name: "Plain live-culture yoghurt", note: "Full-fat, check label for 'live active cultures'" },
      { name: "Kefir", note: "Dairy or goat's milk, plain unsweetened" },
      { name: "Sauerkraut", note: "Refrigerated, unpasteurised only — not jarred shelf-stable" },
      { name: "Kimchi", note: "Refrigerated, traditional ferment" },
      { name: "Miso paste", note: "White or brown — add after cooking, never boil" },
      { name: "Tempeh", note: "Firm fermented soy — high protein, mild flavour" },
      { name: "Kombucha", note: "Low sugar varieties under 5g per 100ml" },
    ],
  },
  {
    category: "Prebiotic Produce",
    icon: "🌿",
    pillar: "Prebiotics",
    color: "var(--icon-green)",
    items: [
      { name: "Garlic", note: "Use as a base for everything cooked — 2 cloves per dish" },
      { name: "Onions & shallots", note: "Raw has the strongest prebiotic effect" },
      { name: "Leeks", note: "High in inulin fructans, mild flavour" },
      { name: "Asparagus", note: "In season spring — peak prebiotic content" },
      { name: "Jerusalem artichoke", note: "Highest inulin content of any common vegetable" },
      { name: "Banana", note: "Slightly underripe for maximum resistant starch" },
      { name: "Chicory / endive", note: "Most concentrated inulin source — great in salads" },
    ],
  },
  {
    category: "Polyphenol-Rich Produce",
    icon: "🫐",
    pillar: "Prebiotics",
    color: "var(--icon-lime)",
    items: [
      { name: "Blueberries", note: "Fresh or frozen — nutritionally equivalent, frozen cheaper" },
      { name: "Spinach", note: "60–80g fresh, wilts significantly when cooked" },
      { name: "Broccoli", note: "Lightly steamed preserves sulforaphane content" },
      { name: "Red cabbage", note: "Raw in slaws — rich in anthocyanins" },
      { name: "Walnuts", note: "Raw, not roasted — heat degrades the ALA content" },
      { name: "Dark chocolate (70%+)", note: "20–30g daily — highest polyphenol density of any food" },
      { name: "Pomegranate seeds", note: "Ellagitannins converted to urolithins by gut bacteria" },
    ],
  },
  {
    category: "Wholegrains & Legumes",
    icon: "🌾",
    pillar: "Prebiotics",
    color: "var(--icon-green)",
    items: [
      { name: "Rolled oats", note: "Slow-cooked over instant — more beta-glucan intact" },
      { name: "Lentils", note: "Red dissolve into sauces, green/black hold shape" },
      { name: "Chickpeas", note: "Canned is fine — rinse thoroughly before use" },
      { name: "Black beans", note: "Highest resistant starch of common legumes" },
      { name: "Barley", note: "Pearl or pot — outstanding beta-glucan content" },
      { name: "Quinoa", note: "Complete protein plus prebiotic fibre" },
    ],
  },
  {
    category: "Proteins & Healthy Fats",
    icon: "🥚",
    pillar: "Postbiotics",
    color: "var(--icon-teal)",
    items: [
      { name: "Eggs", note: "2 per serving, poached or soft-boiled preserves most nutrients" },
      { name: "Salmon / mackerel / sardines", note: "Oily fish 3× per week — DHA for brain and gut lining" },
      { name: "Mixed seeds", note: "Flax, chia, pumpkin — omega-3 and zinc sources" },
      { name: "Extra virgin olive oil", note: "Polyphenols in EVOO directly feed beneficial bacteria" },
    ],
  },
]

export interface DemoReportData {
  theme: {
    accent: string
    gradient: string
    label: string
    title: string
  }
  heroImage: string
  score: number
  profile: string
  tagline: string
  opening: string
  scoreInterpretation: string
  pillarScores: {
    name: string
    score: number
    color: string
    description: string
  }[]
  dailyImpact: {
    icon: string
    title: string
    body: string
  }[]
  scoreProjection: {
    projected: number
    timeline: string
    drivers: string[]
    note: string
  }
  strengths: { title: string; explanation: string }[]
  opportunities: { title: string; explanation: string }[]
  keyInsight: { trigger: string; explanation: string }
  pullQuote: string
  deepInsight: string
  sevenDayPlan: { day: string; action: string }[]
  foods: {
    emoji: string
    food: string
    why: string
    howTo: string
    pillars: string[]
    compound: string
    servingsPerWeek: number
    shopCategory: string
  }[]
  foodPairings: {
    food1: string
    food2: string
    emoji1: string
    emoji2: string
    reason: string
  }[]
  roadmap: { week: string; theme: string; focus: string; actions: string[] }[]
  closing: string
}

/* ─── Radar / Spider chart ─────────────────────────────────────────── */
function RadarChart({
  scores,
}: {
  scores: { name: string; score: number; color: string }[]
}) {
  const cx = 200
  const cy = 195
  const r = 138

  // Three vertices: top (Prebiotics), bottom-right (Probiotics), bottom-left (Postbiotics)
  const ANGLES = [
    -Math.PI / 2,
    -Math.PI / 2 + (2 * Math.PI) / 3,
    -Math.PI / 2 + (4 * Math.PI) / 3,
  ]

  function pt(i: number, scale: number) {
    return {
      x: cx + r * scale * Math.cos(ANGLES[i]),
      y: cy + r * scale * Math.sin(ANGLES[i]),
    }
  }

  function gridPoly(scale: number) {
    return [0, 1, 2]
      .map((i) => {
        const p = pt(i, scale)
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
      })
      .join(" ")
  }

  const scorePolygon = scores
    .map((s, i) => {
      const p = pt(i, s.score / 100)
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
    })
    .join(" ")

  // Label positions (outside full-radius vertices)
  const labelR = r + 32
  const labelPositions = ANGLES.map((a, i) => ({
    x: cx + labelR * Math.cos(a),
    y: cy + labelR * Math.sin(a),
    anchor: (i === 0 ? "middle" : i === 1 ? "start" : "end") as
      | "middle"
      | "start"
      | "end",
  }))

  return (
    <svg viewBox="0 0 400 390" className="w-full">
      {/* Grid triangles */}
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon
          key={s}
          points={gridPoly(s)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={s === 1 ? 1.5 : 1}
          strokeDasharray={s < 1 ? "4 4" : undefined}
        />
      ))}

      {/* Axis lines */}
      {[0, 1, 2].map((i) => {
        const v = pt(i, 1)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={v.x}
            y2={v.y}
            stroke="var(--border)"
            strokeWidth="1"
          />
        )
      })}

      {/* Score fill polygon */}
      <polygon
        points={scorePolygon}
        fill="var(--icon-green)"
        fillOpacity="0.15"
        stroke="var(--icon-green)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Score dots */}
      {scores.map((s, i) => {
        const p = pt(i, s.score / 100)
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="9" fill={s.color} fillOpacity="0.25" />
            <circle cx={p.x} cy={p.y} r="5.5" fill={s.color} />
            <circle cx={p.x} cy={p.y} r="2.5" fill="white" />
          </g>
        )
      })}

      {/* Axis labels */}
      {scores.map((s, i) => {
        const lp = labelPositions[i]
        const dy = i === 0 ? 0 : 5
        return (
          <g key={i}>
            <text
              x={lp.x}
              y={lp.y + dy}
              textAnchor={lp.anchor}
              fontSize="12"
              fontWeight="700"
              fill="currentColor"
              className="fill-foreground"
            >
              {s.name}
            </text>
            <text
              x={lp.x}
              y={lp.y + dy + 18}
              textAnchor={lp.anchor}
              fontSize="20"
              fontWeight="800"
              fill={s.color}
            >
              {s.score}
            </text>
          </g>
        )
      })}

      {/* Centre dot */}
      <circle cx={cx} cy={cy} r="3" fill="var(--muted-foreground)" fillOpacity="0.4" />
    </svg>
  )
}

/* ─── Stat callout ─────────────────────────────────────────────────── */
function StatCallout({
  stat,
  unit,
  headline,
  body,
}: {
  stat: string
  unit?: string
  headline: string
  body: string
}) {
  return (
    <div className="px-6 py-6">
      <div className="mx-auto max-w-[860px]">
        <div
          className="overflow-hidden rounded-3xl"
          style={{ background: "var(--foreground)" }}
        >
          <div className="flex flex-col gap-6 px-8 py-10 sm:flex-row sm:items-center sm:gap-10">
            <div className="shrink-0 text-center sm:text-left">
              <span className="font-serif text-7xl font-bold leading-none brand-gradient-text">
                {stat}
              </span>
              {unit && (
                <span className="ml-2 font-serif text-3xl font-bold text-white/60">
                  {unit}
                </span>
              )}
            </div>
            <div
              className="hidden h-16 w-px shrink-0 sm:block"
              style={{ background: "rgba(255,255,255,0.1)" }}
            />
            <div>
              <p className="font-serif text-xl font-semibold text-white">{headline}</p>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {body}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main component ────────────────────────────────────────────────── */
export function DemoReport({ data }: { data: DemoReportData }) {
  const ringR = 54
  const circumference = 2 * Math.PI * ringR

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">

      {/* ── DEMO BANNER ── */}
      <div
        className="rpt-banner sticky top-0 z-40 px-6 py-3 text-center text-sm font-medium text-white"
        style={{ background: "var(--icon-teal)" }}
      >
        📋 This is a sample report.{" "}
        <Link
          href="/assessment"
          className="underline underline-offset-2 hover:no-underline font-semibold"
        >
          Take the free assessment to get yours →
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── HERO — premium dark cover ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="rpt-hero" style={{ background: "var(--foreground)" }}>

        {/* Report identity bar */}
        <div
          className="border-b px-6 py-2.5"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 overflow-x-auto">
            <span
              className="shrink-0 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {data.theme.label}
            </span>
            <div className="flex shrink-0 items-center gap-6">
              {data.pillarScores.map((p) => (
                <span
                  key={p.name}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {p.name.substring(0, 3).toUpperCase()}
                  <span className="font-bold" style={{ color: p.color }}>
                    {p.score}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Hero grid */}
        <div className="mx-auto max-w-[1100px] px-6 py-14 md:py-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-center">

            {/* Left — score + text */}
            <div>
              <p
                className="mb-5 text-xs font-bold uppercase tracking-widest"
                style={{ color: data.theme.accent }}
              >
                EatoBiotics Gut Intelligence
              </p>
              <h1 className="font-serif text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                {data.theme.title}
              </h1>

              {/* Score ring + profile */}
              <div className="my-8 flex items-center gap-6">
                <div className="relative h-32 w-32 shrink-0">
                  <svg className="absolute inset-0" viewBox="0 0 128 128" fill="none">
                    <circle
                      cx="64" cy="64" r={ringR}
                      stroke="white" strokeWidth="9" strokeOpacity="0.1"
                    />
                    <circle
                      cx="64" cy="64" r={ringR}
                      stroke="url(#heroRingGrad)"
                      strokeWidth="9" fill="none" strokeLinecap="round"
                      strokeDasharray={`${circumference}`}
                      strokeDashoffset={`${circumference * (1 - data.score / 100)}`}
                      transform="rotate(-90 64 64)"
                    />
                    <defs>
                      <linearGradient id="heroRingGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--icon-lime)" />
                        <stop offset="50%" stopColor="var(--icon-green)" />
                        <stop offset="100%" stopColor="var(--icon-teal)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-serif text-4xl font-bold leading-none text-white">
                      {data.score}
                    </span>
                    <span className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                      /100
                    </span>
                  </div>
                </div>

                <div>
                  <p
                    className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                    style={{
                      background: `color-mix(in srgb, ${data.theme.accent} 18%, transparent)`,
                      color: data.theme.accent,
                    }}
                  >
                    {data.profile}
                  </p>
                  <p
                    className="mt-3 max-w-xs text-sm leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    {data.tagline}
                  </p>
                </div>
              </div>

              {/* Pillar mini bars */}
              <div className="max-w-sm space-y-3">
                {data.pillarScores.map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span
                      className="w-24 shrink-0 text-xs"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {p.name}
                    </span>
                    <div
                      className="flex-1 h-1.5 overflow-hidden rounded-full"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${p.score}%`, background: p.color }}
                      />
                    </div>
                    <span
                      className="w-7 text-right text-xs font-bold"
                      style={{ color: p.color }}
                    >
                      {p.score}
                    </span>
                  </div>
                ))}
              </div>

              {/* Opening paragraph */}
              <p
                className="mt-8 max-w-lg text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {data.opening}
              </p>
            </div>

            {/* Right — report cover card */}
            <div className="flex justify-center md:justify-end">
              <div className="relative w-full max-w-[300px]">
                {/* Outer glow */}
                <div
                  className="absolute -inset-8 rounded-[3rem]"
                  style={{
                    background: data.theme.gradient,
                    opacity: 0.18,
                    filter: "blur(28px)",
                  }}
                />
                {/* White card */}
                <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl">
                  {/* Card top accent */}
                  <div className="h-1.5 w-full" style={{ background: data.theme.gradient }} />
                  <div className="relative px-6 pb-6 pt-5">
                    {/* Soft circles inside card */}
                    <div
                      className="absolute top-0 right-0 h-48 w-48 rounded-full"
                      style={{
                        background: "var(--icon-lime)",
                        opacity: 0.07,
                        filter: "blur(28px)",
                        transform: "translate(25%,-25%)",
                      }}
                    />
                    <div
                      className="absolute bottom-0 left-0 h-36 w-36 rounded-full"
                      style={{
                        background: "var(--icon-teal)",
                        opacity: 0.07,
                        filter: "blur(22px)",
                        transform: "translate(-25%,25%)",
                      }}
                    />
                    <p
                      className="relative z-10 text-xs font-bold uppercase tracking-widest"
                      style={{ color: data.theme.accent }}
                    >
                      Sample Report
                    </p>
                    <div className="relative z-10 mt-3 aspect-square w-full">
                      <Image
                        src={data.heroImage}
                        alt={data.theme.title}
                        fill
                        className="object-contain"
                        sizes="300px"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── GUT PROFILE IDENTITY CARD ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {(() => {
        const tier = PROFILE_TIERS.find((t) => data.score >= t.min) ?? PROFILE_TIERS[PROFILE_TIERS.length - 1]
        const tierIdx = PROFILE_TIERS.indexOf(tier)
        const nextTier = tierIdx > 0 ? PROFILE_TIERS[tierIdx - 1] : null
        return (
          <section className="bg-background px-6 py-14">
            <div className="mx-auto max-w-[1000px]">
              <div className="overflow-hidden rounded-3xl border bg-background shadow-sm" style={{ borderTopWidth: "4px", borderTopColor: data.theme.accent }}>
                <div className="grid md:grid-cols-[260px_1fr]">

                  {/* Left — visual identity */}
                  <div
                    className="flex flex-col items-center justify-center gap-5 border-b border-border px-8 py-10 text-center md:border-b-0 md:border-r"
                    style={{ background: `color-mix(in srgb, ${data.theme.accent} 5%, white)` }}
                  >
                    {/* Mini score ring */}
                    <div className="relative h-24 w-24 shrink-0">
                      <svg className="absolute inset-0" viewBox="0 0 96 96" fill="none">
                        <circle cx="48" cy="48" r="38" stroke="var(--border)" strokeWidth="7" />
                        <circle
                          cx="48" cy="48" r="38"
                          stroke="url(#profileRing)"
                          strokeWidth="7" fill="none" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 38}`}
                          strokeDashoffset={`${2 * Math.PI * 38 * (1 - data.score / 100)}`}
                          transform="rotate(-90 48 48)"
                        />
                        <defs>
                          <linearGradient id="profileRing" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="var(--icon-lime)" />
                            <stop offset="100%" stopColor="var(--icon-teal)" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-serif text-3xl font-bold text-foreground">{data.score}</span>
                        <span className="text-[10px] text-muted-foreground">/100</span>
                      </div>
                    </div>

                    <div>
                      <p className="font-serif text-xl font-bold text-foreground">{data.profile}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-widest" style={{ color: data.theme.accent }}>
                        Your gut profile
                      </p>
                    </div>

                    {/* Tier progression bar */}
                    <div className="w-full">
                      <div className="mb-2 flex justify-between">
                        {PROFILE_TIERS.slice().reverse().map((t, i) => {
                          const isActive = t.label === tier.label
                          return (
                            <div
                              key={t.label}
                              className="flex h-2 flex-1 rounded-full mx-0.5 transition-all"
                              style={{
                                background: isActive
                                  ? data.theme.accent
                                  : i < PROFILE_TIERS.length - 1 - tierIdx
                                  ? `color-mix(in srgb, ${data.theme.accent} 25%, transparent)`
                                  : "var(--muted)",
                              }}
                            />
                          )
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
                        <span>Start</span>
                        <span style={{ color: data.theme.accent }} className="font-semibold">You</span>
                        <span>Optimal</span>
                      </div>
                    </div>
                  </div>

                  {/* Right — description + characteristics + next level */}
                  <div className="p-8">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                        style={{
                          background: `color-mix(in srgb, ${data.theme.accent} 14%, transparent)`,
                          color: data.theme.accent,
                        }}
                      >
                        {tier.label}
                      </span>
                    </div>
                    <p className="mt-3 text-base leading-relaxed text-foreground/80">{tier.description}</p>

                    <div className="mt-6 grid grid-cols-2 gap-2">
                      {tier.characteristics.map((c, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span
                            className="mt-0.5 h-4 w-4 shrink-0 rounded-full flex items-center justify-center"
                            style={{ background: `color-mix(in srgb, ${data.theme.accent} 14%, transparent)` }}
                          >
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <circle cx="4" cy="4" r="2.5" fill={data.theme.accent} />
                            </svg>
                          </span>
                          <span className="text-sm text-muted-foreground">{c}</span>
                        </div>
                      ))}
                    </div>

                    {nextTier && (
                      <div
                        className="mt-6 rounded-2xl border p-4"
                        style={{ borderColor: `color-mix(in srgb, ${data.theme.accent} 25%, transparent)` }}
                      >
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: data.theme.accent }}>
                          Next level — {nextTier.label}
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {nextTier.description} Your 30-day plan is designed to close the gap between where you are now and this next tier.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </section>
        )
      })()}

      <div className="section-divider" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── PILLAR SCORES + RADAR CHART ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="rpt-biotics bg-background px-6 py-16 md:py-20">
        <div className="mx-auto max-w-[1000px]">
          <div className="mb-12 text-center">
            <SectionLabel label="Your Three Biotics" accent={data.theme.accent} centered />
            <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
              Prebiotics · Probiotics · Postbiotics
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground">
              The three biological pillars of your gut food system — each scored independently.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start">
            {/* Radar chart */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-sm">
                <RadarChart scores={data.pillarScores} />
              </div>
            </div>

            {/* Pillar detail cards */}
            <div className="space-y-4">
              {data.pillarScores.map((p) => {
                const verdict =
                  p.score >= 70
                    ? "Strong"
                    : p.score >= 50
                    ? "Developing"
                    : "Your gap"
                const verdictColor =
                  p.score >= 70
                    ? "var(--icon-green)"
                    : p.score >= 50
                    ? "var(--icon-yellow)"
                    : "var(--icon-orange)"
                return (
                  <div
                    key={p.name}
                    className="flex gap-4 rounded-2xl border bg-background p-5 shadow-sm"
                    style={{ borderLeftWidth: "4px", borderLeftColor: p.color }}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                      style={{
                        background: `color-mix(in srgb, ${p.color} 12%, transparent)`,
                      }}
                    >
                      {PILLAR_ICONS[p.name] ?? "🔬"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          {p.name}
                        </p>
                        <span className="flex items-center gap-2">
                          <span
                            className="font-serif text-2xl font-bold"
                            style={{ color: p.color }}
                          >
                            {p.score}
                          </span>
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                            style={{
                              background: `color-mix(in srgb, ${verdictColor} 12%, transparent)`,
                              color: verdictColor,
                            }}
                          >
                            {verdict}
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${p.score}%`, background: p.color }}
                        />
                      </div>
                      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── PATTERN + DAILY IMPACT ── */}
      <div className="mx-auto max-w-[860px] space-y-20 px-6 py-16">

        <section>
          <SectionLabel label="Your Pattern" accent={data.theme.accent} />
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground sm:text-3xl">
            What your score means
          </h2>
          <div
            className="rounded-2xl border bg-background p-6"
            style={{ borderLeftWidth: "4px", borderLeftColor: "var(--icon-teal)" }}
          >
            <p className="text-base leading-relaxed text-foreground/80">
              {data.scoreInterpretation}
            </p>
          </div>
        </section>

        <section>
          <SectionLabel label="Daily Life" accent={data.theme.accent} />
          <h2 className="mb-2 font-serif text-2xl font-bold text-foreground sm:text-3xl">
            What this means for you every day
          </h2>
          <p className="mb-8 text-base text-muted-foreground">
            Your scores translate directly into how you feel, function, and recover — day to day.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {data.dailyImpact.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border bg-background p-5"
                style={{ borderTopWidth: "3px", borderTopColor: data.theme.accent }}
              >
                <div className="mb-3 text-3xl">{item.icon}</div>
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SYMPTOM CONNECTION MAP ── */}
        <section>
          <SectionLabel label="Symptom Map" accent={data.theme.accent} />
          <h2 className="mb-2 font-serif text-2xl font-bold text-foreground sm:text-3xl">
            How your scores connect to how you feel
          </h2>
          <p className="mb-8 text-base text-muted-foreground">
            Each symptom below is directly linked to one or more of your pillar scores. Highlighted symptoms are most likely affecting you based on your results.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SYMPTOMS.map((symptom) => {
              const worstConnected = symptom.pillars
                .map((pName) => data.pillarScores.find((p) => p.name === pName))
                .filter(Boolean)
                .map((p) => p!.score)
              const minScore = Math.min(...worstConnected)
              const isLikely = minScore < 60
              const isPossible = !isLikely && minScore < 70
              const statusLabel = isLikely ? "Likely affecting you" : isPossible ? "Possibly affecting you" : "Low risk"
              const statusColor = isLikely ? "var(--icon-orange)" : isPossible ? "var(--icon-yellow)" : "var(--icon-green)"
              return (
                <div
                  key={symptom.name}
                  className="rounded-2xl border bg-background p-4"
                  style={isLikely ? { borderLeftWidth: "3px", borderLeftColor: "var(--icon-orange)" } : {}}
                >
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{symptom.emoji}</span>
                      <p className="font-semibold text-foreground text-sm">{symptom.name}</p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        background: `color-mix(in srgb, ${statusColor} 14%, transparent)`,
                        color: statusColor,
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{symptom.detail}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Via</span>
                    {symptom.pillars.map((pName) => {
                      const pillar = data.pillarScores.find((p) => p.name === pName)
                      return (
                        <span
                          key={pName}
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            background: pillar ? `color-mix(in srgb, ${pillar.color} 14%, transparent)` : "var(--muted)",
                            color: pillar?.color ?? "var(--muted-foreground)",
                          }}
                        >
                          {pName.substring(0, 3)} {pillar?.score}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

      </div>

      {/* ── STAT CALLOUT #1 ── */}
      <StatCallout
        stat="90%"
        headline="of your serotonin is produced in your gut — not your brain"
        body="The bacteria in your gut synthesise the neurotransmitters that regulate your mood, sleep quality, and mental clarity. Your Probiotics score is the single strongest dietary lever for this production."
      />

      {/* ── SCORE PROJECTION ── */}
      <section className="bg-background px-6 py-16">
        <div className="mx-auto max-w-[860px]">
          <div className="rounded-3xl border bg-background p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: `color-mix(in srgb, ${data.theme.accent} 14%, transparent)`,
                }}
              >
                <TrendingUp size={20} style={{ color: data.theme.accent }} />
              </div>
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: data.theme.accent }}
                >
                  Your Projection
                </p>
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Where you could be in {data.scoreProjection.timeline}
                </h2>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-5 flex items-end justify-between">
                <div className="text-center">
                  <div className="font-serif text-4xl font-bold text-muted-foreground">
                    {data.score}
                  </div>
                  <div className="text-xs text-muted-foreground">Today</div>
                </div>
                <div
                  className="mx-4 mb-4 flex-1 border-b-2 border-dashed"
                  style={{ borderColor: data.theme.accent }}
                />
                <div className="text-center">
                  <div
                    className="font-serif text-4xl font-bold"
                    style={{ color: data.theme.accent }}
                  >
                    {data.scoreProjection.projected}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {data.scoreProjection.timeline}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Current</span>
                    <span>{data.score}/100</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${data.score}%`, background: "var(--border)" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Projected</span>
                    <span>{data.scoreProjection.projected}/100</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${data.scoreProjection.projected}%`,
                        background: data.theme.gradient,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="mb-5 text-sm italic text-muted-foreground">
              {data.scoreProjection.note}
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {data.scoreProjection.drivers.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl border p-3"
                  style={{
                    borderColor: `color-mix(in srgb, ${data.theme.accent} 30%, transparent)`,
                  }}
                >
                  <Check size={13} style={{ color: data.theme.accent }} strokeWidth={3} />
                  <span className="text-xs font-medium text-foreground">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── STRENGTHS + OPPORTUNITIES ── */}
      <div className="mx-auto max-w-[860px] space-y-20 px-6 py-16">

        <section>
          <SectionLabel label="Where You Stand" accent={data.theme.accent} />
          <h2 className="mb-2 font-serif text-2xl font-bold text-foreground sm:text-3xl">
            Strengths &amp; opportunities
          </h2>
          <p className="mb-8 text-base text-muted-foreground">
            Your three biggest strengths, and the three areas with the most growth potential.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              {data.strengths.map((s) => (
                <div
                  key={s.title}
                  className="rounded-2xl border bg-background p-5"
                  style={{ borderTopWidth: "3px", borderTopColor: "var(--icon-green)" }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: "color-mix(in srgb, var(--icon-green) 15%, transparent)",
                      }}
                    >
                      <Check
                        size={11}
                        style={{ color: "var(--icon-green)" }}
                        strokeWidth={3}
                      />
                    </div>
                    <span
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: "var(--icon-green)" }}
                    >
                      Strength
                    </span>
                  </div>
                  <p className="font-semibold text-foreground">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {s.explanation}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {data.opportunities.map((o) => (
                <div
                  key={o.title}
                  className="rounded-2xl border bg-background p-5"
                  style={{ borderTopWidth: "3px", borderTopColor: "var(--icon-orange)" }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background:
                          "color-mix(in srgb, var(--icon-orange) 15%, transparent)",
                      }}
                    >
                      <ArrowRight
                        size={11}
                        style={{ color: "var(--icon-orange)" }}
                        strokeWidth={3}
                      />
                    </div>
                    <span
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: "var(--icon-orange)" }}
                    >
                      Opportunity
                    </span>
                  </div>
                  <p className="font-semibold text-foreground">{o.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {o.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── KEY INSIGHT ── */}
        <section>
          <SectionLabel label="Your Key Insight" accent={data.theme.accent} />
          <h2 className="mb-6 font-serif text-2xl font-bold text-foreground sm:text-3xl">
            The single biggest discovery
          </h2>
          <div
            className="rounded-2xl border bg-background p-6"
            style={{ borderLeftWidth: "4px", borderLeftColor: data.theme.accent }}
          >
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              🔍 Key Finding
            </p>
            <blockquote className="my-3 font-serif text-xl font-semibold leading-snug text-foreground">
              &ldquo;{data.keyInsight.trigger}&rdquo;
            </blockquote>
            <p className="text-base leading-relaxed text-foreground/80">
              {data.keyInsight.explanation}
            </p>
          </div>
        </section>

      </div>

      {/* ── PULL QUOTE — dark band ── */}
      <section className="rpt-quote px-6 py-16" style={{ background: "var(--foreground)" }}>
        <div className="mx-auto max-w-[860px] text-center">
          <div className="mx-auto mb-6 font-serif text-6xl leading-none text-white opacity-20">
            &ldquo;
          </div>
          <blockquote className="font-serif text-xl font-semibold leading-relaxed text-white sm:text-2xl">
            {data.pullQuote}
          </blockquote>
          <div className="mt-6 flex justify-center">
            <div
              className="h-0.5 w-16 rounded-full"
              style={{ background: data.theme.accent }}
            />
          </div>
          <p className="mt-4 text-sm font-medium" style={{ color: data.theme.accent }}>
            EatoBiotics Research
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── DEEP INSIGHT ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-[900px] px-6 py-16">
        <div className="mb-10 text-center">
          <SectionLabel label="Deep Insight" accent={data.theme.accent} centered />
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            Your food system in full
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground">
            A complete picture of how your three scores interact — and what that means for your biology.
          </p>
        </div>

        {/* Gut system flow diagram */}
        <div className="mb-12">
          <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
            How your three systems connect
          </p>
          <div className="flex items-stretch gap-3">
            {data.pillarScores.map((p, i) => {
              const roles: Record<string, string> = {
                Prebiotics: "Feeds the bacteria",
                Probiotics: "Produces compounds",
                Postbiotics: "Protects the lining",
              }
              const verdict = p.score >= 70 ? "Strong" : p.score >= 50 ? "Developing" : "Your gap"
              const verdictColor = p.score >= 70 ? "var(--icon-green)" : p.score >= 50 ? "var(--icon-yellow)" : "var(--icon-orange)"
              return (
                <div key={p.name} className="flex flex-1 items-stretch">
                  <div
                    className="flex flex-1 flex-col items-center gap-2 rounded-2xl border bg-background p-4 text-center shadow-sm"
                    style={{ borderTopWidth: 4, borderTopColor: p.color }}
                  >
                    <span className="text-3xl">{PILLAR_ICONS[p.name] ?? "🔬"}</span>
                    <span
                      className="font-serif text-3xl font-bold leading-none"
                      style={{ color: p.color }}
                    >
                      {p.score}
                    </span>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {p.name}
                    </p>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{
                        background: `color-mix(in srgb, ${verdictColor} 12%, transparent)`,
                        color: verdictColor,
                      }}
                    >
                      {verdict}
                    </span>
                    <p className="text-xs leading-snug text-muted-foreground">
                      {roles[p.name] ?? ""}
                    </p>
                  </div>
                  {i < 2 && (
                    <div className="flex shrink-0 items-center px-1 text-muted-foreground">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Deep insight text */}
        <div className="mb-12 space-y-5">
          {data.deepInsight.split("\n\n").map((para, i) => (
            <p key={i} className="text-base leading-relaxed text-foreground/80">
              {para}
            </p>
          ))}
        </div>

        {/* 3 Mechanism cards */}
        <div className="mb-12">
          <p className="mb-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            The biology behind your scores
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Card 1 — The vagus nerve */}
            <div
              className="rounded-2xl border bg-background p-5"
              style={{ borderTopWidth: "3px", borderTopColor: "var(--icon-teal)" }}
            >
              <div className="mb-3 text-2xl">🧠</div>
              <p className="mb-2 font-serif text-base font-bold text-foreground">
                The Gut–Brain Highway
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The vagus nerve carries{" "}
                <strong className="text-foreground">80% of signals upward</strong> — from gut to
                brain, not the other way. The quality of your microbiome determines the quality of
                those signals.
              </p>
            </div>
            {/* Card 2 — Microbiome scale */}
            <div
              className="rounded-2xl border bg-background p-5"
              style={{ borderTopWidth: "3px", borderTopColor: "var(--icon-green)" }}
            >
              <div className="mb-3 text-2xl">🦠</div>
              <p className="mb-2 font-serif text-base font-bold text-foreground">
                Your Microbiome by Numbers
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <strong className="text-foreground">100 trillion bacteria</strong> live in your
                gut — more than the cells in your entire body. Diversity is the single most
                important metric for long-term health.
              </p>
            </div>
            {/* Card 3 — Your specific gap */}
            {(() => {
              const lowest = [...data.pillarScores].sort((a, b) => a.score - b.score)[0]
              return (
                <div
                  className="rounded-2xl border bg-background p-5"
                  style={{ borderTopWidth: "3px", borderTopColor: "var(--icon-orange)" }}
                >
                  <div className="mb-3 text-2xl">🔬</div>
                  <p className="mb-2 font-serif text-base font-bold text-foreground">
                    Why Your {lowest.name} Gap Matters
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    At {lowest.score}, this is your most correctable score — and the one that
                    creates a bottleneck for everything else. Targeted dietary change here produces
                    the highest return across all three pillars.
                  </p>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Change timeline */}
        <div
          className="overflow-hidden rounded-3xl border bg-background"
          style={{ borderTopWidth: "4px", borderTopColor: data.theme.accent }}
        >
          <div className="px-6 pt-6 pb-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: data.theme.accent }}>
              What you&apos;ll notice and when
            </p>
            <h3 className="mt-1 font-serif text-xl font-bold text-foreground">
              Your change timeline
            </h3>
          </div>
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              {
                period: "Days 1–7",
                icon: "⚡",
                title: "First effects",
                color: "var(--icon-lime)",
                points: [
                  "Digestive rhythm begins to improve",
                  "Reduced bloating after meals",
                  "Slightly better energy on waking",
                ],
              },
              {
                period: "Weeks 2–4",
                icon: "🌱",
                title: "Microbiome shift",
                color: "var(--icon-green)",
                points: [
                  "Measurable bacterial diversity increase",
                  "Energy levels stabilise across the day",
                  "Fewer cravings for ultra-processed foods",
                ],
              },
              {
                period: "Month 2+",
                icon: "🧠",
                title: "Brain-gut recalibration",
                color: "var(--icon-teal)",
                points: [
                  "Mood baseline shifts noticeably",
                  "Sleep depth and onset improves",
                  "Sharper focus and mental clarity",
                ],
              },
            ].map((stage) => (
              <div key={stage.period} className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-xl">{stage.icon}</span>
                  <div>
                    <p
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: stage.color }}
                    >
                      {stage.period}
                    </p>
                    <p className="font-semibold text-foreground">{stage.title}</p>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {stage.points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: stage.color }}
                      />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-divider" />

      {/* ── 7-DAY PLAN ── */}
      <section className="rpt-plan bg-background px-6 py-16">
        <div className="mx-auto max-w-[860px]">
          <SectionLabel label="Your Starter Plan" accent={data.theme.accent} />
          <h2 className="mb-2 font-serif text-2xl font-bold text-foreground sm:text-3xl">
            7-day action plan
          </h2>
          <p className="mb-8 text-base text-muted-foreground">
            One focused action for each day of your first week. Simple, specific, achievable.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.sevenDayPlan.map((item, i) => (
              <div
                key={item.day}
                className="flex flex-col gap-3 rounded-2xl border bg-background p-5 shadow-sm"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
                  style={{ background: DAY_COLORS[i % DAY_COLORS.length] }}
                >
                  {i + 1}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {item.day}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-foreground">{item.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STAT CALLOUT #2 ── */}
      <StatCallout
        stat="30"
        unit="days"
        headline="for targeted diet changes to measurably shift your microbiome"
        body="Clinical research consistently shows measurable changes in gut bacterial diversity within 3–4 weeks of applying targeted dietary changes. Your plan below is built precisely around this window."
      />

      <div className="section-divider" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── 30-DAY ROADMAP — 4-column visual grid ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="rpt-roadmap bg-background px-6 py-16">
        <div className="mx-auto max-w-[1000px]">
          <SectionLabel label="30-Day Roadmap" accent={data.theme.accent} />
          <h2 className="mb-2 font-serif text-2xl font-bold text-foreground sm:text-3xl rpt-roadmap-heading">
            Your month of change
          </h2>
          <p className="mb-10 text-base text-muted-foreground">
            Four themed weeks, each building on the last. Every action is specific and achievable.
          </p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data.roadmap.map((week, i) => (
              <div
                key={week.week}
                className="rpt-week-card overflow-hidden rounded-3xl border bg-background shadow-sm"
              >
                {/* Week header */}
                <div
                  className="px-5 pt-5 pb-4"
                  style={{ borderTopWidth: "4px", borderTopColor: WEEK_COLORS[i] }}
                >
                  <div
                    className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: WEEK_COLORS[i] }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {week.week}
                  </p>
                  <p className="mt-1 font-serif text-base font-bold leading-snug text-foreground">
                    {week.theme}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">{week.focus}</p>
                </div>

                {/* Actions list */}
                <div className="border-t border-border px-5 pb-5 pt-4">
                  <ul className="space-y-2.5">
                    {week.actions.map((action, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white"
                          style={{
                            background: WEEK_COLORS[i],
                            fontSize: "9px",
                            fontWeight: "bold",
                          }}
                        >
                          {j + 1}
                        </span>
                        <span className="text-xs leading-snug text-foreground/80">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── FOOD PRESCRIPTION — enhanced magazine layout ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="rpt-foods bg-background px-6 py-16">
        <div className="mx-auto max-w-[900px]">
          <SectionLabel label="Food Prescription" accent={data.theme.accent} />
          <h2 className="mb-2 font-serif text-2xl font-bold text-foreground sm:text-3xl rpt-foods-heading">
            5 foods chosen specifically for you
          </h2>
          <p className="mb-8 text-base text-muted-foreground">
            Based on your pillar scores, these five foods will have the highest impact on your gut system. Each one is chosen for a specific biological reason — not general health advice.
          </p>

          {/* At-a-glance quick strip */}
          <div className="mb-8 overflow-hidden rounded-2xl border bg-background shadow-sm">
            <div
              className="px-5 py-3 text-xs font-bold uppercase tracking-widest"
              style={{ background: `color-mix(in srgb, ${data.theme.accent} 8%, transparent)`, color: data.theme.accent }}
            >
              Your 5 foods at a glance
            </div>
            <div className="grid grid-cols-5 divide-x divide-border">
              {data.foods.map((food) => (
                <div key={food.food} className="flex flex-col items-center gap-1.5 px-2 py-4 text-center">
                  <span className="text-3xl">{food.emoji}</span>
                  <p className="text-xs font-semibold leading-tight text-foreground">{food.food}</p>
                  <p className="text-xs text-muted-foreground">{food.servingsPerWeek}×/wk</p>
                </div>
              ))}
            </div>
          </div>

          {/* Full food cards */}
          <div className="space-y-5">
            {data.foods.map((food, idx) => {
              const PILLAR_COLORS_MAP: Record<string, string> = {
                Prebiotics: "var(--icon-green)",
                Probiotics: "var(--icon-orange)",
                Postbiotics: "var(--icon-teal)",
              }
              return (
                <div
                  key={food.food}
                  className="rpt-food-card overflow-hidden rounded-2xl border bg-background shadow-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
                    {/* Left — identity panel */}
                    <div
                      className="flex flex-col items-center justify-center gap-3 px-6 py-7 text-center border-b border-border md:border-b-0 md:border-r"
                      style={{ background: `color-mix(in srgb, ${data.theme.accent} 6%, transparent)` }}
                    >
                      <span className="text-5xl">{food.emoji}</span>
                      <p className="font-serif text-base font-bold leading-snug text-foreground">
                        {food.food}
                      </p>
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{
                          background: `color-mix(in srgb, ${data.theme.accent} 14%, transparent)`,
                          color: data.theme.accent,
                        }}
                      >
                        #{idx + 1} priority food
                      </span>

                      {/* Pillar impact dots */}
                      <div className="w-full space-y-1.5 pt-1">
                        <p className="text-xs text-muted-foreground">Pillars boosted</p>
                        <div className="flex justify-center gap-1.5">
                          {["Prebiotics", "Probiotics", "Postbiotics"].map((pillar) => {
                            const active = food.pillars.includes(pillar)
                            const color = PILLAR_COLORS_MAP[pillar]
                            return (
                              <span
                                key={pillar}
                                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                style={
                                  active
                                    ? { background: `color-mix(in srgb, ${color} 18%, transparent)`, color }
                                    : { background: "var(--muted)", color: "var(--muted-foreground)", opacity: 0.5 }
                                }
                              >
                                {pillar.substring(0, 3)}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      {/* Weekly serving target */}
                      <div className="w-full space-y-1">
                        <p className="text-xs text-muted-foreground">Weekly target</p>
                        <div className="flex justify-center gap-1">
                          {Array.from({ length: 7 }, (_, i) => (
                            <div
                              key={i}
                              className="h-2 w-2 rounded-full"
                              style={{
                                background:
                                  i < food.servingsPerWeek
                                    ? data.theme.accent
                                    : "var(--muted)",
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-semibold" style={{ color: data.theme.accent }}>
                          {food.servingsPerWeek}× per week
                        </p>
                      </div>
                    </div>

                    {/* Right — detail panel */}
                    <div className="p-6">
                      {/* Key compound badge */}
                      <div className="mb-4 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5"
                        style={{ borderColor: `color-mix(in srgb, ${data.theme.accent} 25%, transparent)` }}>
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Key compound
                        </span>
                        <span className="text-xs font-bold" style={{ color: data.theme.accent }}>
                          {food.compound}
                        </span>
                      </div>

                      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                        {food.why}
                      </p>
                      <div
                        className="rounded-xl border p-3.5 text-sm leading-relaxed"
                        style={{ borderColor: `color-mix(in srgb, var(--icon-green) 25%, transparent)` }}
                      >
                        <span className="font-semibold" style={{ color: "var(--icon-teal)" }}>
                          How to use:{" "}
                        </span>
                        <span className="text-foreground/80">{food.howTo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Shopping List ── */}
          {(() => {
            // Match prescribed foods against the universal list
            const prescribedNames = data.foods.map((f) => f.food.toLowerCase())
            function isPrescribed(itemName: string) {
              const lower = itemName.toLowerCase()
              return prescribedNames.some(
                (p) => lower.includes(p.split(" ")[0]) || p.includes(lower.split(" ")[0])
              )
            }
            function getPrescribed(itemName: string) {
              const lower = itemName.toLowerCase()
              return data.foods.find(
                (f) => lower.includes(f.food.toLowerCase().split(" ")[0]) || f.food.toLowerCase().includes(lower.split(" ")[0])
              )
            }
            const totalItems = IDEAL_SHOPPING_LIST.reduce((n, c) => n + c.items.length, 0)
            return (
              <div className="mt-10">
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-0.5 w-8 rounded-full" style={{ background: data.theme.accent }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: data.theme.accent }}>
                    Your Complete Weekly Shopping List
                  </p>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">
                  A full gut health shopping guide — your 5 priority picks are highlighted within it. Built around all three biotics, designed to be your standing weekly list.
                </p>

                <div className="overflow-hidden rounded-3xl border bg-background shadow-sm">

                  {/* Header */}
                  <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ background: `color-mix(in srgb, ${data.theme.accent} 7%, transparent)`, borderBottom: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🛒</span>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Weekly Gut Health Shop</p>
                        <p className="text-xs text-muted-foreground">{totalItems} items across {IDEAL_SHOPPING_LIST.length} categories</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: `color-mix(in srgb, ${data.theme.accent} 15%, transparent)`, color: data.theme.accent }}
                      >
                        ⭐ {data.foods.length} priority picks
                      </span>
                    </div>
                  </div>

                  {/* Priority strip */}
                  <div className="border-b border-border px-6 py-4" style={{ background: `color-mix(in srgb, ${data.theme.accent} 4%, transparent)` }}>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: data.theme.accent }}>
                      ⭐ Your priority picks from this report
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.foods.map((food) => (
                        <div
                          key={food.food}
                          className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                          style={{
                            borderColor: `color-mix(in srgb, ${data.theme.accent} 35%, transparent)`,
                            background: `color-mix(in srgb, ${data.theme.accent} 8%, transparent)`,
                            color: "var(--foreground)",
                          }}
                        >
                          <span>{food.emoji}</span>
                          <span>{food.food}</span>
                          <span className="font-normal opacity-60">{food.servingsPerWeek}×/wk</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Full list by category */}
                  <div className="divide-y divide-border">
                    {IDEAL_SHOPPING_LIST.map((cat) => (
                      <div key={cat.category}>
                        {/* Category header */}
                        <div
                          className="flex items-center justify-between px-6 py-3"
                          style={{ background: `color-mix(in srgb, ${cat.color} 5%, transparent)` }}
                        >
                          <div className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: cat.color }}>
                              {cat.category}
                            </p>
                          </div>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: `color-mix(in srgb, ${cat.color} 12%, transparent)`, color: cat.color }}
                          >
                            {cat.pillar}
                          </span>
                        </div>
                        {/* Items */}
                        <div className="divide-y divide-border/50 px-6">
                          {cat.items.map((item) => {
                            const prescribed = getPrescribed(item.name)
                            const priority = isPrescribed(item.name)
                            return (
                              <div
                                key={item.name}
                                className="flex items-start gap-3 py-3"
                                style={priority ? { background: `color-mix(in srgb, ${data.theme.accent} 4%, transparent)`, margin: "0 -24px", padding: "12px 24px" } : {}}
                              >
                                {/* Checkbox */}
                                <div
                                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center"
                                  style={{
                                    borderColor: priority
                                      ? data.theme.accent
                                      : `color-mix(in srgb, var(--border) 80%, transparent)`,
                                  }}
                                >
                                  {priority && (
                                    <div className="h-2 w-2 rounded-sm" style={{ background: data.theme.accent }} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className={`text-sm ${priority ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                                      {priority && prescribed && <span className="mr-1">{prescribed.emoji}</span>}
                                      {item.name}
                                    </span>
                                    {priority && (
                                      <span
                                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                                        style={{
                                          background: `color-mix(in srgb, ${data.theme.accent} 14%, transparent)`,
                                          color: data.theme.accent,
                                        }}
                                      >
                                        ⭐ Priority
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.note}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Account evolution teaser */}
                  <div
                    className="border-t border-border px-6 py-5"
                    style={{ background: "var(--foreground)" }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-xl">🔄</span>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">This list evolves in your account</p>
                        <p className="mt-1 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                          Once you have an account, your shopping list updates automatically — rotating with the seasons for peak nutrition, adding new foods as your gut score improves, and adjusting quantities for your household size.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[
                            { icon: "🌿", label: "Seasonal rotation" },
                            { icon: "📈", label: "Score-based progression" },
                            { icon: "👨‍👩‍👧", label: "Household sizing" },
                            { icon: "📋", label: "Weekly meal prep guide" },
                          ].map((feature) => (
                            <span
                              key={feature.label}
                              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                            >
                              {feature.icon} {feature.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )
          })()}

          {/* Power pairings */}
          {data.foodPairings && data.foodPairings.length > 0 && (
            <div className="mt-10">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-0.5 w-8 rounded-full" style={{ background: data.theme.accent }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: data.theme.accent }}>
                  Power Combinations
                </p>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                These food pairings produce significantly greater benefits than each food alone — a concept known as synbiotics.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.foodPairings.map((pair, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border bg-background p-5 shadow-sm"
                    style={{ borderLeftWidth: "4px", borderLeftColor: data.theme.accent }}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-2xl">{pair.emoji1}</span>
                        <span className="text-muted-foreground">+</span>
                        <span className="text-2xl">{pair.emoji2}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {pair.food1} + {pair.food2}
                        </p>
                        <p className="text-xs text-muted-foreground">Synbiotic pairing</p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{pair.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="section-divider" />

      {/* ── CLOSING + CTA ── */}
      <section className="rpt-final bg-background px-6 py-16">
        <div className="mx-auto max-w-[900px]">

          <SectionLabel label="Final Thoughts" accent={data.theme.accent} centered />
          <h2 className="mb-3 text-center font-serif text-3xl font-bold text-foreground sm:text-4xl">
            Where you go from here
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-base text-muted-foreground">
            A complete picture of what this report has shown you — and what to do next.
          </p>

          {/* ── Score recap banner ── */}
          <div
            className="mb-10 overflow-hidden rounded-3xl border bg-background shadow-sm"
            style={{ borderTopWidth: "4px", borderTopColor: data.theme.accent }}
          >
            <div className="px-8 py-8 md:px-12 md:py-10">
              <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Your report at a glance
              </p>
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-stretch md:justify-between">
                {/* Current score */}
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Starting score
                  </p>
                  <span className="font-serif text-6xl font-bold text-foreground">{data.score}</span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold uppercase"
                    style={{
                      background: `color-mix(in srgb, ${data.theme.accent} 14%, transparent)`,
                      color: data.theme.accent,
                    }}
                  >
                    {data.profile}
                  </span>
                </div>
                {/* Progress bars */}
                <div className="flex flex-col items-center justify-center gap-3 flex-1 px-4">
                  <div className="w-full space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">Now</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${data.score}%`, background: "var(--border)" }}
                        />
                      </div>
                      <span className="w-8 text-xs font-bold text-muted-foreground">{data.score}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">30 days</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${data.scoreProjection.projected}%`, background: data.theme.gradient }}
                        />
                      </div>
                      <span className="w-8 text-xs font-bold" style={{ color: data.theme.accent }}>{data.scoreProjection.projected}</span>
                    </div>
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    +{data.scoreProjection.projected - data.score} point potential gain
                  </p>
                </div>
                {/* Projected score */}
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Projected score
                  </p>
                  <span className="font-serif text-6xl font-bold brand-gradient-text">
                    {data.scoreProjection.projected}
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: `color-mix(in srgb, ${data.theme.accent} 10%, transparent)`,
                      color: data.theme.accent,
                    }}
                  >
                    After 30 days
                  </span>
                </div>
              </div>

              {/* Pillar summary row */}
              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border pt-6">
                {data.pillarScores.map((p) => (
                  <div key={p.name} className="text-center">
                    <span className="text-xl">{PILLAR_ICONS[p.name] ?? "🔬"}</span>
                    <p className="mt-1 text-xs font-bold" style={{ color: p.color }}>{p.name}</p>
                    <p className="font-serif text-2xl font-bold text-foreground">{p.score}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.score >= 70 ? "Strong" : p.score >= 50 ? "Developing" : "Priority gap"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Key takeaways ── */}
          <div className="mb-10">
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              The three things this report has shown you
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {data.pillarScores.map((p, i) => {
                const takeawayIcons = ["🌿", "🦠", "✨"]
                const verdictColor = p.score >= 70 ? "var(--icon-green)" : p.score >= 50 ? "var(--icon-yellow)" : "var(--icon-orange)"
                const takeaway =
                  p.score >= 70
                    ? `Your ${p.name} score of ${p.score} is a genuine strength — protect and build on it.`
                    : p.score >= 50
                    ? `Your ${p.name} score of ${p.score} is developing — consistency here will compound quickly.`
                    : `Your ${p.name} score of ${p.score} is your biggest opportunity — this is where your effort should focus first.`
                return (
                  <div
                    key={p.name}
                    className="rounded-2xl border bg-background p-5"
                    style={{ borderTopWidth: "3px", borderTopColor: p.color }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-base"
                        style={{ background: `color-mix(in srgb, ${p.color} 14%, transparent)` }}
                      >
                        {takeawayIcons[i]}
                      </span>
                      <span className="font-serif text-xl font-bold" style={{ color: verdictColor }}>
                        {p.score}
                      </span>
                    </div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {p.name}
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/80">{takeaway}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Closing paragraph ── */}
          <div
            className="mb-10 rounded-2xl border bg-background p-7"
            style={{ borderLeftWidth: "4px", borderLeftColor: data.theme.accent }}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: data.theme.accent }}>
              Our assessment
            </p>
            <p className="text-base leading-relaxed text-foreground/80">{data.closing}</p>
          </div>

          {/* ── Your three commitments ── */}
          <div className="mb-10">
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Your three commitments starting today
            </p>
            <div className="space-y-3">
              {[
                {
                  number: "01",
                  label: "Start with one change",
                  detail: `Pick the single highest-impact action from your 7-day plan and do it today. Don't wait for the perfect moment — one action builds the habit loop that makes the rest easier.`,
                  color: data.theme.accent,
                },
                {
                  number: "02",
                  label: "Stay consistent for 30 days",
                  detail: `The gut microbiome doesn't respond to occasional efforts. Consistency across 30 days is what produces the measurable shift your projection is based on. Small daily additions beat occasional big efforts every time.`,
                  color: "var(--icon-teal)",
                },
                {
                  number: "03",
                  label: "Retest after 30 days",
                  detail: `Your score is a baseline, not a verdict. Retaking the assessment after applying this plan gives you a real measurement of what changed — and a new starting point to build from.`,
                  color: "var(--icon-green)",
                },
              ].map((c) => (
                <div
                  key={c.number}
                  className="flex items-start gap-5 rounded-2xl border bg-background p-5 shadow-sm"
                >
                  <span
                    className="shrink-0 font-serif text-3xl font-bold leading-none"
                    style={{ color: `color-mix(in srgb, ${c.color} 35%, transparent)` }}
                  >
                    {c.number}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{c.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Retest reminder ── */}
          <div
            className="mb-12 overflow-hidden rounded-2xl border"
            style={{ borderColor: `color-mix(in srgb, var(--icon-teal) 30%, transparent)` }}
          >
            <div className="flex items-stretch">
              <div
                className="flex w-20 shrink-0 flex-col items-center justify-center gap-1 py-6 text-center"
                style={{ background: `color-mix(in srgb, var(--icon-teal) 10%, transparent)` }}
              >
                <span className="text-2xl">📅</span>
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--icon-teal)" }}
                >
                  Day 30
                </p>
              </div>
              <div className="flex-1 border-l px-6 py-5" style={{ borderColor: `color-mix(in srgb, var(--icon-teal) 20%, transparent)` }}>
                <p className="font-semibold text-foreground">Mark your retest date</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Set a reminder for 30 days from today. Gut microbiome composition can shift measurably in 3–4 weeks with consistent dietary changes. Your retake will show you exactly what moved — and where to focus next.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Energy", "Sleep", "Digestion", "Mood", "Focus"].map((metric) => (
                    <span
                      key={metric}
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        background: `color-mix(in srgb, var(--icon-teal) 10%, transparent)`,
                        color: "var(--icon-teal)",
                      }}
                    >
                      {metric}
                    </span>
                  ))}
                  <span className="text-xs text-muted-foreground self-center">— track these daily</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Email Report ── */}
      <ReportActions data={data} />

      {/* ── CTA ── */}
      <div className="px-6 pb-16">
        <div className="mx-auto max-w-[900px]">
          <div className="brand-gradient overflow-hidden rounded-3xl px-8 py-16 text-center text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-70">
              Get Your Own Report
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
              Ready to see your real results?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed opacity-90">
              This is a sample. Your actual report is built from your own assessment answers — uniquely yours, with scores that reflect your specific gut food system.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold shadow-lg transition-opacity hover:opacity-90"
                style={{ color: "var(--icon-green)" }}
              >
                Start Free Assessment
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/report"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-80"
              >
                View all report types
              </Link>
            </div>
            <div className="mt-10 flex justify-center gap-8">
              {["Free to start", "Results in minutes", "30-day plan included"].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-xs opacity-70">
                  <Check size={12} strokeWidth={3} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

/* ─── Report Actions (Email only) ───────────────────────────────────── */
function ReportActions({ data }: { data: DemoReportData }) {
  const title = data.theme.title

  const [email, setEmail] = useState("")
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setEmailStatus("sending")
    try {
      const res = await fetch("/api/email-sample-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reportTitle: title }),
      })
      setEmailStatus(res.ok ? "sent" : "error")
    } catch {
      setEmailStatus("error")
    }
  }

  return (
    <div className="report-actions px-6 pb-12">
      <div className="mx-auto max-w-[560px]">

        {/* Email My Report */}
        <div
          className="flex flex-col gap-5 rounded-3xl border bg-background p-7"
          style={{ borderTopWidth: "3px", borderTopColor: "var(--icon-teal)" }}
        >
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "color-mix(in srgb, var(--icon-teal) 12%, transparent)" }}
          >
            <Mail size={20} style={{ color: "var(--icon-teal)" }} />
          </div>
          <div>
            <p className="font-serif text-lg font-semibold text-foreground">Email My Report</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Get a copy of this sample report delivered to your inbox — and find out how to unlock your own personalised version.
            </p>
          </div>

          {emailStatus === "sent" ? (
            <div
              className="mt-auto flex items-center gap-3 rounded-2xl px-5 py-4"
              style={{ background: "color-mix(in srgb, var(--icon-teal) 10%, transparent)" }}
            >
              <CheckCircle2 size={20} style={{ color: "var(--icon-teal)" }} className="shrink-0" />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--icon-teal)" }}>Report sent!</p>
                <p className="text-xs text-muted-foreground">Check your inbox — we've also included a link to start your own assessment.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmail} className="mt-auto space-y-3">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-border bg-background px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-[var(--icon-teal)] focus:ring-2"
                style={{ "--tw-ring-color": "color-mix(in srgb, var(--icon-teal) 20%, transparent)" } as React.CSSProperties}
                disabled={emailStatus === "sending"}
              />
              {emailStatus === "error" && (
                <p className="text-xs text-red-500 px-1">Something went wrong — please try again.</p>
              )}
              <button
                type="submit"
                disabled={emailStatus === "sending"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 brand-gradient"
              >
                {emailStatus === "sending" ? (
                  <><Loader2 size={15} className="animate-spin" /> Sending…</>
                ) : (
                  <><Mail size={15} /> Send to my inbox</>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}

/* ─── Helpers ───────────────────────────────────────────────────────── */
function SectionLabel({
  label,
  accent,
  centered,
}: {
  label: string
  accent: string
  centered?: boolean
}) {
  if (centered) {
    return (
      <div className="mb-3 flex items-center justify-center gap-3">
        <div className="h-0.5 w-6 rounded-full" style={{ background: accent }} />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
          {label}
        </p>
        <div className="h-0.5 w-6 rounded-full" style={{ background: accent }} />
      </div>
    )
  }
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="h-0.5 w-8 rounded-full" style={{ background: accent }} />
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
        {label}
      </p>
    </div>
  )
}
