"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { foods, type Food } from "@/lib/foods"
import { loadPlate, savePlate, clearPlate, type PlateState } from "@/lib/local-storage"
import { FoodSearch } from "./food-search"
import { X, RotateCcw, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types & config ──────────────────────────────────────────────────────────

interface Quadrant {
  key: keyof Pick<PlateState, "fiber" | "fermented" | "protein" | "fats">
  label: string
  subtitle: string
  color: string
  gradient: string
  accentGradient: string
  bgClass: string
  bgActiveClass: string
  activeBorderColor: string
  clipPath: string
  emojiPosition: string
  emojiJustify: string
  filterBiotics: ("prebiotic")[] | ("probiotic")[] | ("protein")[] | ("postbiotic")[]
}

const QUADRANTS: Quadrant[] = [
  {
    key: "fiber",
    label: "Fiber Foundation",
    subtitle: "Prebiotic foods",
    color: "var(--icon-lime)",
    gradient: "from-icon-lime/20 to-icon-green/10",
    accentGradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
    bgClass: "bg-icon-lime/10",
    bgActiveClass: "bg-icon-lime/25",
    activeBorderColor: "var(--icon-lime)",
    clipPath: "polygon(0% 0%, 50% 0%, 50% 50%, 0% 50%)",
    emojiPosition: "top-2.5 left-2.5",
    emojiJustify: "",
    filterBiotics: ["prebiotic"],
  },
  {
    key: "fermented",
    label: "Fermented",
    subtitle: "Probiotic foods",
    color: "var(--icon-teal)",
    gradient: "from-icon-teal/20 to-icon-green/10",
    accentGradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))",
    bgClass: "bg-icon-teal/10",
    bgActiveClass: "bg-icon-teal/25",
    activeBorderColor: "var(--icon-teal)",
    clipPath: "polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)",
    emojiPosition: "top-2.5 right-2.5",
    emojiJustify: "justify-end",
    filterBiotics: ["probiotic"],
  },
  {
    key: "protein",
    label: "Quality Protein",
    subtitle: "Protein sources",
    color: "var(--icon-yellow)",
    gradient: "from-icon-yellow/20 to-icon-orange/10",
    accentGradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))",
    bgClass: "bg-icon-yellow/10",
    bgActiveClass: "bg-icon-yellow/25",
    activeBorderColor: "var(--icon-yellow)",
    clipPath: "polygon(0% 50%, 50% 50%, 50% 100%, 0% 100%)",
    emojiPosition: "bottom-2.5 left-2.5",
    emojiJustify: "",
    filterBiotics: ["protein"],
  },
  {
    key: "fats",
    label: "Healthy Fats",
    subtitle: "Postbiotic foods",
    color: "var(--icon-orange)",
    gradient: "from-icon-orange/20 to-icon-yellow/10",
    accentGradient: "linear-gradient(90deg, var(--icon-orange), var(--icon-yellow))",
    bgClass: "bg-icon-orange/10",
    bgActiveClass: "bg-icon-orange/25",
    activeBorderColor: "var(--icon-orange)",
    clipPath: "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)",
    emojiPosition: "bottom-2.5 right-2.5",
    emojiJustify: "justify-end",
    filterBiotics: ["postbiotic"],
  },
]

function getFoodBySlug(slug: string): Food | undefined {
  return foods.find((f) => f.slug === slug)
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ProgressRing({ completionPct }: { completionPct: number }) {
  const r = 88
  const circumference = 2 * Math.PI * r // ≈ 553

  const ringColor =
    completionPct >= 100
      ? "var(--icon-green)"
      : completionPct >= 67
        ? "var(--icon-teal)"
        : completionPct >= 34
          ? "var(--icon-lime)"
          : "var(--icon-lime)"

  return (
    <svg
      viewBox="0 0 200 200"
      className="absolute inset-0 h-full w-full pointer-events-none z-40"
      aria-hidden="true"
    >
      {/* Track ring */}
      <circle
        cx="100"
        cy="100"
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth="5"
        strokeOpacity="0.6"
      />
      {/* Progress ring */}
      {completionPct > 0 && (
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - completionPct / 100)}
          transform="rotate(-90 100 100)"
          style={{ transition: "stroke-dashoffset 0.6s ease-out, stroke 0.4s ease-out" }}
        />
      )}
    </svg>
  )
}

