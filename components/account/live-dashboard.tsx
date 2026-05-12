"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Camera, ArrowRight, Check, ChevronRight, TrendingUp,
  Mail, FileText, UtensilsCrossed, MessageSquare, Download, ExternalLink, Flame,
} from "lucide-react"

/* ─────────────────────────────────────────────────────────────────────────
   Score ring — gradient arc
   ───────────────────────────────────────────────────────────────────────── */
function ScoreRing({ score, size = 96, strokeWidth = 7 }: { score: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <defs>
        <linearGradient id="hero-ring-grad" x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#A8E063" />
          <stop offset="50%"  stopColor="#4CB648" />
          <stop offset="100%" stopColor="#2DAA6E" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#hero-ring-grad)"
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s ease" }} />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Mini ring — gradient arc, unique ID per pillar
   ───────────────────────────────────────────────────────────────────────── */
function MiniRing({
  score, gradId,
  c0, c1, textColor,
}: {
  score: number; gradId: string; c0: string; c1: string; textColor: string
}) {
  const r = 22; const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative flex items-center justify-center" style={{ width: 60, height: 60 }}>
      <svg width={60} height={60} viewBox="0 0 60 60" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor={c0} />
            <stop offset="100%" stopColor={c1} />
          </linearGradient>
        </defs>
        <circle cx={30} cy={30} r={r} fill="none" stroke="#e8e8e8" strokeWidth={5} />
        <circle cx={30} cy={30} r={r} fill="none" stroke={`url(#${gradId})`}
          strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <span className="relative text-sm font-bold tabular-nums" style={{ color: textColor }}>{score}</span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Score bar — gradient fill
   ───────────────────────────────────────────────────────────────────────── */
function barGradient(s: number) {
  if (s >= 60) return "linear-gradient(90deg, var(--icon-lime), var(--icon-green))"
  if (s >= 30) return "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))"
  return "linear-gradient(90deg, var(--icon-orange), var(--destructive))"
}
function labelColor(s: number) {
  if (s >= 60) return "#2d6b0e"; if (s >= 30) return "#a05a0a"; return "#b91c1c"
}
function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-sm" style={{ color: "var(--muted-foreground)" }}>{label}</span>
      <div className="flex-1 overflow-hidden rounded-full" style={{ height: "7px", background: "#ebebeb" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: barGradient(score) }} />
      </div>
      <span className="w-7 text-right text-sm font-bold tabular-nums" style={{ color: labelColor(score) }}>{score}</span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Score badge — compact pill
   ───────────────────────────────────────────────────────────────────────── */
function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums text-white"
      style={{ background: barGradient(score) }}>
      {score}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Gradient tag pill — branded, not grey
   ───────────────────────────────────────────────────────────────────────── */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ borderColor: "var(--icon-green)", color: "var(--icon-green)", background: "white" }}>
      {children}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Section label with gradient dot accent
   ───────────────────────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="h-2 w-2 rounded-full" style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }} />
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
        {children}
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Gradient CTA button
   ───────────────────────────────────────────────────────────────────────── */
