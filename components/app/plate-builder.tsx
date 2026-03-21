"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, X, RotateCcw, Lightbulb } from "lucide-react"
import { foods, type Food, type BioticType } from "@/lib/foods"
import {
  loadPlate,
  savePlate,
  clearPlate,
  type PlateState,
} from "@/lib/local-storage"
import { calculateBioticsScore, getScoreBand } from "@/lib/scoring"
import { FoodSearch } from "./food-search"
import { cn } from "@/lib/utils"

/* ── Quadrant config ────────────────────────────────────────────────── */

type QuadrantKey = "fiber" | "fermented" | "protein" | "fats"

interface Quadrant {
  key: QuadrantKey
  label: string
  subtitle: string
  icon: string
  color: string
  biotic: BioticType[]
}

const QUADRANTS: Quadrant[] = [
  {
    key: "fiber",
    label: "Prebiotics",
    subtitle: "Feed your gut bacteria",
    icon: "🌱",
    color: "var(--icon-lime)",
    biotic: ["prebiotic"],
  },
  {
    key: "fermented",
    label: "Probiotics",
    subtitle: "Add live cultures",
    icon: "🦠",
    color: "var(--icon-green)",
    biotic: ["probiotic"],
  },
  {
    key: "protein",
    label: "Protein",
    subtitle: "Support gut lining repair",
    icon: "🍗",
    color: "var(--icon-yellow)",
    biotic: ["protein"],
  },
  {
    key: "fats",
    label: "Postbiotics",
    subtitle: "Harvest what your gut makes",
    icon: "✨",
    color: "var(--icon-teal)",
    biotic: ["postbiotic"],
  },
]

const MAX_PER_QUADRANT = 3

function getFoodBySlug(slug: string): Food | undefined {
  return foods.find((f) => f.slug === slug)
}

function plateToFoods(plate: PlateState): Food[] {
  return [
    ...plate.fiber,
    ...plate.fermented,
    ...plate.protein,
    ...plate.fats,
  ]
    .map((s) => getFoodBySlug(s))
    .filter(Boolean) as Food[]
}

/* ── Live score panel ───────────────────────────────────────────────── */