function PlateCircle({
  plate,
  activeQuadrant,
  completionPct,
  onQuadrantClick,
}: {
  plate: PlateState
  activeQuadrant: Quadrant["key"] | null
  completionPct: number
  onQuadrantClick: (key: Quadrant["key"]) => void
}) {
  return (
    <div className="relative mx-auto w-48 h-48 sm:w-52 sm:h-52">

      {/* Plate circle — clips all quadrant backgrounds */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        {QUADRANTS.map((q) => {
          const isActive = activeQuadrant === q.key
          return (
            <button
              key={q.key}
              type="button"
              onClick={() => onQuadrantClick(q.key)}
              className={cn(
                "absolute inset-0 transition-colors duration-200",
                isActive ? q.bgActiveClass : q.bgClass
              )}
              style={{ clipPath: q.clipPath }}
              aria-label={`Select ${q.label}`}
            />
          )
        })}
      </div>

      {/* Cross dividers */}
      <div className="absolute inset-y-0 left-1/2 w-px bg-border/70 z-10 pointer-events-none -translate-x-px" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-border/70 z-10 pointer-events-none -translate-y-px" />

      {/* Food emojis per quadrant */}
      {QUADRANTS.map((q) => {
        const slugs = plate[q.key]
        const foodItems = slugs.slice(0, 3).map(getFoodBySlug).filter(Boolean) as Food[]
        return (
          <div
            key={q.key}
            className={cn(
              "absolute flex flex-wrap gap-0.5 w-[44%] z-20 pointer-events-none",
              q.emojiPosition,
              q.emojiJustify
            )}
          >
            {foodItems.length > 0 ? (
              foodItems.map((food) => (
                <span
                  key={food.slug}
                  className="text-[18px] sm:text-xl leading-none drop-shadow-sm"
                >
                  {food.emoji}
                </span>
              ))
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-border/60 block" />
            )}
          </div>
        )
      })}

      {/* Center hub */}
      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
        <div className="h-10 w-10 rounded-full bg-background border border-border shadow-md flex items-center justify-center">
          <Image
            src="/eatobiotics-icon.webp"
            alt="EatoBiotics"
            width={24}
            height={24}
            className="h-6 w-6"
          />
        </div>
      </div>

      {/* Progress ring — outermost */}
      <ProgressRing completionPct={completionPct} />
    </div>
  )
}

function FoodRow({ food, onRemove }: { food: Food; onRemove: () => void }) {
  return (
    <div className="group flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/40 transition-colors">
      <span className="text-[22px] leading-none w-7 flex-shrink-0 text-center">
        {food.emoji}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight truncate">
          {food.name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
          {food.tagline}
        </p>
      </div>
      <button
        onClick={onRemove}
        className={cn(
          "flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center",
          "text-muted-foreground transition-all duration-150",
          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
          "hover:bg-red-50 hover:text-red-500"
        )}
        aria-label={`Remove ${food.name}`}
      >
        <X size={11} />
      </button>
    </div>
  )
}

function EmptySlot() {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <div className="h-7 w-7 flex-shrink-0 rounded-md border border-dashed border-border flex items-center justify-center">
        <span className="text-[9px] text-muted-foreground/40 font-bold select-none">+</span>
      </div>
      <div className="flex-1 space-y-1">
        <div className="h-2 w-16 rounded-full bg-border/40" />
        <div className="h-1.5 w-24 rounded-full bg-border/25" />
      </div>
    </div>
  )
}

function QuadrantCard({
  quadrant: q,
  foodSlugs,
  isActive,
  onToggle,
  onRemove,
}: {
  quadrant: Quadrant
  foodSlugs: string[]
  isActive: boolean
  onToggle: () => void
  onRemove: (slug: string) => void
}) {
  const foodItems = foodSlugs.map(getFoodBySlug).filter(Boolean) as Food[]
  const emptyCount = Math.max(0, 3 - foodSlugs.length)
  const badgeDark = q.key === "protein" // yellow badge needs dark text

  return (
    <div
      className="rounded-xl border bg-background overflow-hidden transition-all duration-200"
      style={{
        borderColor: isActive ? q.activeBorderColor : undefined,
        boxShadow: isActive ? `0 4px 16px -4px ${q.color}33` : undefined,
      }}
    >
      {/* Gradient top bar */}
      <div className="h-[3px]" style={{ background: q.accentGradient }} />

      {/* Label row */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: q.color }}
          />
          <span className="text-[11px] font-semibold text-foreground truncate">
            {q.label}
          </span>
        </div>
        <span
          className="flex-shrink-0 ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
          style={{
            backgroundColor: q.color,
            color: badgeDark ? "var(--foreground)" : "#ffffff",
            opacity: foodSlugs.length === 0 ? 0.45 : 1,
          }}
        >
          {foodSlugs.length}/3
        </span>
      </div>
      <p className="px-3 pb-2 text-[10px] text-muted-foreground">{q.subtitle}</p>

      {/* Divider */}
      <div className="h-px bg-border/40" />

      {/* Food rows */}
      {foodItems.map((food) => (
        <FoodRow key={food.slug} food={food} onRemove={() => onRemove(food.slug)} />
      ))}

      {/* Empty slots */}
      {Array.from({ length: emptyCount }).map((_, i) => (
        <EmptySlot key={i} />
      ))}

      {/* Add / done button */}
      <div className="h-px bg-border/40" />
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors hover:bg-secondary/50 rounded-b-xl"
        style={{ color: isActive ? "var(--muted-foreground)" : q.color }}
      >
        <Plus
          size={12}
          className={cn(
            "transition-transform duration-200",
            isActive && "rotate-45"
          )}
        />
        {isActive ? "Done adding" : `Add ${q.subtitle.split(" ")[0].toLowerCase()}`}
      </button>
    </div>
  )
}

