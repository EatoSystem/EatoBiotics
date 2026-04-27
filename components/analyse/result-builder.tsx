"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight, Sparkles, TrendingUp, RefreshCw, Share2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getPercentile } from "@/lib/percentile"
import { getIdentityLabel } from "@/lib/identity-labels"
import { ShareMealCard } from "./share-meal-card"
import { FreeScanUpsell } from "./free-scan-upsell"

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

export interface AnalysisResult {
  score: number
  boostedScore?: number
  prebioticStrength: "strong" | "moderate" | "low"
  foods: AnalysedFood[]
  missingBiotics: string[]
  whatThisMealDoes: string
  suggestions: string[]
  overallAssessment: string
  nutrition?: Nutrition
  // New extended fields
  mealName?: string
  prebioticScore?: number
  probioticScore?: number
  postbioticScore?: number
  plantDiversityCount?: number
  inflammationIndex?: "anti-inflammatory" | "neutral" | "inflammatory"
  processingLevel?: "whole_food" | "minimally_processed" | "ultra_processed"
  fermentationLevel?: "none" | "low" | "medium" | "high"
  gutLiningSupport?: "strong" | "moderate" | "weak"
  scfaPotential?: "high" | "medium" | "low"
  plateQuadrants?: { fiber: number; fermented: number; protein: number; fats: number }
  keyNutrients?: { magnesium: string; omega3: string; zinc: string; vitaminC: string; b12: string }
  shareHash?: string
}

/* ── Config objects ─────────────────────────────────────────────────── */

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

/* ── Animation helper ───────────────────────────────────────────────── */

function animStyle(delayMs: number): React.CSSProperties {
  return {
    animation: `fadeSlideUp 500ms ease-out both`,
    animationDelay: `${delayMs}ms`,
  }
}

/* ── Score display ──────────────────────────────────────────────────── */

