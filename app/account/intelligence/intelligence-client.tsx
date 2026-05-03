"use client"

import { useState, useCallback } from "react"
import {
  Brain, RefreshCw, AlertCircle, TrendingUp, TrendingDown,
  Minus, Zap, Star, AlertTriangle, ArrowRight, Loader2,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThinkingStream } from "@/components/analyse/thinking-stream"

/* ── Types ──────────────────────────────────────────────────────────── */

interface BioticStrength {
  strength: "strong" | "moderate" | "low"
  note: string
}

interface FoodIntelligenceReport {
  headline: string
  overallPattern: string
  gutScore: {
    average: number
    trend: "improving" | "stable" | "declining"
    trendNote: string
  }
  bioticProfile: {
    prebiotic:  BioticStrength
    probiotic:  BioticStrength
    postbiotic: BioticStrength
  }
  topFoods: Array<{ name: string; emoji: string; biotic: string; count: number }>
  missingFoods: Array<{ name: string; emoji: string; biotic: string; why: string }>
  patterns: Array<{
    type: "gap" | "strength" | "habit"
    title: string
    detail: string
    priority: "high" | "medium" | "low"
  }>
  nutritionAverage: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fibre_g: number
  }
  nextSteps: string[]
  gutHealthFingerprint: string
  mealCount: number
}

type State =
  | { kind: "idle" }
  | { kind: "streaming"; thinking: string; thinkingDone: boolean }
  | { kind: "result"; report: FoodIntelligenceReport }
  | { kind: "error"; message: string }

/* ── Config ─────────────────────────────────────────────────────────── */

const BIOTIC_COLOR: Record<string, string> = {
  prebiotic:  "var(--icon-lime)",
  probiotic:  "var(--icon-green)",
  postbiotic: "var(--icon-teal)",
  protein:    "var(--icon-yellow)",
}

const BIOTIC_BG: Record<string, string> = {
  prebiotic:  "color-mix(in srgb, var(--icon-lime) 12%, transparent)",
  probiotic:  "color-mix(in srgb, var(--icon-green) 12%, transparent)",
  postbiotic: "color-mix(in srgb, var(--icon-teal) 12%, transparent)",
  protein:    "color-mix(in srgb, var(--icon-yellow) 12%, transparent)",
}

function strengthFill(s: "strong" | "moderate" | "low") {
  return s === "strong" ? 1 : s === "moderate" ? 0.55 : 0.18
}

/* ── Score ring (small, for the average score) ──────────────────────── */

function ScoreRing({ score, trend }: { score: number; trend: "improving" | "stable" | "declining" }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color =
    score >= 80 ? "var(--icon-green)"
    : score >= 65 ? "var(--icon-lime)"
    : score >= 50 ? "var(--icon-yellow)"
    : score >= 35 ? "var(--icon-orange)"
    : "#ef4444"

  const TrendIcon = trend === "improving" ? TrendingUp : trend === "declining" ? TrendingDown : Minus
  const trendColor =
    trend === "improving" ? "var(--icon-green)"
    : trend === "declining" ? "#ef4444"
    : "var(--muted-foreground)"

  return (
    <div className="flex items-center gap-5">
      <div className="relative flex shrink-0 items-center justify-center">
        <svg width="108" height="108" className="-rotate-90">
          <circle cx="54" cy="54" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
          <circle
            cx="54" cy="54" r={r} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute text-center">
          <p className="text-4xl font-bold tabular-nums leading-none" style={{ color }}>{score}</p>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">avg</p>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <TrendIcon size={14} style={{ color: trendColor }} />
          <span className="text-xs font-bold capitalize" style={{ color: trendColor }}>{trend}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">Average across all analysed meals</p>
      </div>
    </div>
  )
}

/* ── Biotic profile bar ─────────────────────────────────────────────── */

function BioticBar({
  label, emoji, color, strength, note,
}: {
  label: string; emoji: string; color: string
  strength: "strong" | "moderate" | "low"; note: string
}) {
  const fill = strengthFill(strength)
  const statusLabel = strength === "strong" ? "Strong" : strength === "moderate" ? "Moderate" : "Low"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">{emoji}</span>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
        <span className="ml-auto text-xs font-semibold" style={{ color }}>{statusLabel}</span>
      </div>
      <div className="h-2 rounded-full bg-border/40 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${fill * 100}%`, background: color }}
        />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{note}</p>
    </div>
  )
}

/* ── Pattern card ───────────────────────────────────────────────────── */