function ScorePanel({ plate }: { plate: PlateState }) {
  const allFoods = plateToFoods(plate)
  const result = allFoods.length > 0 ? calculateBioticsScore(allFoods) : null
  const score = result?.score ?? 0
  const band = result?.band ?? getScoreBand(0)
  const r = 54
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const breakdown = result?.breakdown ?? { prebiotic: 0, probiotic: 0, postbiotic: 0, protein: 0 }
  const maxBreakdown = Math.max(...Object.values(breakdown), 1)

  const BARS = [
    { label: "Prebiotics",  key: "prebiotic"  as const, color: "var(--icon-lime)" },
    { label: "Probiotics",  key: "probiotic"  as const, color: "var(--icon-green)" },
    { label: "Postbiotics", key: "postbiotic" as const, color: "var(--icon-teal)" },
    { label: "Protein",     key: "protein"    as const, color: "var(--icon-yellow)" },
  ]

  return (
    <div
      className="mb-6 rounded-2xl border-2 border-transparent p-5"
      style={{
        background:
          "linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow)) border-box",
      }}
    >
      <div className="flex items-center gap-5">
        {/* Score ring */}
        <div className="relative flex shrink-0 items-center justify-center">
          <svg width="124" height="124" className="-rotate-90">
            <circle cx="62" cy="62" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
            <circle
              cx="62" cy="62" r={r} fill="none"
              stroke={band.color} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-4xl font-bold font-serif tabular-nums leading-none" style={{ color: band.color }}>
              {score}
            </p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Gut Score
            </p>
          </div>
        </div>

        {/* Label + breakdown */}
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold font-serif tracking-tight" style={{ color: band.color }}>
            {allFoods.length === 0 ? "Start adding foods" : band.label}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            {allFoods.length === 0
              ? "Your score updates live as you build your plate"
              : score >= 65
              ? "Great work — your gut will thank you."
              : score >= 40
              ? "Good start — add more variety to boost your score."
              : "Keep going — every food counts."}
          </p>
          <div className="mt-3 space-y-1.5">
            {BARS.map((b) => {
              const pts = breakdown[b.key]
              const pct = pts > 0 ? Math.max((pts / maxBreakdown) * 100, 8) : 0
              return (
                <div key={b.key} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[10px] font-medium text-muted-foreground">{b.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-border/50 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: b.color }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-[10px] font-semibold text-muted-foreground">
                    {pts > 0 ? `+${pts}` : "—"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Food chip ──────────────────────────────────────────────────────── */

function FoodChip({ food, color, onRemove }: { food: Food; color: string; onRemove: () => void }) {
  return (
    <div
      className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
      style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
    >
      <span>{food.emoji}</span>
      <span>{food.name}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: `color-mix(in srgb, ${color} 25%, transparent)` }}
        aria-label={`Remove ${food.name}`}
      >
        <X size={9} />
      </button>
    </div>
  )
}

/* ── Biotic card ────────────────────────────────────────────────────── */

function BioticCard({
  quadrant,
  slugs,
  isActive,
  onActivate,
  onDeactivate,
  onAdd,
  onRemove,
}: {
  quadrant: Quadrant
  slugs: string[]
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
  onAdd: (food: Food) => void
  onRemove: (slug: string) => void
}) {
  const foodItems = slugs.map((s) => getFoodBySlug(s)).filter(Boolean) as Food[]
  const isFull = slugs.length >= MAX_PER_QUADRANT
  const { color } = quadrant

  return (
    <div
      className="rounded-2xl border-2 transition-all duration-200"
      style={
        isActive
          ? {
              borderColor: `color-mix(in srgb, ${color} 50%, transparent)`,
              boxShadow: `0 4px 24px color-mix(in srgb, ${color} 12%, transparent)`,
            }
          : { borderColor: "var(--border)" }
      }
    >
      {/* Top accent bar */}
      <div className="h-[3px] w-full rounded-t-xl" style={{ background: color }} />

      <div className="p-4">
        {/* Header row */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
              style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
            >
              {quadrant.icon}
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">{quadrant.label}</p>
              <p className="text-xs text-muted-foreground">{quadrant.subtitle}</p>
            </div>
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: `color-mix(in srgb, ${color} 15%, transparent)`,
              color,
            }}
          >
            {slugs.length}/{MAX_PER_QUADRANT}
          </span>
        </div>

        {/* Food chips or empty state */}
        {foodItems.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {foodItems.map((food) => (
              <FoodChip
                key={food.slug}
                food={food}
                color={color}
                onRemove={() => onRemove(food.slug)}
              />
            ))}
          </div>
        ) : (
          <div
            className="mb-3 flex h-9 items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground/60"
            style={{ borderColor: `color-mix(in srgb, ${color} 25%, transparent)` }}
          >
            No foods yet
          </div>
        )}

        {/* Add button / inline search */}
        {!isFull && (
          isActive ? (
            <FoodSearch
              onSelect={(food) => { onAdd(food); onDeactivate() }}
              excludeSlugs={slugs}
              filterBiotics={quadrant.biotic}
              placeholder={`Search ${quadrant.label.toLowerCase()}…`}
            />
          ) : (
            <button
              onClick={onActivate}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-2 text-xs font-semibold transition-all hover:text-foreground"
              style={{
                borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
                color: `color-mix(in srgb, ${color} 90%, var(--foreground))`,
              }}
            >
              <Plus size={13} />
              Add food
            </button>
          )
        )}
        {isFull && (
          <p className="mt-1 text-center text-[10px] text-muted-foreground/60">
            Max {MAX_PER_QUADRANT} reached
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Suggestions strip ──────────────────────────────────────────────── */

function SuggestionsStrip({ plate }: { plate: PlateState }) {
  const allFoods = plateToFoods(plate)
  if (allFoods.length === 0) return null
  const result = calculateBioticsScore(allFoods)
  if (result.score >= 80 || result.suggestions.length === 0) return null

  return (
    <div className="mt-5 rounded-2xl border border-[var(--icon-green)]/20 bg-[var(--icon-green)]/5 p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <Lightbulb size={13} style={{ color: "var(--icon-green)" }} />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
          How to boost this plate
        </p>
      </div>
      <ul className="space-y-2">
        {result.suggestions.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: "var(--icon-green)" }}
            >
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Main PlateBuilder ──────────────────────────────────────────────── */

export function PlateBuilder({ onFoodsChange }: { onFoodsChange?: () => void }) {
  const [plate, setPlate] = useState<PlateState | null>(null)
  const [activeQuadrant, setActiveQuadrant] = useState<QuadrantKey | null>(null)

  useEffect(() => {
    setPlate(loadPlate())
  }, [])

  const updatePlate = useCallback(
    (newPlate: PlateState) => {
      setPlate(newPlate)
      savePlate(newPlate)
      onFoodsChange?.()
    },
    [onFoodsChange]
  )

  function addFood(key: QuadrantKey, food: Food) {
    if (!plate) return
    if (plate[key].includes(food.slug)) return
    if (plate[key].length >= MAX_PER_QUADRANT) return
    updatePlate({ ...plate, [key]: [...plate[key], food.slug] })
  }

  function removeFood(key: QuadrantKey, slug: string) {
    if (!plate) return
    updatePlate({ ...plate, [key]: plate[key].filter((s) => s !== slug) })
  }

  function handleReset() {
    clearPlate()
    setPlate(loadPlate())
    onFoodsChange?.()
  }

  if (!plate) return null

  const totalFoods =
    plate.fiber.length + plate.fermented.length + plate.protein.length + plate.fats.length

  return (
    <div>
      <ScorePanel plate={plate} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {QUADRANTS.map((q) => (
          <BioticCard
            key={q.key}
            quadrant={q}
            slugs={plate[q.key]}
            isActive={activeQuadrant === q.key}
            onActivate={() => setActiveQuadrant(q.key)}
            onDeactivate={() => setActiveQuadrant(null)}
            onAdd={(food) => addFood(q.key, food)}
            onRemove={(slug) => removeFood(q.key, slug)}
          />
        ))}
      </div>

      <SuggestionsStrip plate={plate} />

      {totalFoods > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          >
            <RotateCcw size={11} />
            Clear today&apos;s plate
          </button>
        </div>
      )}
    </div>
  )
}