function ScoreDisplay({
  score,
  prebioticStrength,
  hasProbiotic,
  hasPostbiotic,
  prebioticScore,
  probioticScore,
  postbioticScore,
}: {
  score: number
  prebioticStrength: "strong" | "moderate" | "low"
  hasProbiotic: boolean
  hasPostbiotic: boolean
  prebioticScore?: number
  probioticScore?: number
  postbioticScore?: number
}) {
  const { label, color } = getScoreBand(score)
  const percentile    = getPercentile(score)
  const identityLabel = getIdentityLabel(score)
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
      numericScore: prebioticScore,
    },
    {
      icon: "🦠",
      label: "Probiotics",
      strength: hasProbiotic ? 0.8 : 0.12,
      status: hasProbiotic ? "Present" : "Not in meal",
      color: "var(--icon-green)",
      present: hasProbiotic,
      numericScore: probioticScore,
    },
    {
      icon: "✨",
      label: "Postbiotics",
      strength: postbioticScore !== undefined ? postbioticScore / 100
               : hasPostbiotic ? 0.7 : 0.12,
      status: postbioticScore !== undefined
        ? postbioticScore >= 70 ? "Strong"
          : postbioticScore >= 50 ? "Moderate"
          : postbioticScore >= 30 ? "Building"
          : "Low"
        : hasPostbiotic ? "Present" : "Not in meal",
      color: "var(--icon-teal)",
      present: postbioticScore !== undefined ? postbioticScore > 15 : hasPostbiotic,
      numericScore: postbioticScore,
    },
  ]

  return (
    <div
      className="rounded-2xl p-5 border-2 border-transparent"
      style={{
        background:
          "linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal)) border-box",
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
          <p className="mt-2 text-xs text-muted-foreground/70">
            {identityLabel.emoji} {identityLabel.word} · Top {100 - percentile}%
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
              className="w-16 shrink-0 text-right text-xs font-semibold"
              style={{ color: p.present ? p.color : "var(--muted-foreground)" }}
            >
              {p.status}
            </span>
            {p.numericScore !== undefined && (
              <span
                className="w-7 shrink-0 text-right text-xs font-bold tabular-nums"
                style={{ color: p.present ? p.color : "var(--muted-foreground)", opacity: 0.8 }}
              >
                {p.numericScore}
              </span>
            )}
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
            <span className="text-[10px] font-bold" style={{ color: "var(--icon-green)" }}>+{gain}</span>
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

/* ── Gut Metrics Panel ──────────────────────────────────────────────── */

function GutMetricsPanel({ result }: { result: AnalysisResult }) {
  const { plantDiversityCount, inflammationIndex, processingLevel, fermentationLevel } = result

  const inflammationConfig = {
    "anti-inflammatory": { label: "Anti-inflammatory", color: "var(--icon-green)", bg: "color-mix(in srgb, var(--icon-green) 10%, transparent)", icon: "🛡️" },
    "neutral":           { label: "Neutral",            color: "var(--icon-yellow)", bg: "color-mix(in srgb, var(--icon-yellow) 10%, transparent)", icon: "⚖️" },
    "inflammatory":      { label: "Inflammatory",       color: "#ef4444", bg: "color-mix(in srgb, #ef4444 10%, transparent)", icon: "🔥" },
  }

  const processingConfig = {
    "whole_food":         { label: "Whole Food",          icon: "✅", color: "var(--icon-green)" },
    "minimally_processed":{ label: "Minimally Processed", icon: "⚠️",  color: "var(--icon-yellow)" },
    "ultra_processed":    { label: "Ultra-processed",     icon: "🔴", color: "#ef4444" },
  }

  const fermentationPct = {
    "none": 0, "low": 25, "medium": 60, "high": 100,
  } as const

  const inflamm = inflammationIndex ? inflammationConfig[inflammationIndex] : null
  const processing = processingLevel ? processingConfig[processingLevel] : null
  const fermPct = fermentationLevel ? fermentationPct[fermentationLevel] : 0

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="mb-4 border-b border-border pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Gut Health Metrics
      </p>
      <div className="grid grid-cols-2 gap-3">

        {/* Plant Diversity */}
        <div className="rounded-xl p-4" style={{ background: "color-mix(in srgb, var(--icon-lime) 8%, transparent)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--icon-lime)" }}>
            Plant Diversity
          </p>
          <div className="flex items-end gap-1.5">
            <span className="text-3xl font-bold tabular-nums leading-none" style={{ color: "var(--icon-lime)" }}>
              {plantDiversityCount ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground pb-0.5">plants</span>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">Target: 5–7 per meal</p>
        </div>

        {/* Inflammation */}
        {inflamm && (
          <div className="rounded-xl p-4" style={{ background: inflamm.bg }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: inflamm.color }}>
              Inflammation
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xl leading-none">{inflamm.icon}</span>
              <span className="text-xs font-semibold" style={{ color: inflamm.color }}>{inflamm.label}</span>
            </div>
          </div>
        )}

        {/* Processing Level */}
        {processing && (
          <div className="rounded-xl p-4" style={{ background: "color-mix(in srgb, var(--icon-teal) 8%, transparent)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--icon-teal)" }}>
              Processing
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xl leading-none">{processing.icon}</span>
              <span className="text-xs font-semibold" style={{ color: processing.color }}>{processing.label}</span>
            </div>
          </div>
        )}

        {/* Fermentation Level */}
        <div className="rounded-xl p-4" style={{ background: "color-mix(in srgb, var(--icon-green) 8%, transparent)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--icon-green)" }}>
            Fermentation
          </p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold capitalize" style={{ color: "var(--icon-green)" }}>
              {fermentationLevel ?? "None"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-border/50 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${fermPct}%`, background: "var(--icon-green)" }}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

/* ── Plate Quadrant Map ─────────────────────────────────────────────── */

function PlateQuadrantMap({ plateQuadrants }: { plateQuadrants: { fiber: number; fermented: number; protein: number; fats: number } }) {
  const quadrants = [
    { key: "fiber" as const,    label: "Fibre",     color: "var(--icon-lime)",   emoji: "🌱" },
    { key: "fermented" as const, label: "Fermented", color: "var(--icon-teal)",   emoji: "🦠" },
    { key: "protein" as const,  label: "Protein",   color: "var(--icon-yellow)", emoji: "💪" },
    { key: "fats" as const,     label: "Fats",      color: "var(--icon-orange)", emoji: "🫒" },
  ]

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="mb-4 border-b border-border pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Plate Composition
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Visual plate */}
        <div className="relative w-32 h-32 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {(() => {
              const total = quadrants.reduce((s, q) => s + (plateQuadrants[q.key] || 0), 0) || 100
              let cumulativeAngle = 0
              return quadrants.map((q) => {
                const pct = (plateQuadrants[q.key] || 0) / total
                const angle = pct * 360
                const startAngle = cumulativeAngle
                cumulativeAngle += angle
                const r = 45
                const cx = 50, cy = 50
                const startRad = (startAngle * Math.PI) / 180
                const endRad = ((startAngle + angle) * Math.PI) / 180
                const x1 = cx + r * Math.cos(startRad)
                const y1 = cy + r * Math.sin(startRad)
                const x2 = cx + r * Math.cos(endRad)
                const y2 = cy + r * Math.sin(endRad)
                const largeArc = angle > 180 ? 1 : 0
                const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
                return <path key={q.key} d={d} fill={q.color} opacity={0.85} />
              })
            })()}
            <circle cx="50" cy="50" r="18" fill="var(--background)" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg">🍽️</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 grid grid-cols-2 gap-2 w-full">
          {quadrants.map((q) => (
            <div key={q.key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: q.color }} />
              <span className="text-xs text-muted-foreground">{q.emoji} {q.label}</span>
              <span className="ml-auto text-xs font-bold tabular-nums" style={{ color: q.color }}>
                {plateQuadrants[q.key]}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Key Nutrients Panel ────────────────────────────────────────────── */

function KeyNutrientsPanel({ keyNutrients }: { keyNutrients: AnalysisResult["keyNutrients"] }) {
  if (!keyNutrients) return null

  const nutrients = [
    { key: "magnesium" as const, label: "Magnesium", emoji: "🦴" },
    { key: "omega3" as const,    label: "Omega-3",   emoji: "🐟" },
    { key: "zinc" as const,      label: "Zinc",      emoji: "⚡" },
    { key: "vitaminC" as const,  label: "Vitamin C", emoji: "🍊" },
    { key: "b12" as const,       label: "B12",       emoji: "🔋" },
  ]

  const levelConfig = {
    high:     { color: "var(--icon-green)",  bg: "color-mix(in srgb, var(--icon-green) 12%, transparent)",  label: "High" },
    moderate: { color: "var(--icon-yellow)", bg: "color-mix(in srgb, var(--icon-yellow) 12%, transparent)", label: "Moderate" },
    low:      { color: "var(--muted-foreground)", bg: "color-mix(in srgb, currentColor 5%, transparent)", label: "Low" },
  } as Record<string, { color: string; bg: string; label: string }>

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="mb-4 border-b border-border pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Key Nutrients
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {nutrients.map((n) => {
          const level = keyNutrients[n.key]?.toLowerCase() ?? "low"
          const cfg = levelConfig[level] ?? levelConfig.low
          return (
            <div
              key={n.key}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 min-w-[70px]"
              style={{ background: cfg.bg }}
            >
              <span className="text-xl leading-none">{n.emoji}</span>
              <span className="text-[10px] font-semibold text-muted-foreground text-center">{n.label}</span>
              <span
                className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Assessment Bridge CTA ──────────────────────────────────────────── */

function AssessmentBridgeCTA({
  score,
  mealName,
  shareHash,
  isGuest,
  isFreeUser,
}: {
  score: number
  mealName?: string
  shareHash?: string
  isGuest: boolean
  isFreeUser: boolean
}) {
  function handleShare() {
    const name = mealName ?? "this meal"
    const url = shareHash
      ? `https://eatobiotics.com/analyse/result/${shareHash}`
      : "https://eatobiotics.com/analyse"
    const text = `My ${name} scored ${score}/100 on EatoBiotics — what does yours score? ${url}`

    if (navigator.share) {
      navigator.share({ title: "My EatoBiotics Meal Score", text, url })
    } else {
      navigator.clipboard.writeText(text)
    }
  }

  if (!isGuest && !isFreeUser) {
    // Paid user — share only
    return (
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-semibold text-foreground hover:bg-secondary/60 transition-all"
      >
        <Share2 size={15} /> Share this result
      </button>
    )
  }

  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        background: "linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal)) border-box",
        border: "2px solid transparent",
      }}
    >
      <span className="text-3xl">🌿</span>
      <h3 className="mt-3 font-serif text-xl font-semibold text-foreground">
        You scored <span style={{ color: "var(--icon-green)" }}>{score}</span> on this meal.
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        How does your full food system score?
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        15 questions · Free · Takes 3 minutes
      </p>
      <div className="mt-5 flex flex-col gap-3">
        <Link
          href="/assessment"
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        >
          Get My Full Biotics Score <ArrowRight size={14} />
        </Link>
        {shareHash && (
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-semibold text-foreground hover:bg-secondary/60 transition-all"
          >
            <Share2 size={14} /> Share this result
          </button>
        )}
      </div>
    </div>
  )
}