function PatternCard({ pattern }: { pattern: FoodIntelligenceReport["patterns"][number] }) {
  const Icon =
    pattern.type === "strength" ? Star
    : pattern.type === "gap"    ? AlertTriangle
    :                             RefreshCw

  const iconColor =
    pattern.type === "strength" ? "var(--icon-green)"
    : pattern.type === "gap"    ? "var(--icon-orange)"
    :                             "var(--icon-teal)"

  const iconBg =
    pattern.type === "strength" ? "color-mix(in srgb, var(--icon-green) 12%, transparent)"
    : pattern.type === "gap"    ? "color-mix(in srgb, var(--icon-orange) 12%, transparent)"
    :                             "color-mix(in srgb, var(--icon-teal) 12%, transparent)"

  const priorityColor =
    pattern.priority === "high"   ? "#ef4444"
    : pattern.priority === "medium" ? "var(--icon-orange)"
    :                                 "var(--muted-foreground)"

  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-4">
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
        style={{ background: iconBg }}
      >
        <Icon size={15} style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-foreground leading-snug">{pattern.title}</p>
          {pattern.priority === "high" && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ background: priorityColor }}
            >
              priority
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{pattern.detail}</p>
      </div>
    </div>
  )
}

/* ── Idle state (generate button) ───────────────────────────────────── */

function IdleView({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center space-y-6">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-2xl blur-xl opacity-40"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
          />
          <div
            className="relative flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
          >
            <Brain size={32} className="text-white" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xl font-semibold text-foreground">Ready to analyse your patterns</p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Claude will reason through your last 90 days of meal data and surface what&apos;s really driving your gut-health score.
        </p>
      </div>

      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--icon-lime)" }} />
            Food frequency analysis
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--icon-green)" }} />
            Score trend detection
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--icon-teal)" }} />
            Gap identification
          </span>
        </div>
        <p className="text-muted-foreground/60">Takes 30–60 seconds · Requires 3+ meal analyses</p>
      </div>

      <button
        onClick={onGenerate}
        className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-xl hover:shadow-icon-green/30"
      >
        <Brain size={16} /> Generate my Food Intelligence Report
      </button>
    </div>
  )
}

/* ── Streaming state ─────────────────────────────────────────────────── */

