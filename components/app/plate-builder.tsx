"use client"

import { useState, useEffect, useCallback } from "react"
import { foods, type Food } from "@/lib/foods"
import { loadPlate, savePlate, clearPlate, type PlateState } from "@/lib/local-storage"
import { FoodSearch } from "./food-search"
import { X, RotateCcw } from "lucide-react"

interface Quadrant {
  key: keyof Pick<PlateState, "fiber" | "fermented" | "protein" | "fats">
  label: string
  subtitle: string
  color: string
  gradient: string
  filterBiotics: ("prebiotic")[] | ("probiotic")[] | ("protein")[] | ("postbiotic")[]
}

const QUADRANTS: Quadrant[] = [
  {
    key: "fiber",
    label: "Fiber Foundation",
    subtitle: "Prebiotic foods",
    color: "var(--icon-lime)",
    gradient: "from-icon-lime/20 to-icon-green/10",
    filterBiotics: ["prebiotic"],
  },
  {
    key: "fermented",
    label: "Fermented",
    subtitle: "Probiotic foods",
    color: "var(--icon-teal)",
    gradient: "from-icon-teal/20 to-icon-green/10",
    filterBiotics: ["probiotic"],
  },
  {
    key: "protein",
    label: "Quality Protein",
    subtitle: "Protein sources",
    color: "var(--icon-yellow)",
    gradient: "from-icon-yellow/20 to-icon-orange/10",
    filterBiotics: ["protein"],
  },
  {
    key: "fats",
    label: "Healthy Fats",
    subtitle: "Postbiotic foods",
    color: "var(--icon-orange)",
    gradient: "from-icon-orange/20 to-icon-yellow/10",
    filterBiotics: ["postbiotic"],
  },
]

function getFoodBySlug(slug: string): Food | undefined {
  return foods.find((f) => f.slug === slug)
}

export function PlateBuilder() {
  const [plate, setPlate] = useState<PlateState | null>(null)
  const [activeQuadrant, setActiveQuadrant] = useState<Quadrant["key"] | null>(null)

  // Load from localStorage on mount
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

  const totalSlots = 4 * 3 // 3 foods per quadrant target
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
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
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
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* Completion bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{completionPct}% complete</span>
          <span>{filledSlots} / {totalSlots} foods</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border">
          <div
            className="brand-gradient h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Plate grid */}
      <div className="grid grid-cols-2 gap-3">
        {QUADRANTS.map((q) => {
          const isActive = activeQuadrant === q.key
          const foodSlugs = plate[q.key]

          return (
            <div key={q.key} className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveQuadrant(isActive ? null : q.key)}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  isActive
                    ? "border-current shadow-md"
                    : "border-border hover:border-current/30"
                }`}
                style={{
                  borderColor: isActive ? q.color : undefined,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: q.color }}
                  />
                  <span className="text-xs font-semibold text-foreground">{q.label}</span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{q.subtitle}</p>

                {/* Food chips */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {foodSlugs.length === 0 ? (
                    <span className="text-[10px] text-muted-foreground/60">
                      Tap to add foods
                    </span>
                  ) : (
                    foodSlugs.map((slug) => {
                      const food = getFoodBySlug(slug)
                      if (!food) return null
                      return (
                        <span
                          key={slug}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px]"
                        >
                          <span>{food.emoji}</span>
                          <span className="text-foreground">{food.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFromQuadrant(q.key, slug)
                            }}
                            className="text-muted-foreground hover:text-red-500"
                          >
                            <X size={8} />
                          </button>
                        </span>
                      )
                    })
                  )}
                </div>
              </button>

              {/* Search dropdown for active quadrant */}
              {isActive && (
                <FoodSearch
                  onSelect={(food) => addToQuadrant(q.key, food)}
                  excludeSlugs={allSlugs}
                  filterBiotics={q.filterBiotics}
                  placeholder={`Add ${q.subtitle.toLowerCase()}…`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