/* ── ResultBuilder ──────────────────────────────────────────────────── */

interface ResultBuilderProps {
  result: AnalysisResult
  previewUrl?: string
  onReset?: () => void
  isFreeUser?: boolean
  isGuest?: boolean
}

export function ResultBuilder({ result, previewUrl, onReset, isFreeUser = false, isGuest = false }: ResultBuilderProps) {
  const score = typeof result.score === "number" ? Math.round(result.score) : 50
  const boostedScore = typeof result.boostedScore === "number" ? Math.round(result.boostedScore) : undefined
  const showBoostCard = boostedScore !== undefined && boostedScore > score + 2

  const hasProbiotic  = result.foods.some((f) => f.biotic === "probiotic")
  const hasPostbiotic = result.foods.some((f) => f.biotic === "postbiotic")

  const byBiotic = result.foods.reduce((acc, f) => {
    if (!acc[f.biotic]) acc[f.biotic] = []
    acc[f.biotic].push(f)
    return acc
  }, {} as Record<BioticType, AnalysedFood[]>)

  return (
    <>
      {/* Inline keyframe definition — scoped to this component tree */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="space-y-5">


        {/* Meal photo — no delay, instant */}
        {previewUrl && (
          <div className="relative overflow-hidden rounded-2xl" style={animStyle(0)}>
            <Image
              src={previewUrl} alt="Your meal"
              width={600} height={400}
              className="w-full object-cover max-h-72"
              unoptimized
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
        )}

        {/* Score ring + pillars — 0 ms */}
        <div style={animStyle(0)}>
          <ScoreDisplay
            score={score}
            prebioticStrength={result.prebioticStrength ?? "low"}
            hasProbiotic={hasProbiotic}
            hasPostbiotic={hasPostbiotic}
            prebioticScore={result.prebioticScore}
            probioticScore={result.probioticScore}
            postbioticScore={result.postbioticScore}
          />
        </div>

        {/* Nutrition panel — 300 ms */}
        {result.nutrition && (
          <div style={animStyle(300)}>
            <NutritionPanel nutrition={result.nutrition} />
          </div>
        )}

        {/* What this meal does well — 450 ms */}
        {result.whatThisMealDoes && (
          <div style={animStyle(450)}>
            <div className="rounded-2xl border border-[var(--icon-green)]/30 border-l-4 border-l-[var(--icon-green)] bg-[var(--icon-green)]/5 p-5">
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles size={14} style={{ color: "var(--icon-green)" }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                  What this meal does well
                </p>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{result.whatThisMealDoes}</p>
            </div>
          </div>
        )}

        {/* Gut Metrics Panel — 500 ms */}
        {(result.plantDiversityCount !== undefined || result.inflammationIndex || result.processingLevel || result.fermentationLevel) && (
          <div style={animStyle(500)}>
            <GutMetricsPanel result={result} />
          </div>
        )}

        {/* Plate Quadrant Map — 650 ms */}
        {result.plateQuadrants && (
          <div style={animStyle(650)}>
            <PlateQuadrantMap plateQuadrants={result.plateQuadrants} />
          </div>
        )}

        {/* Key Nutrients Panel — 800 ms */}
        {result.keyNutrients && (
          <div style={animStyle(800)}>
            <KeyNutrientsPanel keyNutrients={result.keyNutrients} />
          </div>
        )}

        {/* Foods identified — 600 ms */}
        <div style={animStyle(600)}>
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
        </div>

        {/* Gut trifecta gaps — 750 ms */}
        {result.missingBiotics.length > 0 && (
          <div style={animStyle(750)}>
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
          </div>
        )}

        {/* Suggestions — 900 ms */}
        {result.suggestions.length > 0 && (
          <div style={animStyle(900)}>
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
          </div>
        )}

        {/* Score Potential — 950 ms (near end, after suggestions) */}
        {showBoostCard && (
          <div style={animStyle(950)}>
            <BoostedScoreCard currentScore={score} boostedScore={boostedScore!} />
          </div>
        )}

        {/* Assessment bridge / share CTA — 1000 ms */}
        <div style={animStyle(1000)}>
          <AssessmentBridgeCTA
            score={score}
            mealName={result.mealName}
            shareHash={result.shareHash}
            isGuest={isGuest}
            isFreeUser={isFreeUser}
          />
        </div>

        {/* Share meal card — 1050 ms (non-guest) */}
        {!isGuest && (
          <div style={animStyle(1050)}>
            <ShareMealCard result={result} />
          </div>
        )}

        {/* Free scan upsell — 1100 ms (only for free logged-in users) */}
        {isFreeUser && !isGuest && (
          <div style={animStyle(1100)}>
            <FreeScanUpsell score={result.score} />
          </div>
        )}

        {/* Analyse another meal — minimal reset link */}
        {onReset && (
          <div style={animStyle(1150)}>
            <button
              onClick={onReset}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60"
            >
              <RefreshCw size={14} /> Analyse another meal
            </button>
          </div>
        )}

      </div>
    </>
  )
}

export default ResultBuilder