function GradientButton({ children, onClick, fullWidth, small }: {
  children: React.ReactNode; onClick?: () => void; fullWidth?: boolean; small?: boolean
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] ${fullWidth ? "w-full" : ""} ${small ? "px-4 py-2 text-xs" : "px-5 py-3 text-sm"}`}
      style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", boxShadow: "0 4px 14px rgba(45,170,110,0.30)" }}>
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Next Sunday
   ───────────────────────────────────────────────────────────────────────── */
function nextSunday(): string {
  const d = new Date()
  const days = (7 - d.getDay()) % 7 || 7
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
}

/* ─────────────────────────────────────────────────────────────────────────
   Mock data
   ───────────────────────────────────────────────────────────────────────── */
const MOCK_MEALS = [
  {
    date: "Today — Tue 13 May",
    meals: [
      { emoji: "🥣", name: "Overnight oats with banana", time: "7:42am", score: 71, insight: "Strong prebiotic base. Add kefir to push probiotic score from 18 → ~55." },
    ],
  },
  {
    date: "Yesterday — Mon 12 May",
    meals: [
      { emoji: "🍳", name: "Eggs, sourdough & avocado",     time: "8:20am", score: 65, insight: "Good healthy fats and fibre. Low plant diversity — swap bread for wholegrain." },
      { emoji: "🥗", name: "Salmon salad with kimchi",       time: "1:15pm", score: 78, insight: "Excellent. Kimchi lifted your probiotic score. Repeat this pattern." },
      { emoji: "🍝", name: "Pasta, garlic & roasted veg",    time: "7:30pm", score: 72, insight: "Garlic's inulin feeds Lactobacillus. Solid prebiotic meal." },
    ],
  },
  {
    date: "Sun 11 May",
    meals: [
      { emoji: "🥣", name: "Greek yoghurt, berries & oats", time: "9:00am", score: 69, insight: "Yoghurt delivers live cultures. Berries add polyphenol diversity." },
      { emoji: "🌯", name: "Lentil wrap with mixed greens",  time: "1:00pm", score: 74, insight: "High fibre. Lentils are excellent prebiotic food." },
      { emoji: "🥘", name: "Chicken, roasted veg & kefir",  time: "7:45pm", score: 81, insight: "Best meal this week. Kefir + diverse veg = the gold standard pattern." },
    ],
  },
]

const MOCK_REPORTS = [
  { id: 1, title: "Full Biotics Assessment", profileType: "Emerging Balance",  month: "April 2025",   score: 62, delta: "+8 since January", positive: true,  pillars: { prebiotic: 71, probiotic: 23, postbiotic: 48 } },
  { id: 2, title: "Full Biotics Assessment", profileType: "Developing System", month: "January 2025", score: 54, delta: "First assessment",  positive: null,  pillars: { prebiotic: 55, probiotic: 18, postbiotic: 38 } },
]

const MOCK_CONSULTATIONS = [
  { id: 1, date: "Sunday, 11 May 2025", week: "Week 8 of 30", avgScore: 73, delta: "+5", preview: "Your food system showed real momentum this week. Plant diversity was your strongest area — hitting 9 different plants, your best showing in a month. Your fermented food frequency still needs attention: only 2 out of 7 days included a live food source." },
  { id: 2, date: "Sunday, 4 May 2025",  week: "Week 7 of 30", avgScore: 68, delta: "+4", preview: "A consistent week with clear patterns emerging. Your prebiotic score held steady and your fermented food frequency improved to 4 out of 7 days. The habit is forming — keep the weekend routine tighter." },
  { id: 3, date: "Sunday, 27 Apr 2025", week: "Week 6 of 30", avgScore: 64, delta: "+2", preview: "Mixed week with a clear gap at the weekend. Monday–Friday averaged 71 but Saturday dropped to 48. Weekend meal planning is the lever to pull this month." },
]

/* ─────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────── */
type Tab = "overview" | "meals" | "reports" | "consultations"
type LoggerState = "empty" | "analysing" | "result"

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",      label: "Overview",      icon: <TrendingUp size={13} /> },
  { id: "meals",         label: "My Meals",       icon: <UtensilsCrossed size={13} /> },
  { id: "reports",       label: "My Reports",     icon: <FileText size={13} /> },
  { id: "consultations", label: "Consultations",  icon: <MessageSquare size={13} /> },
]

/* ─────────────────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────────────────── */
export interface LiveDashboardProps { [key: string]: unknown }

export function LiveDashboard(_props: LiveDashboardProps = {}) {
  const [tab, setTab] = useState<Tab>("overview")
  const [loggerState, setLoggerState] = useState<LoggerState>("result")

  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"
  const deliveryDate = nextSunday()

  return (
    <div className="min-h-screen" style={{ background: "white" }}>

      {/* ══════════════════════════════════════════════════════════════════
          HERO — gradient band
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: "linear-gradient(135deg, #1a4a14 0%, #0a5c44 100%)" }}>
        <div className="mx-auto max-w-5xl px-5 pb-7 pt-6 md:px-8 md:pb-9 md:pt-8">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <p className="font-serif text-2xl font-bold leading-tight text-white md:text-3xl">
                Good {timeOfDay},<br />Jason.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* Streak badge */}
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: "rgba(245,166,35,0.22)", color: "var(--icon-yellow)" }}>
                  <Flame size={11} /> 7-day streak
                </span>
                {/* Score trend badge */}
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: "rgba(168,224,99,0.20)", color: "var(--icon-lime)" }}>
                  <TrendingUp size={11} /> +8 pts this month
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
                  Emerging Balance
                </span>
              </div>
            </div>
            {/* Score ring */}
            <div className="relative shrink-0 flex items-center justify-center">
              <ScoreRing score={62} size={96} strokeWidth={7} />
              <div className="absolute flex flex-col items-center">
                <span className="font-mono text-2xl font-bold leading-none" style={{ color: "var(--icon-lime)" }}>62</span>
                <span className="mt-0.5 text-[9px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>score</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand gradient divider */}
      <div className="section-divider" />

      {/* ══════════════════════════════════════════════════════════════════
          WEEK STRIP
      ══════════════════════════════════════════════════════════════════ */}
      <div className="border-b" style={{ borderColor: "#ebebeb" }}>
        <div className="mx-auto max-w-5xl px-5 py-4 md:px-8">
          <div className="flex max-w-xs items-start justify-between">
            {([
              { label: "Mon", status: "done"  as const },
              { label: "Tue", status: "today" as const },
              { label: "Wed", status: "empty" as const },
              { label: "Thu", status: "empty" as const },
              { label: "Fri", status: "empty" as const },
              { label: "Sat", status: "empty" as const },
              { label: "Sun", status: "empty" as const },
            ] as { label: string; status: "done" | "today" | "empty" }[]).map(({ label, status }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-all"
                  style={
                    status === "done"
                      ? { background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))", boxShadow: "0 2px 8px rgba(76,182,72,0.35)" }
                      : status === "today"
                      ? { border: "2.5px solid var(--icon-green)", background: "white",
                          animation: "pulse-ring 2s ease-in-out infinite",
                          boxShadow: "0 0 0 3px rgba(76,182,72,0.15)" }
                      : { border: "1.5px solid #e0e0e0", background: "white" }
                  }
                >
                  {status === "done" && <Check size={13} strokeWidth={2.5} color="white" />}
                  {status === "today" && (
                    <div className="h-2.5 w-2.5 rounded-full"
                      style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }} />
                  )}
                </div>
                <span className="text-[10px] font-semibold"
                  style={{ color: status === "today" ? "var(--icon-green)" : "var(--muted-foreground)" }}>
                  {status === "today" ? "Now" : label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB NAVIGATION — sticky
      ══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-[57px] z-10 border-b" style={{ background: "white", borderColor: "#ebebeb" }}>
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {TABS.map(({ id, label, icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all"
                style={tab === id
                  ? { background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", color: "white", boxShadow: "0 3px 10px rgba(45,170,110,0.28)" }
                  : { color: "var(--muted-foreground)" }
                }>
                {icon}{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div className="mx-auto max-w-5xl px-4 pt-6 pb-16 md:grid md:grid-cols-[1fr_380px] md:gap-7 md:px-8 md:pt-8">

          {/* ── LEFT: Logger + Today's Meals ── */}
          <div className="space-y-5">

            {/* Logger state toggle */}
            <div>
              <div className="mb-3 flex gap-1.5">
                {(["empty", "analysing", "result"] as LoggerState[]).map((s) => (
                  <button key={s} onClick={() => setLoggerState(s)}
                    className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all"
                    style={loggerState === s
                      ? { background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", color: "white" }
                      : { background: "#f0f0f0", color: "var(--muted-foreground)" }
                    }>
                    {s}
                  </button>
                ))}
              </div>

              {/* Empty state */}
              {loggerState === "empty" && (
                <div className="rounded-2xl p-6" style={{
                  border: "1.5px dashed var(--icon-green)",
                  background: "white",
                  boxShadow: "0 2px 16px rgba(26,46,18,0.05)",
                }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                      style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}>
                      <Camera size={26} color="white" />
                    </div>
                    <h2 className="font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>
                      What are you eating?
                    </h2>
                    <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      Take or upload a photo of your meal. EatoBiotics will analyse its biotics profile and teach you what&apos;s happening inside.
                    </p>
                    <div className="mt-5 flex gap-2.5">
                      <GradientButton>📷 Take photo</GradientButton>
                      <button className="flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold"
                        style={{ borderColor: "var(--icon-green)", color: "var(--icon-green)" }}>
                        ↑ Upload
                      </button>
                    </div>
                    <div className="mt-4 flex w-full items-center gap-2">
                      <input type="text" placeholder="Or describe your meal in a few words…" readOnly
                        className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
                        style={{ borderColor: "#e0e0e0", color: "var(--foreground)" }} />
                      <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", boxShadow: "0 3px 10px rgba(45,170,110,0.30)" }}>
                        <ArrowRight size={16} color="white" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysing state */}
              {loggerState === "analysing" && (
                <div className="rounded-2xl p-5" style={{
                  background: "white", border: "1px solid #ebebeb", boxShadow: "0 2px 16px rgba(26,46,18,0.06)",
                }}>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}>
                      🥣
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: "var(--foreground)" }}>Overnight oats with banana</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>7:42am · Breakfast</p>
                    </div>
                  </div>
                  <div className="space-y-3.5">
                    {[
                      { text: "Identifying ingredients...", opacity: 1 },
                      { text: "Mapping your biotics...", opacity: 0.5 },
                      { text: "Finding what's interesting...", opacity: 0.2 },
                    ].map(({ text, opacity }) => (
                      <div key={text} className="flex items-center gap-2.5" style={{ opacity }}>
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }} />
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 overflow-hidden rounded-full" style={{ height: "4px", background: "#ebebeb" }}>
                    <div className="h-full rounded-full" style={{ width: "62%", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
                  </div>
                </div>
              )}

              {/* Result state */}
              {loggerState === "result" && (
                <div className="overflow-hidden rounded-2xl" style={{
                  background: "white", border: "1px solid #ebebeb", boxShadow: "0 4px 24px rgba(26,46,18,0.07)",
                }}>
                  {/* Gradient top accent */}
                  <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />

                  <div className="flex items-center gap-3 border-b px-5 py-4" style={{ borderColor: "#ebebeb" }}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                      style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}>
                      🥣
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug" style={{ color: "var(--foreground)" }}>Overnight oats with banana</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>7:42am · Breakfast</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-2xl font-bold leading-none" style={{ color: "var(--icon-green)" }}>71</p>
                      <p className="mt-0.5 text-[10px]" style={{ color: "var(--muted-foreground)" }}>/100</p>
                    </div>
                  </div>

                  {/* ── BIOTICS ── */}
                  <div className="px-5 pb-3 pt-4">
                    <p className="mb-2.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                      Biotics
                    </p>
                    <div className="space-y-2.5">
                      <ScoreBar label="Prebiotic"  score={72} />
                      <ScoreBar label="Probiotic"  score={18} />
                      <ScoreBar label="Postbiotic" score={41} />
                    </div>
                  </div>

                  <div className="mx-5 h-px" style={{ background: "#f0f0f0" }} />

                  {/* ── MEAL QUALITY ── */}
                  <div className="px-5 pb-3 pt-3">
                    <p className="mb-2.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>
                      Meal Quality
                    </p>
                    <div className="space-y-2.5">
                      <ScoreBar label="Diversity"         score={55} />
                      <ScoreBar label="Anti-inflammatory" score={80} />
                    </div>
                  </div>

                  <div className="mx-5 h-px" style={{ background: "#f0f0f0" }} />

                  {/* ── NUTRITION STRIP ── */}
                  <div className="pb-1 pt-3">
                    <p className="mb-1 px-5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>
                      Nutrition
                    </p>
                    <div className="grid grid-cols-5">
                      {([
                        { label: "Calories", value: "385", unit: "kcal", color: "var(--icon-orange)" },
                        { label: "Protein",  value: "12",  unit: "g",    color: "var(--icon-teal)" },
                        { label: "Carbs",    value: "68",  unit: "g",    color: "var(--icon-yellow)" },
                        { label: "Fat",      value: "8",   unit: "g",    color: "var(--icon-green)" },
                        { label: "Fibre",    value: "6",   unit: "g",    color: "var(--icon-lime)" },
                      ] as { label: string; value: string; unit: string; color: string }[]).map(({ label, value, unit, color }, i) => (
                        <div key={label} className="flex flex-col items-center py-3"
                          style={{ borderRight: i < 4 ? "1px solid #f0f0f0" : undefined }}>
                          <span className="font-mono text-base font-bold leading-none" style={{ color }}>{value}</span>
                          <span className="mt-0.5 text-[9px] font-medium" style={{ color: "var(--muted-foreground)" }}>{unit}</span>
                          <span className="mt-0.5 text-[9px]" style={{ color: "var(--muted-foreground)" }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mx-5 h-px" style={{ background: "#f0f0f0" }} />

                  {/* Insight panel — white with gradient left border */}
                  <div className="mx-5 mb-3 flex overflow-hidden rounded-xl" style={{ border: "1px solid #e8e8e8" }}>
                    <div className="w-[3px] shrink-0"
                      style={{ background: "linear-gradient(to bottom, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
                    <div className="px-4 py-4">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                        What EatoBiotics noticed
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                        Your oats are feeding <em>Bifidobacterium</em> — linked to better mood and less bloating.
                        Missing: a fermented element. Kefir or yoghurt would push your probiotic score from{" "}
                        <strong style={{ color: "var(--icon-orange)" }}>18</strong> to{" "}
                        <strong style={{ color: "var(--icon-green)" }}>~55</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 px-5 pb-3">
                    {["Prebiotics", "Gut-brain axis", "Satiety"].map(t => <Tag key={t}>{t}</Tag>)}
                  </div>

                  <div className="px-5 pb-5 pt-2">
                    <GradientButton fullWidth>✓ Log this meal</GradientButton>
                  </div>
                </div>
              )}
            </div>

            {/* Today's Meals */}
            <div>
              <SectionLabel>Today&apos;s Meals</SectionLabel>
              <div className="overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
                {/* Gradient top strip */}
                <div className="h-[2px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
                <div className="flex items-center gap-3 border-b px-4 py-3.5" style={{ borderColor: "#ebebeb" }}>
                  <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }} />
                  <p className="flex-1 text-sm font-medium" style={{ color: "var(--foreground)" }}>Overnight oats with banana</p>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>7:42am</span>
                  <span className="w-7 text-right font-mono text-sm font-bold" style={{ color: "var(--icon-green)" }}>71</span>
                </div>
                {["Lunch not logged yet", "Dinner not logged yet"].map((label, i) => (
                  <div key={label} className="flex items-center gap-3 px-4 py-3.5 opacity-35"
                    style={{ borderTop: i === 0 ? undefined : "1px solid #ebebeb" }}>
                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ border: "1.5px solid #d0d0d0" }} />
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>{/* end left */}

          {/* ── RIGHT: Biotics + Consultation + Monthly Focus ── */}
          <div className="mt-5 space-y-5 md:mt-0">

            {/* Biotics Profile */}
            <div>
              <SectionLabel>Your Biotics Profile</SectionLabel>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Prebiotic",  score: 71, delta: "↑ +4",     c0: "#A8E063", c1: "#4CB648", textColor: "#2d7a24", borderColor: "var(--icon-lime)" },
                  { label: "Probiotic",  score: 23, delta: "Needs work", c0: "#F5C518", c1: "#F5A623", textColor: "#a05a0a", borderColor: "var(--icon-orange)" },
                  { label: "Postbiotic", score: 48, delta: "Stable",    c0: "#4CB648", c1: "#2DAA6E", textColor: "#0a6644", borderColor: "var(--icon-teal)" },
                ].map(({ label, score, delta, c0, c1, textColor, borderColor }) => (
                  <div key={label} className="flex flex-col items-center overflow-hidden rounded-2xl"
                    style={{ background: "white", border: "1px solid #ebebeb", boxShadow: "0 2px 10px rgba(26,46,18,0.05)" }}>
                    {/* Coloured top border */}
                    <div className="h-[3.5px] w-full" style={{ background: `linear-gradient(90deg, ${c0}, ${c1})` }} />
                    <div className="flex flex-col items-center p-3.5">
                      <p className="mb-2 text-[11px] font-semibold" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                      <MiniRing score={score} gradId={`ring-${label}`} c0={c0} c1={c1} textColor={textColor} />
                      <p className="mt-2 text-center text-[10px] font-semibold leading-tight" style={{ color: borderColor }}>{delta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consultation */}
            <div>
              <SectionLabel>Weekly Consultation</SectionLabel>
              <div className="overflow-hidden rounded-2xl" style={{
                background: "linear-gradient(135deg, #2a7824 0%, #0d6b50 100%)",
                boxShadow: "0 4px 20px rgba(26,46,18,0.18)",
              }}>
                {/* Lime top accent */}
                <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow), var(--icon-orange))" }} />
                <div className="p-5">
                  <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>
                    Weekly · EatoBiotic Consultation
                  </p>
                  <h3 className="font-serif text-base font-bold leading-snug text-white">
                    Your weekly consultation with EatoBiotic
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                    A consultation grounded in your week&apos;s meals and scores. One session per week.
                  </p>
                  <div className="mt-4 flex items-start gap-3 rounded-xl p-3.5"
                    style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <Mail size={15} color="var(--icon-lime)" className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-white">Delivered to your inbox every Sunday</p>
                      <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Next review: {deliveryDate}</p>
                    </div>
                  </div>
                  <button onClick={() => setTab("consultations")}
                    className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                    style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
                    View past consultations <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Monthly Focus */}
            <div className="overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
              <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
              <div className="flex overflow-hidden">
                <div className="w-[3px] shrink-0"
                  style={{ background: "linear-gradient(to bottom, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
                <div className="p-5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                    This month&apos;s focus
                  </p>
                  <h3 className="font-serif text-lg font-bold leading-snug" style={{ color: "var(--foreground)" }}>
                    Fix your fermented food gap.
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    Your plant diversity has been strong but your Live Foods score is pulling down your overall Biotics number.
                    One fermented food daily for 30 days changes this.
                  </p>
                  <Link href="#" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-75"
                    style={{ color: "var(--icon-green)" }}>
                    Read your full plan <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

          </div>{/* end right */}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MEALS TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "meals" && (
        <div className="mx-auto max-w-5xl px-4 pt-6 pb-16 md:px-8 md:pt-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>My Meals</h2>
              <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
                7 meals logged this week · Average score:{" "}
                <strong style={{ color: "var(--icon-green)" }}>73</strong>
              </p>
            </div>
            <GradientButton small><Camera size={13} /> Log meal</GradientButton>
          </div>

          <div className="space-y-6">
            {MOCK_MEALS.map(({ date, meals }) => (
              <div key={date}>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, #e0e0e0, transparent)" }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>{date}</p>
                  <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #e0e0e0)" }} />
                </div>
                <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
                  <div className="h-[2px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
                  {meals.map((meal, i) => (
                    <div key={meal.name} className="px-5 py-4" style={{ borderTop: i > 0 ? "1px solid #f0f0f0" : undefined }}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}>
                          {meal.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-snug" style={{ color: "var(--foreground)" }}>{meal.name}</p>
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{meal.time}</p>
                        </div>
                        <ScoreBadge score={meal.score} />
                      </div>
                      <div className="mt-2.5 flex overflow-hidden rounded-lg" style={{ border: "1px solid #e8e8e8" }}>
                        <div className="w-[3px] shrink-0"
                          style={{ background: "linear-gradient(to bottom, var(--icon-lime), var(--icon-green))" }} />
                        <p className="px-3 py-2.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                          {meal.insight}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          REPORTS TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "reports" && (
        <div className="mx-auto max-w-5xl px-4 pt-6 pb-16 md:px-8 md:pt-8">
          <div className="mb-5">
            <h2 className="font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>My Reports</h2>
            <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>{MOCK_REPORTS.length} assessments completed</p>
          </div>

          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-5 md:space-y-0">
            {MOCK_REPORTS.map((r) => (
              <div key={r.id} className="overflow-hidden rounded-2xl" style={{ border: "1px solid #ebebeb", boxShadow: "0 2px 16px rgba(26,46,18,0.06)" }}>
                {/* Full gradient header */}
                <div className="px-5 py-5" style={{ background: "linear-gradient(135deg, #1a4a14 0%, #0a5c44 100%)" }}>
                  <div className="h-[2px] mb-4 rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow), var(--icon-orange))" }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>{r.month}</p>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <div>
                      <p className="font-serif text-lg font-bold text-white">{r.title}</p>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{r.profileType}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-3xl font-bold leading-none" style={{ color: "var(--icon-lime)" }}>{r.score}</p>
                      <p className="mt-0.5 text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>/100</p>
                    </div>
                  </div>
                </div>

                {/* Pillar bars */}
                <div className="space-y-2.5 px-5 py-4" style={{ background: "white" }}>
                  <ScoreBar label="Prebiotic"  score={r.pillars.prebiotic} />
                  <ScoreBar label="Probiotic"  score={r.pillars.probiotic} />
                  <ScoreBar label="Postbiotic" score={r.pillars.postbiotic} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 border-t px-5 py-3.5"
                  style={{ borderColor: "#ebebeb", background: "white" }}>
                  {r.positive ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ background: "linear-gradient(135deg, rgba(168,224,99,0.18), rgba(76,182,72,0.12))", color: "var(--icon-green)", border: "1px solid rgba(76,182,72,0.25)" }}>
                      <TrendingUp size={10} /> {r.delta}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{r.delta}</span>
                  )}
                  <div className="flex gap-2">
                    <Link href="#" className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                      style={{ borderColor: "#d0d0d0", color: "var(--muted-foreground)" }}>
                      <Download size={11} /> PDF
                    </Link>
                    <Link href="#" className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                      style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", boxShadow: "0 2px 8px rgba(45,170,110,0.25)" }}>
                      View report <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CONSULTATIONS TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "consultations" && (
        <div className="mx-auto max-w-5xl px-4 pt-6 pb-16 md:px-8 md:pt-8">
          <div className="mb-5">
            <h2 className="font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>My Consultations</h2>
            <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
              Delivered to your inbox every Sunday · {MOCK_CONSULTATIONS.length} sessions completed
            </p>
          </div>

          {/* Next delivery banner */}
          <div className="mb-5 overflow-hidden rounded-2xl" style={{
            background: "linear-gradient(135deg, #2a7824 0%, #0d6b50 100%)",
            boxShadow: "0 4px 16px rgba(26,46,18,0.16)",
          }}>
            <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow), var(--icon-orange))" }} />
            <div className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ background: "rgba(255,255,255,0.12)" }}>
                <Mail size={18} color="var(--icon-lime)" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Next consultation</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Being prepared for {deliveryDate} — arrives in your inbox that morning
                </p>
              </div>
            </div>
          </div>

          {/* Past consultations */}
          <div className="space-y-4">
            {MOCK_CONSULTATIONS.map((c) => (
              <div key={c.id} className="overflow-hidden rounded-2xl" style={{
                background: "white", border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(26,46,18,0.05)",
              }}>
                <div className="h-[2px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
                <div className="border-b px-5 py-4" style={{ borderColor: "#f0f0f0" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>{c.week}</p>
                      <p className="mt-0.5 font-serif text-base font-bold" style={{ color: "var(--foreground)" }}>{c.date}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
                        Avg {c.avgScore}
                      </span>
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ background: "linear-gradient(135deg, rgba(168,224,99,0.2), rgba(76,182,72,0.12))", color: "#2d7a24", border: "1px solid rgba(76,182,72,0.25)" }}>
                        {c.delta} pts
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{c.preview}</p>
                  <div className="mt-4">
                    <GradientButton small>Open full consultation <ExternalLink size={11} /></GradientButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pulse animation for "Now" dot */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 3px rgba(76,182,72,0.15); }
          50%        { box-shadow: 0 0 0 6px rgba(76,182,72,0.08); }
        }
      `}</style>
    </div>
  )
}
