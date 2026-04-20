"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Camera, RefreshCw, ArrowRight, Loader2, AlertCircle,
  Sparkles, BookmarkPlus, Check, TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { saveMealAnalysis } from "@/lib/local-storage"

/* ── Types ──────────────────────────────────────────────────────────── */

type BioticType = "prebiotic" | "probiotic" | "postbiotic" | "protein"

interface AnalysedFood {
  name: string
  emoji: string
  biotic: BioticType
  confidence: "high" | "medium" | "low"
}

interface Nutrition {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fibre_g: number
}

interface AnalysisResult {
  score: number
  boostedScore?: number
  prebioticStrength: "strong" | "moderate" | "low"
  foods: AnalysedFood[]
  missingBiotics: string[]
  whatThisMealDoes: string
  suggestions: string[]
  overallAssessment: string
  nutrition?: Nutrition
}

type State =
  | { kind: "idle" }
  | { kind: "loading"; previewUrl: string }
  | { kind: "streaming"; previewUrl: string; thinking: string; thinkingDone: boolean }
  | { kind: "result"; previewUrl: string; result: AnalysisResult }
  | { kind: "error"; previewUrl: string; message: string }

/* ── Biotic styling ─────────────────────────────────────────────────── */

const BIOTIC_CONFIG: Record<BioticType, { label: string; color: string; bg: string }> = {
  prebiotic:  { label: "Prebiotic",  color: "var(--icon-lime)",   bg: "color-mix(in srgb, var(--icon-lime) 15%, transparent)" },
  probiotic:  { label: "Probiotic",  color: "var(--icon-green)",  bg: "color-mix(in srgb, var(--icon-green) 15%, transparent)" },
  postbiotic: { label: "Postbiotic", color: "var(--icon-teal)",   bg: "color-mix(in srgb, var(--icon-teal) 15%, transparent)" },
  protein:    { label: "Protein",    color: "var(--icon-yellow)", bg: "color-mix(in srgb, var(--icon-yellow) 15%, transparent)" },
}

const TRIFECTA_CONFIG: Record<string, { add: string; examples: string[]; icon: string; color: string; bg: string; border: string }> = {
  prebiotic: {
    add: "Add prebiotic fibre",
    examples: ["oats", "garlic", "legumes", "wholegrains"],
    icon: "🌱",
    color: "var(--icon-lime)",
    bg: "color-mix(in srgb, var(--icon-lime) 8%, transparent)",
    border: "color-mix(in srgb, var(--icon-lime) 30%, transparent)",
  },
  probiotic: {
    add: "Add a probiotic boost",
    examples: ["yogurt", "kefir", "kimchi", "sauerkraut"],
    icon: "🦠",
    color: "var(--icon-green)",
    bg: "color-mix(in srgb, var(--icon-green) 8%, transparent)",
    border: "color-mix(in srgb, var(--icon-green) 30%, transparent)",
  },
  postbiotic: {
    add: "Add a postbiotic source",
    examples: ["sourdough", "aged cheese", "ACV dressing"],
    icon: "✨",
    color: "var(--icon-teal)",
    bg: "color-mix(in srgb, var(--icon-teal) 8%, transparent)",
    border: "color-mix(in srgb, var(--icon-teal) 30%, transparent)",
  },
}

/* ── Score band ─────────────────────────────────────────────────────── */

function getScoreBand(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Exceptional",       color: "var(--icon-green)" }
  if (score >= 65) return { label: "Strong Foundation", color: "var(--icon-lime)" }
  if (score >= 50) return { label: "Good Start",        color: "var(--icon-yellow)" }
  if (score >= 35) return { label: "Getting There",     color: "var(--icon-orange)" }
  return              { label: "Starting Out",       color: "#ef4444" }
}

/* ── Score display ──────────────────────────────────────────────────── */

