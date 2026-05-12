"use client"

import { useState } from "react"
import Link from "next/link"
import { Camera, ArrowRight, Lock, Check, ChevronRight, TrendingUp } from "lucide-react"

/* ─────────────────────────────────────────────────────────────────────────
   Score ring — SVG circular progress
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
        <circle cx={28} cy={28} r={r} fill="none" stroke="var(--muted)" strokeWidth={4.5} />
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
      <span className="relative text-xs font-bold tabular-nums" style={{ color }}>
        {score}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Score bar — green ≥60 · amber 30–59 · red <30
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
      <span className="w-36 shrink-0 text-sm" style={{ color: "var(--muted-foreground)" }}>
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
   Logger state toggle type
   ───────────────────────────────────────────────────────────────────────── */
type LoggerState = "empty" | "analysing" | "result"

/* ─────────────────────────────────────────────────────────────────────────
   Main component — self-contained, all data hardcoded
   ───────────────────────────────────────────────────────────────────────── */
export interface LiveDashboardProps {
  [key: string]: unknown
}

export function LiveDashboard(_props: LiveDashboardProps = {}) {
  const [loggerState, setLoggerState] = useState<LoggerState>("result")

  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"

  return (
    <div className="min-h-screen pb-16" style={{ background: "#f2f4f0" }}>
      <div className="mx-auto max-w-[520px]">

        {/* ══════════════════════════════════════════════════════════════════
            1. HERO BAR
        ══════════════════════════════════════════════════════════════════ */}
        <div
          className="px-5 pb-6 pt-5"
          style={{ background: "var(--foreground)" }}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Greeting + trend badge */}
            <div className="flex-1">
              <p className="font-serif text-2xl font-bold leading-tight text-white">
                Good {timeOfDay},<br />Jason.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{
                    background: "rgba(168,224,99,0.18)",
                    color: "var(--icon-lime)",
                  }}
                >
                  <TrendingUp size={11} />
                  +8 pts this month
                </span>
                <span
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                >
                  Emerging Balance
                </span>
              </div>
            </div>

            {/* Score ring */}
            <div className="relative shrink-0 flex items-center justify-center">
              <ScoreRing score={62} size={88} strokeWidth={6} />
              <div className="absolute flex flex-col items-center">
                <span
                  className="font-mono text-2xl font-bold leading-none"
                  style={{ color: "var(--icon-lime)" }}
                >
                  62
                </span>
                <span
                  className="mt-0.5 text-[9px] uppercase tracking-wide"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                >
                  score
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. WEEK STRIP
        ══════════════════════════════════════════════════════════════════ */}
        <div
          className="border-b px-5 py-4"
          style={{ background: "white", borderColor: "var(--border)" }}
        >
          <div className="flex items-start justify-between">
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
                      : {
                          border: "1.5px solid var(--border)",
                          background: "var(--muted)",
                        }
                  }
                >
                  {status === "done" && (
                    <Check size={13} strokeWidth={2.5} color="white" />
                  )}
                  {status === "today" && (
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ background: "var(--icon-green)" }}
                    />
                  )}
                </div>
                <span
                  className="text-[10px] font-semibold"
                  style={{
                    color:
                      status === "today"
                        ? "var(--icon-green)"
                        : "var(--muted-foreground)",
                  }}
                >
                  {status === "today" ? "Now" : label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. MEAL LOGGER (one state at a time, toggled by pills)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="px-4 pt-5">
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

          {/* ── State A: Empty ── */}
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
                <h2
                  className="font-serif text-xl font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  What are you eating?
                </h2>
                <p
                  className="mt-2 max-w-xs text-sm leading-relaxed"
                  style={{ color: "var(--muted-foreground)" }}
                >
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
                    style={{
                      borderColor: "var(--border)",
                      background: "white",
                      color: "var(--foreground)",
                    }}
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

          {/* ── State B: Analysing ── */}
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
                  { text: "Finding what&apos;s interesting...", opacity: 0.2 },
                ].map(({ text, opacity }) => (
                  <div key={text} className="flex items-center gap-2.5" style={{ opacity }}>
                    <div
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "var(--icon-green)" }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: "var(--muted-foreground)" }}
                      dangerouslySetInnerHTML={{ __html: text }}
                    />
                  </div>
                ))}
              </div>
              <div
                className="mt-5 overflow-hidden rounded-full"
                style={{ height: "3px", background: "var(--muted)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: "62%",
                    background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
                  }}
                />
              </div>
            </div>
          )}

          {/* ── State C: Result ── */}
          {loggerState === "result" && (
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                background: "white",
                border: "1px solid var(--border)",
                boxShadow: "0 4px 24px rgba(26,46,18,0.08)",
              }}
            >
              {/* Meal header row */}
              <div
                className="flex items-center gap-3 border-b px-5 py-4"
                style={{ borderColor: "var(--border)" }}
              >
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
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    7:42am · Breakfast
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className="font-mono text-2xl font-bold leading-none"
                    style={{ color: "var(--icon-green)" }}
                  >
                    71
                  </p>
                  <p className="mt-0.5 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    /100
                  </p>
                </div>
              </div>

              {/* Score bars */}
              <div className="space-y-3 px-5 py-4">
                <ScoreBar label="Prebiotic fibre"   score={72} />
                <ScoreBar label="Probiotic load"    score={18} />
                <ScoreBar label="Diversity"         score={55} />
                <ScoreBar label="Anti-inflammatory" score={80} />
              </div>

              {/* Dark insight panel */}
              <div
                className="mx-5 mb-2 overflow-hidden rounded-xl"
                style={{ background: "var(--foreground)" }}
              >
                <div className="px-4 py-4">
                  <p
                    className="mb-2 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--icon-lime)" }}
                  >
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

              {/* Tags */}
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

              {/* CTA */}
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

        {/* ══════════════════════════════════════════════════════════════════
            4. TODAY'S MEALS
        ══════════════════════════════════════════════════════════════════ */}
        <div className="px-4 pt-5">
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
            {/* Logged meal */}
            <div
              className="flex items-center gap-3 border-b px-4 py-3.5"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: "var(--icon-green)" }}
              />
              <p className="flex-1 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Overnight oats with banana
              </p>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                7:42am
              </span>
              <span
                className="w-7 text-right font-mono text-sm font-bold"
                style={{ color: "var(--icon-green)" }}
              >
                71
              </span>
            </div>

            {/* Empty slots */}
            {(["Lunch not logged yet", "Dinner not logged yet"] as string[]).map(
              (label, i) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-4 py-3.5 opacity-40"
                  style={{ borderTop: i === 0 ? undefined : `1px solid var(--border)` }}
                >
                  <div
                    className="h-2 w-2 shrink-0 rounded-full border"
                    style={{ borderColor: "var(--border)" }}
                  />
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {label}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            5. BIOTICS PROFILE — mini rings
        ══════════════════════════════════════════════════════════════════ */}
        <div className="px-4 pt-5">
          <p
            className="mb-3 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            Your Biotics Profile
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Prebiotic",
                score: 71,
                delta: "↑ +4 this week",
                color: "var(--icon-green)",
                bg: "color-mix(in srgb, var(--icon-green) 6%, white)",
              },
              {
                label: "Probiotic",
                score: 23,
                delta: "Needs work",
                color: "var(--icon-orange)",
                bg: "color-mix(in srgb, var(--icon-orange) 6%, white)",
              },
              {
                label: "Postbiotic",
                score: 48,
                delta: "Stable",
                color: "var(--muted-foreground)",
                bg: "white",
              },
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
                <p
                  className="mb-2 text-[11px] font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {label}
                </p>
                <MiniRing score={score} color={color} />
                <p
                  className="mt-2 text-center text-[10px] font-medium leading-tight"
                  style={{ color }}
                >
                  {delta}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            6. CONSULTATION — active + locked
        ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-3 px-4 pt-5">
          {/* Active */}
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
                Weekly · EatoBiotics Consultation
              </p>
              <h3 className="font-serif text-base font-bold leading-snug text-white">
                Your weekly sit-down with EatoBiotics
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.50)" }}
              >
                A 30-minute AI consultation grounded in your week&apos;s meals and scores.
                One session per week.
              </p>
              <button
                className="mt-4 w-full rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--icon-green)" }}
              >
                Book Sunday →
              </button>
            </div>
          </div>

          {/* Locked */}
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
                    Weekly · EatoBiotics Consultation
                  </p>
                  <h3 className="font-serif text-base font-bold leading-snug text-white">
                    Your weekly sit-down with EatoBiotics
                  </h3>
                  <p
                    className="mt-2 text-sm leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.50)" }}
                  >
                    A 30-minute AI consultation grounded in your week&apos;s meals and scores.
                    One session per week.
                  </p>
                </div>
                <Lock size={16} color="rgba(255,255,255,0.35)" className="mt-1 shrink-0" />
              </div>
              <button
                className="mt-4 w-full rounded-xl border py-2.5 text-sm font-bold"
                style={{
                  borderColor: "rgba(255,255,255,0.20)",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                Unlock with Restore →
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            7. MONTHLY FOCUS
        ══════════════════════════════════════════════════════════════════ */}
        <div className="px-4 pb-10 pt-5">
          <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{
              background: "white",
              border: "1px solid var(--border)",
              boxShadow: "0 2px 12px rgba(26,46,18,0.05)",
            }}
          >
            {/* Left gradient accent */}
            <div
              className="absolute inset-y-0 left-0 w-[3px]"
              style={{
                background:
                  "linear-gradient(to bottom, var(--icon-lime), var(--icon-green), var(--icon-teal))",
              }}
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
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}
              >
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
        </div>

      </div>
    </div>
  )
}