function StreamingView({ thinking, thinkingDone }: { thinking: string; thinkingDone: boolean }) {
  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-center gap-2 py-2">
        <Loader2 size={14} className="animate-spin" style={{ color: thinkingDone ? "var(--icon-teal)" : "var(--icon-green)" }} />
        <span className="text-sm font-semibold" style={{ color: thinkingDone ? "var(--icon-teal)" : "var(--icon-green)" }}>
          {thinkingDone ? "Building your report…" : "Claude is analysing your patterns…"}
        </span>
      </div>

      {/* Thinking stream */}
      <ThinkingStream thinking={thinking} isComplete={thinkingDone} />

      {/* Progress hints */}
      {!thinkingDone && (
        <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">While Claude reasons…</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {[
              "Counting food frequency across all your meals",
              "Detecting score trends over time",
              "Finding your biggest biotic gaps",
              "Identifying hidden strengths in your patterns",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ── Error state ─────────────────────────────────────────────────────── */

function ErrorView({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
        <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
        <p className="text-sm text-red-700">{message}</p>
      </div>
      <button
        onClick={onReset}
        className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary/60"
      >
        <RefreshCw size={14} /> Try again
      </button>
    </div>
  )
}

/* ── Full report render ─────────────────────────────────────────────── */

function ReportView({ report, onReset }: { report: FoodIntelligenceReport; onReset: () => void }) {
  const byBiotic = report.topFoods.reduce((acc, f) => {
    if (!acc[f.biotic]) acc[f.biotic] = []
    acc[f.biotic].push(f)
    return acc
  }, {} as Record<string, typeof report.topFoods>)

  return (
    <div className="space-y-5">

      {/* ── Header card ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 border-2 border-transparent"
        style={{
          background: "linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal)) border-box",
          animation: "fadeSlideUp 500ms ease-out both",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1"
            style={{ background: "color-mix(in srgb, var(--icon-teal) 8%, transparent)" }}
          >
            <Brain size={11} style={{ color: "var(--icon-teal)" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>
              Food Intelligence · {report.mealCount} meals
            </span>
          </div>
        </div>
        <h2 className="font-serif text-xl font-bold text-foreground leading-snug mb-2">
          {report.headline}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{report.overallPattern}</p>
        <div
          className="rounded-xl border-l-4 px-4 py-3"
          style={{
            borderLeftColor: "var(--icon-teal)",
            background: "color-mix(in srgb, var(--icon-teal) 6%, transparent)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={11} style={{ color: "var(--icon-teal)" }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>
              Your gut-health fingerprint
            </p>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{report.gutHealthFingerprint}</p>
        </div>
      </div>

      {/* ── Gut score ────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-border bg-card p-5"
        style={{ animation: "fadeSlideUp 500ms ease-out both", animationDelay: "100ms" }}
      >
        <p className="mb-4 border-b border-border pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Average Gut Score
        </p>
        <ScoreRing score={report.gutScore.average} trend={report.gutScore.trend} />
        {report.gutScore.trendNote && (
          <p className="mt-3 text-xs text-muted-foreground bg-secondary/50 rounded-xl px-3 py-2">
            {report.gutScore.trendNote}
          </p>
        )}
      </div>

      {/* ── Biotic profile ───────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-border bg-card p-5 space-y-5"
        style={{ animation: "fadeSlideUp 500ms ease-out both", animationDelay: "200ms" }}
      >
        <p className="border-b border-border pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Biotic Profile
        </p>
        <BioticBar
          label="Prebiotics" emoji="🌱" color="var(--icon-lime)"
          strength={report.bioticProfile.prebiotic.strength}
          note={report.bioticProfile.prebiotic.note}
        />
        <BioticBar
          label="Probiotics" emoji="🦠" color="var(--icon-green)"
          strength={report.bioticProfile.probiotic.strength}
          note={report.bioticProfile.probiotic.note}
        />
        <BioticBar
          label="Postbiotics" emoji="✨" color="var(--icon-teal)"
          strength={report.bioticProfile.postbiotic.strength}
          note={report.bioticProfile.postbiotic.note}
        />
      </div>

      {/* ── Patterns ────────────────────────────────────────────────── */}
      {report.patterns.length > 0 && (
        <div
          className="space-y-3"
          style={{ animation: "fadeSlideUp 500ms ease-out both", animationDelay: "300ms" }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
            Patterns detected
          </p>
          {report.patterns.map((p, i) => (
            <PatternCard key={i} pattern={p} />
          ))}
        </div>
      )}

      {/* ── Top foods ────────────────────────────────────────────────── */}
      {report.topFoods.length > 0 && (
        <div
          className="rounded-2xl border border-border bg-card p-5"
          style={{ animation: "fadeSlideUp 500ms ease-out both", animationDelay: "400ms" }}
        >
          <p className="mb-3 border-b border-border pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Your most frequent foods
          </p>
          {(["prebiotic", "probiotic", "postbiotic", "protein"] as const).map((biotic) => {
            const foods = byBiotic[biotic]
            if (!foods?.length) return null
            const color = BIOTIC_COLOR[biotic]
            const bg    = BIOTIC_BG[biotic]
            const labels: Record<string, string> = {
              prebiotic: "Prebiotic", probiotic: "Probiotic",
              postbiotic: "Postbiotic", protein: "Protein",
            }
            return (
              <div key={biotic} className="mb-4 last:mb-0">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color }}>
                  {labels[biotic]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {foods.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={{ background: bg, color }}
                    >
                      {f.emoji} {f.name}
                      <span className="opacity-50 text-[10px]">×{f.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Missing foods ────────────────────────────────────────────── */}
      {report.missingFoods.length > 0 && (
        <div
          className="space-y-3"
          style={{ animation: "fadeSlideUp 500ms ease-out both", animationDelay: "500ms" }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
            Foods that would shift your score most
          </p>
          {report.missingFoods.map((f, i) => {
            const color = BIOTIC_COLOR[f.biotic] ?? "var(--icon-green)"
            const bg    = BIOTIC_BG[f.biotic]    ?? "color-mix(in srgb, var(--icon-green) 8%, transparent)"
            return (
              <div
                key={i}
                className="rounded-2xl border p-4"
                style={{
                  borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                  background: bg,
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg leading-none">{f.emoji}</span>
                  <p className="text-sm font-semibold" style={{ color }}>{f.name}</p>
                  <span
                    className="ml-auto text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5"
                    style={{
                      color,
                      background: `color-mix(in srgb, ${color} 15%, transparent)`,
                    }}
                  >
                    {f.biotic}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.why}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Nutrition average ────────────────────────────────────────── */}
      {report.nutritionAverage && (
        <div
          className="rounded-2xl border border-border bg-card p-5"
          style={{ animation: "fadeSlideUp 500ms ease-out both", animationDelay: "600ms" }}
        >
          <p className="mb-4 border-b border-border pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Average Meal Nutrition
          </p>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: "Calories", value: report.nutritionAverage.calories, unit: "kcal", color: "var(--icon-yellow)" },
              { label: "Protein",  value: report.nutritionAverage.protein_g, unit: "g",   color: "var(--icon-orange)" },
              { label: "Carbs",    value: report.nutritionAverage.carbs_g,   unit: "g",   color: "var(--icon-teal)" },
              { label: "Fat",      value: report.nutritionAverage.fat_g,     unit: "g",   color: "var(--icon-lime)" },
              { label: "Fibre",    value: report.nutritionAverage.fibre_g,   unit: "g",   color: "var(--icon-green)" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-1 rounded-xl py-3 px-1 text-center"
                style={{ background: `color-mix(in srgb, ${s.color} 10%, transparent)` }}
              >
                <p className="text-lg font-bold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] font-semibold text-muted-foreground">{s.unit}</p>
                <p className="text-[10px] text-muted-foreground/70">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/50">
            * Averaged across all analysed meals · Visual estimates ±20%
          </p>
        </div>
      )}

      {/* ── Next steps ──────────────────────────────────────────────── */}
      {report.nextSteps.length > 0 && (
        <div
          className="space-y-3"
          style={{ animation: "fadeSlideUp 500ms ease-out both", animationDelay: "700ms" }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
            Your next steps
          </p>
          {report.nextSteps.map((step, i) => (
            <div key={i} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
              >
                {i + 1}
              </span>
              <p className="text-sm text-foreground/80 leading-relaxed pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Re-generate / analyse link ────────────────────────────────── */}
      <div
        className="flex flex-col gap-3 sm:flex-row"
        style={{ animation: "fadeSlideUp 500ms ease-out both", animationDelay: "800ms" }}
      >
        <a
          href="/analyse"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl brand-gradient py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Zap size={14} /> Analyse another meal <ArrowRight size={14} />
        </a>
        <button
          onClick={onReset}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60"
        >
          <RefreshCw size={14} /> Regenerate report
        </button>
      </div>

    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────── */

export function IntelligenceClient({ tier }: { tier: "member" | "restore" | "transform" }) {
  const [state, setState] = useState<State>({ kind: "idle" })

  const generate = useCallback(async () => {
    setState({ kind: "streaming", thinking: "", thinkingDone: false })

    try {
      const res = await fetch("/api/food-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        setState({ kind: "error", message: err.error ?? "Generation failed. Please try again." })
        return
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer    = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const payload = line.slice(6).trim()
          if (payload === "[DONE]") break

          let event: Record<string, unknown>
          try { event = JSON.parse(payload) as Record<string, unknown> } catch { continue }

          if (event.type === "thinking") {
            setState((s) =>
              s.kind === "streaming"
                ? { ...s, thinking: s.thinking + (event.text as string) }
                : s
            )
          } else if (event.type === "thinking_complete") {
            setState((s) => s.kind === "streaming" ? { ...s, thinkingDone: true } : s)
          } else if (event.type === "complete") {
            setState({
              kind: "result",
              report: event.result as unknown as FoodIntelligenceReport,
            })
          } else if (event.type === "error") {
            setState({ kind: "error", message: event.message as string })
          }
        }
      }

      // Guard: stream closed before complete
      setState((s) => {
        if (s.kind === "streaming") {
          return { kind: "error", message: "Report generation did not complete. Please try again." }
        }
        return s
      })
    } catch {
      setState({ kind: "error", message: "Something went wrong. Please check your connection and try again." })
    }
  }, [])

  function reset() {
    setState({ kind: "idle" })
  }

  return (
    <div>
      {/* Tier badge */}
      <div className="mb-6 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{
            borderColor: tier === "transform" ? "var(--icon-orange)" : "var(--icon-teal)",
            color:       tier === "transform" ? "var(--icon-orange)" : "var(--icon-teal)",
            background:  tier === "transform"
              ? "color-mix(in srgb, var(--icon-orange) 8%, transparent)"
              : "color-mix(in srgb, var(--icon-teal) 8%, transparent)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: tier === "transform" ? "var(--icon-orange)" : "var(--icon-teal)" }}
          />
          {tier === "transform" ? "Transform" : "Restore"} · Food Intelligence
        </span>
      </div>

      {state.kind === "idle" && <IdleView onGenerate={generate} />}
      {state.kind === "streaming" && (
        <StreamingView thinking={state.thinking} thinkingDone={state.thinkingDone} />
      )}
      {state.kind === "result" && (
        <ReportView report={state.report} onReset={reset} />
      )}
      {state.kind === "error" && (
        <ErrorView message={state.message} onReset={reset} />
      )}
    </div>
  )
}