function ScoreDisplay({
  score,
  prebioticStrength,
  hasProbiotic,
  hasPostbiotic,
}: {
  score: number
  prebioticStrength: "strong" | "moderate" | "low"
  hasProbiotic: boolean
  hasPostbiotic: boolean
}) {
  const { label, color } = getScoreBand(score)
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  const pillars = [
    {
      icon: "🌱",
      label: "Prebiotics",
      strength: prebioticStrength === "strong" ? 1 : prebioticStrength === "moderate" ? 0.55 : 0.15,
      status: prebioticStrength === "strong" ? "Strong" : prebioticStrength === "moderate" ? "Moderate" : "Low",
      color: "var(--icon-lime)",
      present: prebioticStrength !== "low",
    },
    {
      icon: "🦠",
      label: "Probiotics",
      strength: hasProbiotic ? 0.8 : 0.12,
      status: hasProbiotic ? "Present" : "Not in meal",
      color: "var(--icon-green)",
      present: hasProbiotic,
    },
    {
      icon: "✨",
      label: "Postbiotics",
      strength: hasPostbiotic ? 0.7 : 0.12,
      status: hasPostbiotic ? "Present" : "Not in meal",
      color: "var(--icon-teal)",
      present: hasPostbiotic,
    },
  ]

  return (
    <div
      className="rounded-2xl p-5 border-2 border-transparent"
      style={{
        background: "linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal)) border-box",
      }}
    >
      {/* Main score */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative flex shrink-0 items-center justify-center">
          <svg width="130" height="130" className="-rotate-90">
            <circle cx="65" cy="65" r={r} fill="none" stroke="currentColor" strokeWidth="9" className="text-border" />
            <circle
              cx="65" cy="65" r={r} fill="none"
              stroke={color} strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-5xl font-bold tabular-nums leading-none" style={{ color }}>{score}</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Gut Score</p>
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold font-serif tracking-tight" style={{ color }}>{label}</p>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {score >= 65
              ? "This meal is working well for your gut microbiome."
              : score >= 50
              ? "A decent foundation — small additions can boost it significantly."
              : "A starting point — the suggestions below will transform this meal."}
          </p>
        </div>
      </div>

      {/* Three pillar indicators */}
      <div className="space-y-3">
        {pillars.map((p) => (
          <div key={p.label} className="flex items-center gap-3">
            <span className="w-5 text-base leading-none">{p.icon}</span>
            <span className="w-20 shrink-0 text-xs font-medium text-foreground/70">{p.label}</span>
            <div className="flex-1 h-2.5 rounded-full bg-border/50 overflow-hidden">
              <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${p.strength * 100}%`, background: p.color, opacity: p.present ? 1 : 0.4 }}
              />
            </div>
            <span
              className="w-24 shrink-0 text-right text-xs font-semibold"
              style={{ color: p.present ? p.color : "var(--muted-foreground)" }}
            >
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Boosted score card ─────────────────────────────────────────────── */

function BoostedScoreCard({ currentScore, boostedScore }: { currentScore: number; boostedScore: number }) {
  const current = getScoreBand(currentScore)
  const boosted = getScoreBand(boostedScore)
  const gain = boostedScore - currentScore

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} style={{ color: "var(--icon-green)" }} />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
            Your score potential
          </p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Add the suggestions below to reach this score
        </p>
      </div>

      <div className="flex items-stretch divide-x divide-border">
        {/* Current */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Now</p>
          <p className="text-4xl font-bold tabular-nums" style={{ color: current.color }}>{currentScore}</p>
          <p className="text-xs font-semibold" style={{ color: current.color }}>{current.label}</p>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center px-3">
          <div className="flex flex-col items-center gap-1">
            <ArrowRight size={18} style={{ color: "var(--icon-green)" }} />
            <span
              className="text-[10px] font-bold"
              style={{ color: "var(--icon-green)" }}
            >
              +{gain}
            </span>
          </div>
        </div>

        {/* Boosted */}
        <div
          className="flex-1 flex flex-col items-center justify-center gap-1 px-4 py-5"
          style={{ background: "color-mix(in srgb, var(--icon-green) 6%, transparent)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
            With boosts
          </p>
          <p className="text-4xl font-bold tabular-nums" style={{ color: boosted.color }}>{boostedScore}</p>
          <p className="text-xs font-semibold" style={{ color: boosted.color }}>{boosted.label}</p>
        </div>
      </div>
    </div>
  )
}

/* ── Nutrition panel ────────────────────────────────────────────────── */

function NutritionPanel({ nutrition }: { nutrition: Nutrition }) {
  const stats = [
    { label: "Calories", value: nutrition.calories, unit: "kcal", color: "var(--icon-yellow)" },
    { label: "Protein",  value: nutrition.protein_g, unit: "g",   color: "var(--icon-orange)" },
    { label: "Carbs",    value: nutrition.carbs_g,   unit: "g",   color: "var(--icon-teal)" },
    { label: "Fat",      value: nutrition.fat_g,     unit: "g",   color: "var(--icon-lime)" },
    { label: "Fibre",    value: nutrition.fibre_g,   unit: "g",   color: "var(--icon-green)" },
  ]

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="mb-4 border-b border-border pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Estimated Nutrition
      </p>
      <div className="grid grid-cols-5 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1 rounded-xl py-3 px-1 text-center"
            style={{ background: `color-mix(in srgb, ${s.color} 10%, transparent)` }}
          >
            <p className="text-lg font-bold tabular-nums leading-none" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground">{s.unit}</p>
            <p className="text-[10px] text-muted-foreground/70">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground/50">
        * Visual estimates based on portion size — typical accuracy ±20%
      </p>
    </div>
  )
}

/* ── Image compression ──────────────────────────────────────────────── */

function compressImage(file: File): Promise<{ base64: string; mimeType: "image/jpeg" | "image/png" | "image/webp" }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img")
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1200
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const base64 = canvas.toDataURL("image/jpeg", 0.85).replace(/^data:image\/jpeg;base64,/, "")
      resolve({ base64, mimeType: "image/jpeg" })
    }
    img.onerror = reject
    img.src = url
  })
}

/* ── Upload zone ────────────────────────────────────────────────────── */

function UploadZone({ onFile }: { onFile: (file: File) => void }) {
  const inputRef    = useRef<HTMLInputElement>(null)
  const cameraRef   = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return
    onFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
      className={cn(
        "relative flex flex-col items-center justify-center gap-6 rounded-3xl border-2 p-12 sm:p-16 text-center transition-all duration-200",
        dragging
          ? "border-[var(--icon-green)] bg-[var(--icon-green)]/5 scale-[1.01]"
          : "border-dashed border-border"
      )}
    >
      {/* Browse from library (desktop + mobile gallery) */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {/* Camera capture — opens rear camera directly on mobile */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {/* Icon */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-2xl blur-xl opacity-40"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        />
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        >
          <Camera size={32} className="text-white" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xl font-semibold text-foreground">Scan your meal</p>
        <p className="text-sm text-muted-foreground">
          Take a photo or upload from your library
        </p>
      </div>

      {/* Two CTAs: camera (mobile-first) + browse */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="brand-gradient flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-md shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-icon-green/30"
        >
          <Camera size={16} /> Take photo
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
        >
          Choose from library
        </button>
      </div>

      {/* Biotic pill decorations */}
      <div className="flex items-center gap-2 opacity-40">
        <div className="biotic-pill" style={{ background: "var(--icon-lime)" }} />
        <div className="biotic-pill" style={{ background: "var(--icon-green)" }} />
        <div className="biotic-pill" style={{ background: "var(--icon-teal)" }} />
      </div>
    </div>
  )
}

/* ── Loading state ──────────────────────────────────────────────────── */

function LoadingView({ previewUrl }: { previewUrl: string }) {
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl">
        <Image src={previewUrl} alt="Your meal" width={600} height={400} className="w-full object-cover max-h-72" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--icon-green)]/20 to-transparent animate-scan" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl bg-background/90 backdrop-blur-sm px-5 py-3 flex items-center gap-3 shadow-lg">
            <Loader2 size={18} className="animate-spin text-[var(--icon-green)]" />
            <span className="text-sm font-semibold">EatoBiotics is analysing your meal…</span>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Identifying every food and scoring against the 3 biotics framework
      </p>
    </div>
  )
}

/* ── Streaming / thinking state ─────────────────────────────────────── */

function StreamingView({
  previewUrl,
  thinking,
  thinkingDone,
}: {
  previewUrl: string
  thinking: string
  thinkingDone: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  // Auto-collapse once thinking is done and result is building
  // (thinkingDone signals Claude finished reasoning, result is incoming)

  return (
    <div className="space-y-4">
      {/* Meal image */}
      <div className="relative overflow-hidden rounded-2xl">
        <Image
          src={previewUrl} alt="Your meal"
          width={600} height={400}
          className="w-full object-cover max-h-72"
          unoptimized
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/60 to-transparent" />
      </div>

      {/* Status pill */}
      <div className="flex items-center justify-center gap-2">
        {thinkingDone ? (
          <>
            <Loader2 size={14} className="animate-spin" style={{ color: "var(--icon-teal)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--icon-teal)" }}>
              Building your result…
            </span>
          </>
        ) : (
          <>
            <Loader2 size={14} className="animate-spin" style={{ color: "var(--icon-green)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--icon-green)" }}>
              Claude is reasoning through your meal…
            </span>
          </>
        )}
      </div>

      {/* Live thinking stream */}
      {thinking && (
        <div className="rounded-2xl border border-border bg-secondary/30 overflow-hidden">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ background: thinkingDone ? "var(--icon-teal)" : "var(--icon-green)" }}
              />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {thinkingDone ? "Claude's reasoning" : "Claude is thinking…"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{expanded ? "▲ hide" : "▼ show"}</span>
          </button>

          {expanded && (
            <div className="px-4 pb-4 max-h-52 overflow-y-auto">
              <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
                {thinking}
                {!thinkingDone && (
                  <span className="inline-block w-1.5 h-3.5 bg-muted-foreground/50 animate-pulse ml-0.5 align-middle" />
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Results view ───────────────────────────────────────────────────── */

function ResultsView({
  previewUrl,
  result,
  onReset,
}: {
  previewUrl: string
  result: AnalysisResult
  onReset: () => void
}) {
  const [saved, setSaved] = useState(false)

  const score = typeof result.score === "number" ? Math.round(result.score) : 50
  const boostedScore = typeof result.boostedScore === "number" ? Math.round(result.boostedScore) : undefined
  const showBoostCard = boostedScore !== undefined && boostedScore > score + 2

  const hasProbiotic = result.foods.some((f) => f.biotic === "probiotic")
  const hasPostbiotic = result.foods.some((f) => f.biotic === "postbiotic")

  const byBiotic = result.foods.reduce((acc, f) => {
    if (!acc[f.biotic]) acc[f.biotic] = []
    acc[f.biotic].push(f)
    return acc
  }, {} as Record<BioticType, AnalysedFood[]>)

  function handleSave() {
    const today = new Date().toISOString().slice(0, 10)
    saveMealAnalysis({
      id: crypto.randomUUID(),
      date: today,
      score,
      boostedScore,
      scoreBand: getScoreBand(score).label,
      foods: result.foods.map((f) => ({ name: f.name, emoji: f.emoji, biotic: f.biotic })),
      missingBiotics: result.missingBiotics,
      whatThisMealDoes: result.whatThisMealDoes,
      suggestions: result.suggestions,
      nutrition: result.nutrition,
    })
    setSaved(true)
  }

  return (
    <div className="space-y-5">

      {/* Meal photo — full width at top */}
      <div className="relative overflow-hidden rounded-2xl">
        <Image
          src={previewUrl} alt="Your meal"
          width={600} height={400}
          className="w-full object-cover max-h-72"
          unoptimized
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/60 to-transparent" />
      </div>

      {/* Score display */}
      <ScoreDisplay
        score={score}
        prebioticStrength={result.prebioticStrength ?? "low"}
        hasProbiotic={hasProbiotic}
        hasPostbiotic={hasPostbiotic}
      />

      {/* Boosted score potential */}
      {showBoostCard && (
        <BoostedScoreCard currentScore={score} boostedScore={boostedScore!} />
      )}

      {/* Nutritional information */}
      {result.nutrition && <NutritionPanel nutrition={result.nutrition} />}

      {/* What this meal does well — lead with positives */}
      {result.whatThisMealDoes && (
        <div className="rounded-2xl border border-[var(--icon-green)]/30 border-l-4 border-l-[var(--icon-green)] bg-[var(--icon-green)]/5 p-5">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles size={14} style={{ color: "var(--icon-green)" }} />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
              What this meal does well
            </p>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{result.whatThisMealDoes}</p>
        </div>
      )}

      {/* Foods identified */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 border-b border-border pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Foods identified
        </p>
        {(["prebiotic", "probiotic", "postbiotic", "protein"] as const).map((biotic) => {
          const foods = byBiotic[biotic]
          if (!foods?.length) return null
          const cfg = BIOTIC_CONFIG[biotic]
          return (
            <div key={biotic} className="mb-4 last:mb-0">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
                {cfg.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {foods.map((f, i) => (
                  <span
                    key={i}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                      f.confidence === "low" && "opacity-60"
                    )}
                    style={{ background: cfg.bg, color: cfg.color }}
                    title={f.confidence === "low" ? "Low confidence" : undefined}
                  >
                    {f.emoji} {f.name}
                    {f.confidence === "low" && <span className="opacity-60">?</span>}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* To complete your gut trifecta — individual branded cards */}
      {result.missingBiotics.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
            To complete your gut trifecta
          </p>
          {result.missingBiotics.map((b) => {
            const cfg = TRIFECTA_CONFIG[b]
            if (!cfg) return null
            return (
              <div
                key={b}
                className="rounded-2xl border p-4"
                style={{ background: cfg.bg, borderColor: cfg.border }}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-lg leading-none">{cfg.icon}</span>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
                    {cfg.add}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cfg.examples.map((ex) => (
                    <span
                      key={ex}
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        background: `color-mix(in srgb, ${cfg.color} 15%, transparent)`,
                        color: cfg.color,
                      }}
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* How to boost this meal — individual numbered cards */}
      {result.suggestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
            How to boost this meal
          </p>
          {result.suggestions.map((s, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
              >
                {i + 1}
              </span>
              <p className="text-sm text-foreground/80 leading-relaxed pt-0.5">{s}</p>
            </div>
          ))}
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        {/* Save to My Meals */}
        <button
          onClick={handleSave}
          disabled={saved}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl border py-3.5 text-sm font-semibold transition-all",
            saved
              ? "border-[var(--icon-green)]/40 bg-[var(--icon-green)]/8 text-[var(--icon-green)] cursor-default"
              : "border-border text-foreground hover:bg-secondary/60"
          )}
        >
          {saved ? (
            <>
              <Check size={15} /> Saved to My Meals
            </>
          ) : (
            <>
              <BookmarkPlus size={15} /> Save to My Meals
            </>
          )}
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/myplate"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl brand-gradient py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Build it in My Plate <ArrowRight size={14} />
          </Link>
          <button
            onClick={onReset}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60"
          >
            <RefreshCw size={14} /> Analyse another meal
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Error view ─────────────────────────────────────────────────────── */

function ErrorView({ message, previewUrl, onReset }: { message: string; previewUrl: string; onReset: () => void }) {
  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden opacity-50">
        <Image src={previewUrl} alt="Your meal" width={600} height={400} className="w-full object-cover max-h-48" unoptimized />
      </div>
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
        <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
        <p className="text-sm text-red-700">{message}</p>
      </div>
      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-medium transition-colors hover:bg-secondary/40"
      >
        <RefreshCw size={14} /> Try again
      </button>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────── */

export function AnalyseClient({ tier }: { tier?: "free" | "grow" | "restore" | "transform" }) {
  const [state, setState] = useState<State>({ kind: "idle" })

  const handleFile = useCallback(async (file: File) => {
    const previewUrl = URL.createObjectURL(file)
    setState({ kind: "loading", previewUrl })

    try {
      const { base64, mimeType } = await compressImage(file)

      // Paid members → streaming endpoint with extended thinking
      // Free tier → existing non-streaming public route
      if (tier && tier !== "free") {
        setState({ kind: "streaming", previewUrl, thinking: "", thinkingDone: false })

        const res = await fetch("/api/analyse/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        })

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({})) as { error?: string }
          setState({ kind: "error", previewUrl, message: err.error ?? "Analysis failed. Please try again." })
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
            } else if (event.type === "complete") {
              setState({ kind: "result", previewUrl, result: event.result as unknown as AnalysisResult })
            } else if (event.type === "error") {
              setState({ kind: "error", previewUrl, message: event.message as string })
            }
          }
        }

        // If we exit the loop without a result (e.g. server closed stream early), flag it
        setState((s) => {
          if (s.kind === "streaming") {
            return { kind: "error", previewUrl, message: "Analysis did not complete. Please try again." }
          }
          return s
        })
      } else {
        // Free tier — existing blocking endpoint
        const res = await fetch("/api/analyse-plate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        })

        const data = await res.json() as Record<string, unknown>
        if (data.error) {
          setState({ kind: "error", previewUrl, message: data.error as string })
          return
        }
        setState({ kind: "result", previewUrl, result: data as unknown as AnalysisResult })
      }
    } catch {
      setState({
        kind: "error",
        previewUrl,
        message: "Something went wrong. Please check your connection and try again.",
      })
    }
  }, [tier])

  function reset() {
    if (state.kind !== "idle" && "previewUrl" in state) {
      URL.revokeObjectURL(state.previewUrl)
    }
    setState({ kind: "idle" })
  }

  return (
    <div>
      {state.kind === "idle" && <UploadZone onFile={handleFile} />}
      {state.kind === "loading" && <LoadingView previewUrl={state.previewUrl} />}
      {state.kind === "streaming" && (
        <StreamingView
          previewUrl={state.previewUrl}
          thinking={state.thinking}
          thinkingDone={state.thinkingDone}
        />
      )}
      {state.kind === "result" && (
        <ResultsView previewUrl={state.previewUrl} result={state.result} onReset={reset} />
      )}
      {state.kind === "error" && (
        <ErrorView message={state.message} previewUrl={state.previewUrl} onReset={reset} />
      )}
    </div>
  )
}