// ── Main export ─────────────────────────────────────────────────────────────

export function PlateBuilder() {
  const [plate, setPlate] = useState<PlateState | null>(null)
  const [activeQuadrant, setActiveQuadrant] = useState<Quadrant["key"] | null>(null)

  useEffect(() => {
    setPlate(loadPlate())
  }, [])

  const updatePlate = useCallback((newPlate: PlateState) => {
    setPlate(newPlate)
    savePlate(newPlate)
  }, [])

  function addToQuadrant(quadrant: Quadrant["key"], food: Food) {
    if (!plate) return
    if (plate[quadrant].includes(food.slug)) return
    const updated = { ...plate, [quadrant]: [...plate[quadrant], food.slug] }
    updatePlate(updated)
  }

  function removeFromQuadrant(quadrant: Quadrant["key"], slug: string) {
    if (!plate) return
    const updated = {
      ...plate,
      [quadrant]: plate[quadrant].filter((s) => s !== slug),
    }
    updatePlate(updated)
  }

  function handleReset() {
    clearPlate()
    setPlate(loadPlate())
    setActiveQuadrant(null)
  }

  if (!plate) return null // SSR guard

  const totalSlots = 4 * 3
  const filledSlots =
    plate.fiber.length + plate.fermented.length + plate.protein.length + plate.fats.length
  const completionPct = Math.min(Math.round((filledSlots / totalSlots) * 100), 100)

  const allSlugs = [
    ...plate.fiber,
    ...plate.fermented,
    ...plate.protein,
    ...plate.fats,
  ]

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-serif text-xl font-semibold text-foreground sm:text-2xl">
            EatoBiotics Plate
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Build your ideal plate with all four food groups
          </p>
        </div>
        {filledSlots > 0 && (
          <button
            onClick={handleReset}
            className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* ── Circular plate visualizer ────────────────────────────── */}
      <div className="flex flex-col items-center gap-3">
        <PlateCircle
          plate={plate}
          activeQuadrant={activeQuadrant}
          completionPct={completionPct}
          onQuadrantClick={(key) =>
            setActiveQuadrant(activeQuadrant === key ? null : key)
          }
        />

        {/* Completion label */}
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {completionPct === 100
              ? "Plate complete! 🎉"
              : `${completionPct}% complete`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {filledSlots} of {totalSlots} foods added
          </p>
        </div>

        {/* Legend pills — shortcut to open each card's search */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {QUADRANTS.map((q) => (
            <button
              key={q.key}
              onClick={() =>
                setActiveQuadrant(activeQuadrant === q.key ? null : q.key)
              }
              className={cn(
                "flex items-center gap-1.5 text-[11px] font-medium transition-colors",
                activeQuadrant === q.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: q.color }}
              />
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Quadrant cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {QUADRANTS.map((q) => {
          const isActive = activeQuadrant === q.key
          return (
            <div key={q.key} className="space-y-2">
              <QuadrantCard
                quadrant={q}
                foodSlugs={plate[q.key]}
                isActive={isActive}
                onToggle={() => setActiveQuadrant(isActive ? null : q.key)}
                onRemove={(slug) => removeFromQuadrant(q.key, slug)}
              />
              {isActive && (
                <div className="overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                  <FoodSearch
                    onSelect={(food) => addToQuadrant(q.key, food)}
                    excludeSlugs={allSlugs}
                    filterBiotics={q.filterBiotics}
                    placeholder={`Search ${q.subtitle.toLowerCase()}…`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
