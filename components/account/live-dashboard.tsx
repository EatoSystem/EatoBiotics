"use client"

import { useState } from "react"
import Link from "next/link"
import { Camera, ArrowRight, Lock, Check, ChevronRight, TrendingUp, Mail } from "lucide-react"

/* ─────────────────────────────────────────────────────────────────────────
   Score ring
   ───────────────────────────────────────────────────────────────────────── */
function ScoreRing({
  score,
  size = 88,
  strokeWidth = 6,
}: {
  score: number
  size?: number
  strokeWidth?: number
}) {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="var(--icon-lime)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Mini ring — pillar cards
   ───────────────────────────────────────────────────────────────────────── */
function MiniRing({ score, color }: { score: number; color: string }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
      <svg
        width={56} height={56}
        viewBox="0 0 56 56"
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
      >
        <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={4.5} />
        <circle
          cx={28} cy={28} r={r}
          fill="none"
          stroke={color}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <span className="relative text-sm font-bold tabular-nums" style={{ color }}>
        {score}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Score bar
   ───────────────────────────────────────────────────────────────────────── */
function barColor(s: number) {
  if (s >= 60) return "var(--icon-green)"
  if (s >= 30) return "var(--icon-orange)"
  return "var(--destructive)"
}
function labelColor(s: number) {
  if (s >= 60) return "#2d6b0e"
  if (s >= 30) return "#a05a0a"
  return "#b91c1c"
}
function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-sm" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </span>
      <div
        className="flex-1 overflow-hidden rounded-full"
        style={{ height: "7px", background: "var(--muted)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: barColor(score) }}
        />
      </div>
      <span
        className="w-7 text-right text-sm font-bold tabular-nums"
        style={{ color: labelColor(score) }}
      >
        {score}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Next Sunday helper
   ───────────────────────────────────────────────────────────────────────── */
function nextSunday(): string {
  const d = new Date()
  const daysUntil = (7 - d.getDay()) % 7 || 7
  d.setDate(d.getDate() + daysUntil)
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
}

type LoggerState = "empty" | "analysing" | "result"

/* ─────────────────────────────────────────────────────────────────────────
   LiveDashboard — self-contained, all data hardcoded for Jason
   ───────────────────────────────────────────────────────────────────────── */
export interface LiveDashboardProps {
  [key: string]: unknown
}

export function LiveDashboard(_props: LiveDashboardProps = {}) {
  const [loggerState, setLoggerState] = useState<LoggerState>("result")

  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"
  const deliveryDate = nextSunday()

  return (
    <div className="min-h-screen pb-16" style={{ background: "#f2f4f0" }}>

      {/* ══════════════════════════════════════════════════════════════════
          1. HERO BAR — full-width dark band, content centred at max-w-5xl
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: "var(--foreground)" }}>
        <div className="mx-auto max-w-5xl px-5 pb-6 pt-6 md:px-8 md:pb-8 md:pt-8">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <p className="font-serif text-2xl font-bold leading-tight text-white md:text-3xl">
                Good {timeOfDay},<br />Jason.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: "rgba(168,224,99,0.18)", color: "var(--icon-lime)" }}
                >
                  <TrendingUp size={11} />
                  +8 pts this month
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
                  Emerging Balance
                </span>
              </div>
            </div>
            <div className="relative shrink-0 flex items-center justify-center">
              <ScoreRing score={62} size={96} strokeWidth={6} />
              <div className="absolute flex flex-col items-center">
                <span className="font-mono text-2xl font-bold leading-none" style={{ color: "var(--icon-lime)" }}>
                  62
                </span>
                <span className="mt-0.5 text-[9px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.30)" }}>
                  score
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. WEEK STRIP — full-width, centred at max-w-5xl
      ══════════════════════════════════════════════════════════════════ */}
      <div className="border-b" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-5xl px-5 py-4 md:px-8">
          <div className="flex max-w-sm items-start justify-between md:max-w-xs">
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
                      ? { background: "var(--icon-green)" }
                      : status === "today"
                      ? {
                          border: "2px solid var(--icon-green)",
                          background: "color-mix(in srgb, var(--icon-green) 10%, white)",
                        }
                      : { border: "1.5px solid var(--border)", background: "var(--muted)" }
                  }
                >
                  {status === "done" && <Check size={13} strokeWidth={2.5} color="white" />}
                  {status === "today" && (
                    <div className="h-2 w-2 rounded-full" style={{ background: "var(--icon-green)" }} />
                  )}
                </div>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: status === "today" ? "var(--icon-green)" : "var(--muted-foreground)" }}
                >
                  {status === "today" ? "Now" : label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. MAIN CONTENT — 2-col on desktop, 1-col on mobile
      ══════════════════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-5xl px-4 pt-6 md:grid md:grid-cols-[1fr_380px] md:gap-7 md:px-8 md:pt-8">

        {/* ── LEFT COLUMN ────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* ── Meal Logger ── */}
          <div>
            {/* State toggle pills */}
            <div className="mb-3 flex gap-1.5">
              {(["empty", "analysing", "result"] as LoggerState[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setLoggerState(s)}
                  className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={
                    loggerState === s
                      ? { background: "var(--foreground)", color: "white" }
                      : { background: "var(--border)", color: "var(--muted-foreground)" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>

            {/* State A — Empty */}
            {loggerState === "empty" && (
              <div
                className="rounded-2xl p-6"
                style={{
                  border: "1.5px dashed var(--icon-green)",
                  background: "color-mix(in srgb, var(--icon-green) 4%, white)",
                  boxShadow: "0 2px 16px rgba(26,46,18,0.06)",
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ background: "color-mix(in srgb, var(--icon-green) 14%, white)" }}
                  >
                    <Camera size={26} style={{ color: "var(--icon-green)" }} />
                  </div>
                  <h2 className="font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>
                    What are you eating?
                  </h2>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    Take or upload a photo of your meal. EatoBiotics will analyse its biotics
                    profile and teach you what&apos;s happening inside.
                  </p>
                  <div className="mt-5 flex gap-2.5">
                    <button
                      className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                      style={{ background: "var(--foreground)" }}
                    >
                      📷 Take photo
                    </button>
                    <button
                      className="flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold"
                      style={{ borderColor: "var(--foreground)", color: "var(--foreground)" }}
                    >
                      ↑ Upload
                    </button>
                  </div>
                  <div className="mt-4 flex w-full items-center gap-2">
                    <input
                      type="text"
                      placeholder="Or describe your meal in a few words…"
                      className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
                      style={{ borderColor: "var(--border)", background: "white", color: "var(--foreground)" }}
                      readOnly
                    />
                    <button
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "var(--icon-green)" }}
                    >
                      <ArrowRight size={16} color="white" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* State B — Analysing */}
            {loggerState === "analysing" && (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "white",
                  border: "1px solid var(--border)",
                  boxShadow: "0 2px 16px rgba(26,46,18,0.06)",
                }}
              >
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ background: "color-mix(in srgb, var(--icon-green) 10%, white)" }}
                  >
                    🥣
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                      Overnight oats with banana
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      7:42am · Breakfast
                    </p>
                  </div>
                </div>
                <div className="space-y-3.5">
                  {[
                    { text: "Identifying ingredients...", opacity: 1 },
                    { text: "Mapping your biotics...", opacity: 0.5 },
                    { text: "Finding what's interesting...", opacity: 0.2 },
                  ].map(({ text, opacity }) => (
                    <div key={text} className="flex items-center gap-2.5" style={{ opacity }}>
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--icon-green)" }} />
                      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{text}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 overflow-hidden rounded-full" style={{ height: "3px", background: "var(--muted)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: "62%", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }}
                  />
                </div>
              </div>
            )}

            {/* State C — Result */}
            {loggerState === "result" && (
              <div
                className="overflow-hidden rounded-2xl"
                style={{
                  background: "white",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 24px rgba(26,46,18,0.08)",
                }}
              >
                <div className="flex items-center gap-3 border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ background: "color-mix(in srgb, var(--icon-green) 10%, white)" }}
                  >
                    🥣
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
                      Overnight oats with banana
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>7:42am · Breakfast</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-2xl font-bold leading-none" style={{ color: "var(--icon-green)" }}>71</p>
                    <p className="mt-0.5 text-[10px]" style={{ color: "var(--muted-foreground)" }}>/100</p>
                  </div>
                </div>

                <div className="space-y-3 px-5 py-4">
                  <ScoreBar label="Prebiotic fibre"   score={72} />
                  <ScoreBar label="Probiotic load"    score={18} />
                  <ScoreBar label="Diversity"         score={55} />
                  <ScoreBar label="Anti-inflammatory" score={80} />
                </div>

                {/* Dark insight panel */}
                <div className="mx-5 mb-2 overflow-hidden rounded-xl" style={{ background: "var(--foreground)" }}>
                  <div className="px-4 py-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-lime)" }}>
                      What EatoBiotics noticed
                    </p>
                    <p className="text-sm leading-relaxed text-white">
                      Your oats are feeding <em>Bifidobacterium</em> — the bacteria linked to better
                      mood and less bloating. Missing: a fermented element. Adding a spoon of kefir
                      or yoghurt here would push your probiotic score from{" "}
                      <strong style={{ color: "var(--icon-orange)" }}>18</strong> to{" "}
                      <strong style={{ color: "var(--icon-lime)" }}>~55</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 px-5 pb-3 pt-1">
                  {["Prebiotics", "Gut-brain axis", "Satiety"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="px-5 pb-5 pt-2">
                  <button
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--icon-green)" }}
                  >
                    ✓ Log this meal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Today's Meals ── */}
          <div>
            <p
              className="mb-3 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)" }}
            >
              Today&apos;s Meals
            </p>
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                background: "white",
                border: "1px solid var(--border)",
                boxShadow: "0 2px 12px rgba(26,46,18,0.05)",
              }}
            >
              <div className="flex items-center gap-3 border-b px-4 py-3.5" style={{ borderColor: "var(--border)" }}>
                <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--icon-green)" }} />
                <p className="flex-1 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Overnight oats with banana
                </p>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>7:42am</span>
                <span className="w-7 text-right font-mono text-sm font-bold" style={{ color: "var(--icon-green)" }}>71</span>
              </div>
              {(["Lunch not logged yet", "Dinner not logged yet"] as string[]).map((label, i) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-4 py-3.5 opacity-40"
                  style={{ borderTop: i === 0 ? undefined : `1px solid var(--border)` }}
                >
                  <div className="h-2 w-2 shrink-0 rounded-full border" style={{ borderColor: "var(--border)" }} />
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>{/* end left column */}

        {/* ── RIGHT COLUMN ───────────────────────────────────────────── */}
        <div className="mt-5 space-y-5 md:mt-0">

          {/* ── Biotics Profile ── */}
          <div>
            <p
              className="mb-3 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)" }}
            >
              Your Biotics Profile
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Prebiotic",  score: 71, delta: "↑ +4 this week", color: "var(--icon-green)",  bg: "color-mix(in srgb, var(--icon-green) 8%, white)" },
                { label: "Probiotic",  score: 23, delta: "Needs work",     color: "var(--icon-orange)", bg: "color-mix(in srgb, var(--icon-orange) 8%, white)" },
                { label: "Postbiotic", score: 48, delta: "Stable",         color: "var(--muted-foreground)", bg: "white" },
              ].map(({ label, score, delta, color, bg }) => (
                <div
                  key={label}
                  className="flex flex-col items-center rounded-2xl p-3.5"
                  style={{
                    background: bg,
                    border: "1px solid var(--border)",
                    boxShadow: "0 2px 10px rgba(26,46,18,0.05)",
                  }}
                >
                  <p className="mb-2 text-[11px] font-medium" style={{ color: "var(--muted-foreground)" }}>
                    {label}
                  </p>
                  <MiniRing score={score} color={color} />
                  <p className="mt-2 text-center text-[10px] font-medium leading-tight" style={{ color }}>
                    {delta}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Consultation — active ── */}
          <div>
            <p
              className="mb-3 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)" }}
            >
              Weekly Consultation
            </p>
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                background: "var(--foreground)",
                boxShadow: "0 4px 20px rgba(26,46,18,0.18)",
              }}
            >
              <div className="p-5">
                <p
                  className="mb-1.5 text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                >
                  Weekly · EatoBiotic Consultation
                </p>
                <h3 className="font-serif text-base font-bold leading-snug text-white">
                  Your weekly consultation with EatoBiotic
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  A consultation grounded in your week&apos;s meals and scores. One session per week.
                </p>

                {/* Email delivery notice */}
                <div
                  className="mt-4 flex items-start gap-3 rounded-xl p-3.5"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <Mail size={15} color="var(--icon-lime)" className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Delivered to your inbox every Sunday
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                      Next review: {deliveryDate}
                    </p>
                  </div>
                </div>

                <p className="mt-3.5 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                  We&apos;ll email your full weekly review. Tap the link in your email to open your consultation here.
                </p>
              </div>
            </div>
          </div>

          {/* ── Consultation — locked ── */}
          <div
            className="overflow-hidden rounded-2xl opacity-50"
            style={{ background: "var(--foreground)" }}
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p
                    className="mb-1.5 text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.30)" }}
                  >
                    Weekly · EatoBiotic Consultation
                  </p>
                  <h3 className="font-serif text-base font-bold leading-snug text-white">
                    Your weekly consultation with EatoBiotic
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
                    A consultation grounded in your week&apos;s meals and scores. One session per week.
                  </p>
                </div>
                <Lock size={16} color="rgba(255,255,255,0.35)" className="mt-1 shrink-0" />
              </div>
              <div
                className="mt-4 flex items-start gap-3 rounded-xl p-3.5"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <Mail size={15} color="rgba(255,255,255,0.30)" className="mt-0.5 shrink-0" />
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Upgrade to Restore to receive your weekly automated consultation by email.
                </p>
              </div>
            </div>
          </div>

          {/* ── Monthly Focus ── */}
          <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{
              background: "white",
              border: "1px solid var(--border)",
              boxShadow: "0 2px 12px rgba(26,46,18,0.05)",
            }}
          >
            <div
              className="absolute inset-y-0 left-0 w-[3px]"
              style={{ background: "linear-gradient(to bottom, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
            />
            <div className="pl-3">
              <p
                className="mb-2 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--icon-green)" }}
              >
                This month&apos;s focus
              </p>
              <h3
                className="font-serif text-lg font-bold leading-snug"
                style={{ color: "var(--foreground)" }}
              >
                Fix your fermented food gap.
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                Your plant diversity has been strong but your Live Foods score is pulling down
                your overall Biotics number. One fermented food daily for 30 days changes this.
              </p>
              <Link
                href="#"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-75"
                style={{ color: "var(--icon-green)" }}
              >
                Read your full plan
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

        </div>{/* end right column */}
      </div>{/* end main grid */}
    </div>
  )
}
